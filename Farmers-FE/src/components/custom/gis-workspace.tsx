import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import { Filter, Layers, Search, Sprout, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractData } from "@/client/lib/api-client";
import { authApi } from "@/client/api/auth/auth-api";
import { plotApi } from "@/pages/admin/plots/api/plot-api";
import { supervisorApi } from "@/pages/admin/supervisors/api/supervisor-api";
import type { MeResponse } from "@/client/api/auth/types";
import type { PlotResponse } from "@/pages/admin/plots/api/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type CropType = "sau-rieng" | "ca-phe";
type GISTab = "all" | CropType;

type LotPoint = PlotResponse;

interface Place {
  label: string;
  query: string;
  type: "Tỉnh/Thành" | "Quận/Huyện";
}

interface District {
  id: string | number;
  name: string;
}

interface ProvinceInput {
  id: string | number;
  name: string;
  districts: District[];
}

interface ProvinceHashValue {
  name: string;
  districts?: Record<string, string>;
}

interface SupervisorOption {
  id: string;
  name: string;
  meta?: string;
}

const EMPTY_LOT: LotPoint = {
  id: "empty",
  lotCode: "N/A",
  plotName: "Lô mới",
  farmerId: "",
  farmerName: "Chưa gán",
  farmerPhone: "",
  farmerCccd: "",
  contractId: "Chưa có hợp đồng",
  province: "N/A",
  district: "N/A",
  areaHa: 0,
  cropType: "ca-phe",
  progress: "on-track",
  lat: 16.2,
  lng: 106.2,
  updatedAt: "-",
};

interface GISWorkspaceProps {
  title: string;
  roleLabel: string;
  description: string;
  initialPlotId?: string;
}

const DEFAULT_POLYGON_META =
  "Chưa có polygon. Dùng công cụ vẽ trên map để mở Sheet chỉnh sửa.";
const LOCAL_POLYGON_KEY = "gis_plot_polygons_v1";
const LOCAL_PLOT_OVERRIDES_KEY = "gis_plot_overrides_v1";
const GIS_MIN_HEIGHT_PX = 560;
const GIS_VIEWPORT_HEIGHT = `clamp(${GIS_MIN_HEIGHT_PX}px, calc(100dvh - 170px), 920px)`;

type PlotFieldOverride = {
  plotName?: string;
  farmerName?: string;
  farmerPhone?: string;
  farmerCccd?: string;
  contractId?: string;
};

const getCropLabel = (crop: CropType) =>
  crop === "sau-rieng" ? "Sầu riêng" : "Cà phê";

const isValidPolygon = (value: unknown): value is Array<[number, number]> => {
  if (!Array.isArray(value) || value.length < 3) {
    return false;
  }

  return value.every(
    (point) =>
      Array.isArray(point) &&
      point.length === 2 &&
      Number.isFinite(Number(point[0])) &&
      Number.isFinite(Number(point[1])),
  );
};

const polygonCenter = (polygon: Array<[number, number]>): [number, number] => {
  const sum = polygon.reduce(
    (acc, [lat, lng]) => ({ lat: acc.lat + lat, lng: acc.lng + lng }),
    { lat: 0, lng: 0 },
  );
  return [sum.lat / polygon.length, sum.lng / polygon.length];
};

export default function GISWorkspace({
  title,
  roleLabel,
  description,
  initialPlotId,
}: GISWorkspaceProps) {
  void title;
  void description;

  const [tab, setTab] = useState<GISTab>("all");
  const [keyword, setKeyword] = useState("");
  const [lots, setLots] = useState<LotPoint[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string>("");
  const [activeLayer, setActiveLayer] = useState<"street" | "satellite">(
    "street",
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [polygonMeta, setPolygonMeta] = useState(DEFAULT_POLYGON_META);
  const [polygonAreaHa, setPolygonAreaHa] = useState<number | null>(null);
  const [polygonCoords, setPolygonCoords] = useState<Array<[number, number]>>(
    [],
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSupervisors, setIsLoadingSupervisors] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 16.2,
    lng: 106.2,
  });
  const [supervisorOptions, setSupervisorOptions] = useState<
    SupervisorOption[]
  >([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [supervisorViewId, setSupervisorViewId] = useState("all");
  const [sheet, setSheet] = useState({
    plotName: "",
    farmerName: "",
    farmerPhone: "",
    farmerCccd: "",
    contractId: "",
    cropType: "ca-phe" as CropType,
  });
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [, setPlotPolygons] = useState<Record<string, Array<[number, number]>>>(
    {},
  );

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const previewPolygonRef = useRef<L.Polygon | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);
  const streetLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);

  const readLocalPolygons = () => {
    try {
      const raw = localStorage.getItem(LOCAL_POLYGON_KEY);
      if (!raw) return {} as Record<string, Array<[number, number]>>;

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const normalized: Record<string, Array<[number, number]>> = {};
      Object.entries(parsed || {}).forEach(([plotId, polygon]) => {
        if (isValidPolygon(polygon)) {
          normalized[plotId] = polygon;
        }
      });
      return normalized;
    } catch {
      return {} as Record<string, Array<[number, number]>>;
    }
  };

  const writeLocalPolygons = (
    value: Record<string, Array<[number, number]>>,
  ) => {
    localStorage.setItem(LOCAL_POLYGON_KEY, JSON.stringify(value));
  };

  const readLocalOverrides = () => {
    try {
      const raw = localStorage.getItem(LOCAL_PLOT_OVERRIDES_KEY);
      if (!raw) return {} as Record<string, PlotFieldOverride>;
      const parsed = JSON.parse(raw) as Record<string, PlotFieldOverride>;
      return parsed || {};
    } catch {
      return {} as Record<string, PlotFieldOverride>;
    }
  };

  const writeLocalOverrides = (value: Record<string, PlotFieldOverride>) => {
    localStorage.setItem(LOCAL_PLOT_OVERRIDES_KEY, JSON.stringify(value));
  };

  const showOnlyPolygon = (lot: LotPoint) => {
    const map = mapRef.current;
    if (!map) return;

    if (previewPolygonRef.current) {
      map.removeLayer(previewPolygonRef.current);
      previewPolygonRef.current = null;
    }

    if (!isValidPolygon(lot.polygon)) {
      return;
    }

    const polygonLayer = L.polygon(lot.polygon, {
      color: "#059669",
      weight: 3,
      fillColor: "#10b981",
      fillOpacity: 0.2,
    }).addTo(map);

    previewPolygonRef.current = polygonLayer;
    map.fitBounds(polygonLayer.getBounds().pad(0.5), {
      animate: true,
      duration: 0.35,
      maxZoom: 15,
    });

    polygonLayer.on("click", (event) => {
      L.DomEvent.stopPropagation(event);
    });
  };

  const hidePreviewPolygon = () => {
    const map = mapRef.current;
    if (!map || !previewPolygonRef.current) return;

    map.removeLayer(previewPolygonRef.current);
    previewPolygonRef.current = null;
  };

  const visibleLots = useMemo(
    () => lots.filter((lot) => tab === "all" || lot.cropType === tab),
    [lots, tab],
  );

  const filteredLotsForMap = useMemo(
    () =>
      visibleLots.filter(
        (lot) =>
          supervisorViewId === "all" || lot.id_suppervisor === supervisorViewId,
      ),
    [visibleLots, supervisorViewId],
  );

  const searchResults = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    return filteredLotsForMap
      .filter(
        (lot) =>
          lot.plotName.toLowerCase().includes(normalized) ||
          lot.lotCode.toLowerCase().includes(normalized) ||
          lot.farmerName.toLowerCase().includes(normalized) ||
          (lot.name_suppervisor || "").toLowerCase().includes(normalized) ||
          lot.province.toLowerCase().includes(normalized) ||
          lot.district.toLowerCase().includes(normalized),
      )
      .slice(0, 8);
  }, [keyword, filteredLotsForMap]);

  const placeSearchResults = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    return allPlaces
      .filter((item) => item.label.toLowerCase().includes(normalized))
      .slice(0, 8);
  }, [allPlaces, keyword]);

  const selectedLot = useMemo(() => {
    return (
      filteredLotsForMap.find((lot) => lot.id === selectedLotId) ??
      filteredLotsForMap[0] ??
      lots[0] ??
      EMPTY_LOT
    );
  }, [filteredLotsForMap, selectedLotId, lots]);

  const selectedSupervisor = useMemo(
    () =>
      supervisorOptions.find((item) => item.id === selectedSupervisorId) ??
      null,
    [supervisorOptions, selectedSupervisorId],
  );

  const focusLot = (
    lot: LotPoint,
    options?: {
      flyTo?: boolean;
      syncForm?: boolean;
    },
  ) => {
    const shouldFly = options?.flyTo ?? true;
    const shouldSyncForm = options?.syncForm ?? true;

    setSelectedLotId(lot.id);
    if (shouldSyncForm) {
      setSelectedSupervisorId(lot.id_suppervisor || "");
      setSheet({
        plotName: lot.plotName,
        farmerName: lot.farmerName,
        farmerPhone: lot.farmerPhone || "",
        farmerCccd: lot.farmerCccd || "",
        contractId: lot.contractId,
        cropType: lot.cropType,
      });
    }

    const map = mapRef.current;
    if (map && shouldFly) {
      map.flyTo([lot.lat, lot.lng], Math.max(map.getZoom(), 9), {
        duration: 0.35,
      });
    }
  };

  const handleSelectLot = (lot: LotPoint) => {
    focusLot(lot);
    setKeyword("");
  };

  const handleCreatePlot = async () => {
    const plotName = sheet.plotName.trim();
    const farmerName = sheet.farmerName.trim();
    const farmerPhone = sheet.farmerPhone.trim();
    const farmerCccd = sheet.farmerCccd.trim();

    // SUP chỉ cập nhật GIS cho lô đã chọn, không tạo lô mới.
    if (roleLabel === "SUPERVISOR") {
      if (!selectedLot?.id || selectedLot.id === "empty") {
        toast.error("Vui lòng chọn lô đất trước khi lưu GIS");
        return;
      }

      if (!isValidPolygon(polygonCoords)) {
        toast.error("Chỉ được lưu khi đã vẽ polygon hợp lệ");
        return;
      }

      const areaHa = polygonAreaHa;
      if (!areaHa || areaHa <= 0) {
        toast.error("Diện tích polygon chưa hợp lệ, vui lòng vẽ lại");
        return;
      }

      setIsSaving(true);
      try {
        const [centerLat, centerLng] = polygonCenter(polygonCoords);
        const response = await plotApi.update(selectedLot.id, {
          lat: centerLat,
          lng: centerLng,
        });

        const updated = response.data.data;
        const updatedWithPolygon = {
          ...updated,
          polygon: polygonCoords,
          hasGis: true,
        };

        setPlotPolygons((prev) => {
          const nextPolygons = {
            ...prev,
            [selectedLot.id]: polygonCoords,
          };
          writeLocalPolygons(nextPolygons);
          return nextPolygons;
        });

        setLots((prev) =>
          prev.map((lot) =>
            lot.id === selectedLot.id ? { ...lot, ...updatedWithPolygon } : lot,
          ),
        );

        focusLot({ ...selectedLot, ...updatedWithPolygon }, { flyTo: true });
        showOnlyPolygon({ ...selectedLot, ...updatedWithPolygon });
        drawnItemsRef.current?.clearLayers();
        setSheetOpen(false);
        toast.success("Đã lưu GIS cho lô đất");
      } catch (error) {
        const message =
          typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message?: unknown }).message === "string"
            ? ((error as { message?: string }).message ?? "")
            : "Lưu GIS thất bại";
        toast.error(message || "Lưu GIS thất bại");
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (!plotName) {
      toast.error("Vui lòng nhập tên lô đất");
      return;
    }

    if (!farmerName || !farmerPhone || !farmerCccd) {
      toast.error("Vui lòng nhập đủ tên nông dân, số điện thoại và CCCD");
      return;
    }

    if (!/^\d{10,11}$/.test(farmerPhone)) {
      toast.error("Số điện thoại nông dân không hợp lệ");
      return;
    }

    if (!/^\d{12}$/.test(farmerCccd)) {
      toast.error("CCCD phải gồm đúng 12 chữ số");
      return;
    }

    if (!isValidPolygon(polygonCoords)) {
      toast.error("Chỉ được lưu khi đã vẽ polygon hợp lệ");
      return;
    }

    const areaHa = polygonAreaHa;
    if (!areaHa || areaHa <= 0) {
      toast.error("Diện tích polygon chưa hợp lệ, vui lòng vẽ lại");
      return;
    }

    if (roleLabel === "ADMIN" && !selectedSupervisorId) {
      toast.error("Vui lòng chọn giám sát viên phụ trách");
      return;
    }

    const supervisorIdPayload = selectedSupervisorId || undefined;
    const supervisorNamePayload = selectedSupervisor?.name || undefined;

    setIsSaving(true);
    try {
      const response = await plotApi.create({
        plotName,
        farmerName,
        farmerPhone,
        farmerCccd,
        contractId: sheet.contractId.trim() || undefined,
        cropType: sheet.cropType,
        areaHa,
        lat: mapCenter.lat,
        lng: mapCenter.lng,
        province:
          selectedLot.province !== "N/A" ? selectedLot.province : undefined,
        district:
          selectedLot.district !== "N/A" ? selectedLot.district : undefined,
        id_suppervisor: supervisorIdPayload,
        name_suppervisor: supervisorNamePayload,
        polygon: polygonCoords,
      });

      const created = {
        ...response.data.data,
        polygon: polygonCoords,
      };
      const createdWithOverride = {
        ...created,
        plotName,
        farmerName,
        farmerPhone,
        farmerCccd,
        contractId: sheet.contractId.trim(),
        id_suppervisor: created.id_suppervisor ?? supervisorIdPayload ?? null,
        name_suppervisor:
          created.name_suppervisor ?? supervisorNamePayload ?? null,
      };

      const updatedOverrides = {
        ...readLocalOverrides(),
        [created.id]: {
          plotName,
          farmerName,
          farmerPhone,
          farmerCccd,
          contractId: sheet.contractId.trim(),
        },
      };
      writeLocalOverrides(updatedOverrides);

      setPlotPolygons((prev) => {
        const nextPolygons = {
          ...prev,
          [created.id]: polygonCoords,
        };
        writeLocalPolygons(nextPolygons);
        return nextPolygons;
      });

      setLots((prev) => [createdWithOverride, ...prev]);
      focusLot(createdWithOverride);
      showOnlyPolygon(createdWithOverride);
      drawnItemsRef.current?.clearLayers();
      setSheetOpen(false);
      void (async () => {
        try {
          const cachedPolygons = readLocalPolygons();
          const overrides = readLocalOverrides();
          const fresh = await plotApi.list({ page: 1, limit: 200 });
          const rows = fresh.data.data.data.map((row) => ({
            ...row,
            polygon: isValidPolygon(row.polygon)
              ? row.polygon
              : (cachedPolygons[row.id] ?? []),
            ...(overrides[row.id] || {}),
          }));
          setLots(rows);
        } catch {
          // Ignore refresh failure because local optimistic state is already shown.
        }
      })();
      toast.success("Đã tạo lô đất mới từ GIS");
    } catch (error) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message?: unknown }).message === "string"
          ? ((error as { message?: string }).message ?? "")
          : "Tạo lô đất thất bại";
      toast.error(message || "Tạo lô đất thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const loadPlots = async () => {
      try {
        const cachedPolygons = readLocalPolygons();
        const overrides = readLocalOverrides();
        setPlotPolygons(cachedPolygons);

        const response = await plotApi.list({ page: 1, limit: 200 });
        const rows = response.data.data.data.map((row) => ({
          ...row,
          polygon: isValidPolygon(row.polygon)
            ? row.polygon
            : (cachedPolygons[row.id] ?? []),
          ...(overrides[row.id] || {}),
        }));
        setLots(rows);

        if (rows.length > 0) {
          const preferredLot =
            (initialPlotId
              ? rows.find((item) => item.id === initialPlotId)
              : null) ?? rows[0];
          setSelectedLotId((prev) =>
            initialPlotId ? preferredLot.id : prev || preferredLot.id,
          );
          setSheet((prev) => ({
            plotName: prev.plotName || preferredLot.plotName,
            farmerName: prev.farmerName || preferredLot.farmerName,
            farmerPhone: prev.farmerPhone || preferredLot.farmerPhone || "",
            farmerCccd: prev.farmerCccd || preferredLot.farmerCccd || "",
            contractId: prev.contractId || preferredLot.contractId,
            cropType: prev.cropType || preferredLot.cropType,
          }));
        }
      } catch (error) {
        const message =
          typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message?: unknown }).message === "string"
            ? ((error as { message?: string }).message ?? "")
            : "Tải dữ liệu lô đất thất bại";
        toast.error(message || "Tải dữ liệu lô đất thất bại");
        setLots([]);
      }
    };

    void loadPlots();
  }, []);

  useEffect(() => {
    if (!initialPlotId) return;
    const targetLot = lots.find((lot) => lot.id === initialPlotId);
    if (!targetLot) return;
    focusLot(targetLot);
  }, [initialPlotId, lots]);

  useEffect(() => {
    let isDisposed = false;

    const loadSupervisors = async () => {
      setIsLoadingSupervisors(true);
      try {
        if (roleLabel === "ADMIN") {
          const fetched: SupervisorOption[] = [];
          let page = 1;
          let totalPages = 1;

          do {
            const response = await supervisorApi.list({
              page,
              limit: 20,
              status: "ACTIVE",
            });

            const payload = response.data.data;
            payload.data
              .filter((row) => Boolean(row.supervisorProfile?.id))
              .forEach((row) => {
                const id = row.supervisorProfile?.id;
                if (!id) return;
                fetched.push({
                  id,
                  name: row.fullName,
                  meta: row.supervisorProfile?.employeeCode,
                });
              });

            totalPages = Math.max(1, payload.totalPages || 1);
            page += 1;
          } while (page <= totalPages);

          if (isDisposed) return;

          const options = Array.from(
            new Map(fetched.map((item) => [item.id, item])).values(),
          );

          setSupervisorOptions(options);
          setSelectedSupervisorId((prev) => {
            if (prev && options.some((item) => item.id === prev)) {
              return prev;
            }
            return options[0]?.id ?? "";
          });
          setSupervisorViewId((prev) => {
            if (prev === "all") {
              return "all";
            }

            if (options.some((item) => item.id === prev)) {
              return prev;
            }

            return "all";
          });
          return;
        }

        if (roleLabel === "SUPERVISOR") {
          const response = await authApi.getMe();
          if (isDisposed) return;

          const me = extractData<MeResponse>(response);
          if (me.supervisorProfile?.id) {
            const options: SupervisorOption[] = [
              {
                id: me.supervisorProfile.id,
                name: me.fullName,
                meta: me.supervisorProfile.employeeCode,
              },
            ];
            setSupervisorOptions(options);
            setSelectedSupervisorId(me.supervisorProfile.id);
            setSupervisorViewId(me.supervisorProfile.id);
            return;
          }
        }

        if (isDisposed) return;
        setSupervisorOptions([]);
        setSelectedSupervisorId("");
        setSupervisorViewId("all");
      } catch {
        if (isDisposed) return;
        setSupervisorOptions([]);
        setSelectedSupervisorId("");
        setSupervisorViewId("all");
      } finally {
        if (!isDisposed) {
          setIsLoadingSupervisors(false);
        }
      }
    };

    void loadSupervisors();
    return () => {
      isDisposed = true;
    };
  }, [roleLabel]);

  useEffect(() => {
    if (roleLabel === "SUPERVISOR" && supervisorOptions.length === 1) {
      const onlyId = supervisorOptions[0].id;
      if (selectedSupervisorId !== onlyId) {
        setSelectedSupervisorId(onlyId);
      }
      if (supervisorViewId !== onlyId) {
        setSupervisorViewId(onlyId);
      }
      return;
    }

    if (
      roleLabel === "ADMIN" &&
      !selectedSupervisorId &&
      supervisorOptions.length > 0
    ) {
      setSelectedSupervisorId(supervisorOptions[0].id);
    }
  }, [roleLabel, selectedSupervisorId, supervisorOptions, supervisorViewId]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      minZoom: 5,
      maxZoom: 18,
    }).setView([16.2, 106.2], 6);

    const streetLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap contributors",
      },
    );

    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles &copy; Esri" },
    );

    streetLayer.addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    const drawControl = new L.Control.Draw({
      position: "topleft",
      draw: {
        polygon: {
          allowIntersection: true,
          showArea: true,
          icon: new L.DivIcon({
            iconSize: new L.Point(6, 6),
            className: "leaflet-div-icon leaflet-editing-icon",
          }),
          touchIcon: new L.DivIcon({
            iconSize: new L.Point(8, 8),
            className:
              "leaflet-div-icon leaflet-editing-icon leaflet-touch-icon",
          }),
        },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);

    markerLayerRef.current = L.layerGroup().addTo(map);
    streetLayerRef.current = streetLayer;
    satelliteLayerRef.current = satelliteLayer;
    mapRef.current = map;

    const toAreaText = (layer: L.Layer) => {
      if (!(layer instanceof L.Polygon)) {
        setPolygonAreaHa(null);
        setPolygonCoords([]);
        return "Polygon đã tạo.";
      }

      const rings = layer.getLatLngs();
      const firstRing = (rings[0] ?? []) as L.LatLng[];
      if (!firstRing.length) {
        setPolygonAreaHa(null);
        setPolygonCoords([]);
        return "Polygon đã tạo.";
      }

      setPolygonCoords(
        firstRing.map((point) => [
          Number(point.lat.toFixed(6)),
          Number(point.lng.toFixed(6)),
        ]),
      );

      const area = L.GeometryUtil.geodesicArea(firstRing);
      const hectares = area / 10000;
      setPolygonAreaHa(hectares);
      return `Polygon: ${area.toFixed(0)} m2 (${hectares.toFixed(2)} ha)`;
    };

    const onDrawCreated: L.LeafletEventHandlerFn = (event) => {
      const drawEvent = event as L.DrawEvents.Created;
      drawnItems.clearLayers();
      drawnItems.addLayer(drawEvent.layer);
      setSheet((prev) => {
        // SUP giữ nguyên thông tin lô đang chọn để không cần nhập tay lại.
        if (roleLabel === "SUPERVISOR") {
          return prev;
        }

        // ADMIN tạo mới thì vẫn reset form như flow hiện tại.
        return {
          ...prev,
          plotName: "",
          farmerName: "",
          farmerPhone: "",
          farmerCccd: "",
          contractId: "",
        };
      });
      setPolygonMeta(toAreaText(drawEvent.layer));
      setSheetOpen(true);
    };

    const onDrawEdited: L.LeafletEventHandlerFn = () => {
      const firstLayer = drawnItems.getLayers()[0];
      if (firstLayer) {
        setPolygonMeta(toAreaText(firstLayer));
      }
    };

    const onDrawDeleted: L.LeafletEventHandlerFn = () => {
      setSheetOpen(false);
      setPolygonAreaHa(null);
      setPolygonCoords([]);
      setPolygonMeta(DEFAULT_POLYGON_META);
    };

    const onMoveEnd = () => {
      const center = map.getCenter();
      setMapCenter({ lat: center.lat, lng: center.lng });
    };

    const onMapClick = () => {
      hidePreviewPolygon();
    };

    drawnItems.on("click", (event: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(event);
    });

    map.on(L.Draw.Event.CREATED, onDrawCreated);
    map.on(L.Draw.Event.EDITED, onDrawEdited);
    map.on(L.Draw.Event.DELETED, onDrawDeleted);
    map.on("moveend", onMoveEnd);
    map.on("click", onMapClick);

    const handleResize = () => map.invalidateSize();
    window.addEventListener("resize", handleResize);
    setTimeout(() => map.invalidateSize(), 80);

    return () => {
      window.removeEventListener("resize", handleResize);
      map.off(L.Draw.Event.CREATED, onDrawCreated);
      map.off(L.Draw.Event.EDITED, onDrawEdited);
      map.off(L.Draw.Event.DELETED, onDrawDeleted);
      map.off("moveend", onMoveEnd);
      map.off("click", onMapClick);
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      searchMarkerRef.current = null;
      streetLayerRef.current = null;
      satelliteLayerRef.current = null;
      drawnItemsRef.current = null;
      previewPolygonRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const container = mapContainerRef.current;
    if (!map || !container || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      if (container.clientHeight > 0 && container.clientWidth > 0) {
        map.invalidateSize();
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/data.json", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const raw = (await response.json()) as
          | ProvinceInput[]
          | Record<string, ProvinceHashValue>;

        const hashInput: ProvinceInput[] = Array.isArray(raw)
          ? raw
          : Object.keys(raw || {}).map((id) => {
              const province = raw[id] || { name: "", districts: {} };
              const districtMap = province.districts || {};
              return {
                id,
                name: province.name,
                districts: Object.keys(districtMap).map((districtId) => ({
                  id: districtId,
                  name: districtMap[districtId],
                })),
              };
            });

        const places: Place[] = [];
        hashInput.forEach((province) => {
          if (!province?.name) {
            return;
          }

          places.push({
            label: province.name,
            query: `${province.name}, Việt Nam`,
            type: "Tỉnh/Thành",
          });

          (province.districts || []).forEach((district) => {
            if (!district?.name) {
              return;
            }

            places.push({
              label: `${district.name} - ${province.name}`,
              query: `${district.name}, ${province.name}, Việt Nam`,
              type: "Quận/Huyện",
            });
          });
        });

        setAllPlaces(places);
      } catch {
        setAllPlaces([]);
      }
    };

    void loadData();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;
    if (!map || !markerLayer) {
      return;
    }

    markerLayer.clearLayers();

    filteredLotsForMap
      .filter((lot) => isValidPolygon(lot.polygon))
      .forEach((lot) => {
        const isSelected = lot.id === selectedLot.id;
        const markerPos = polygonCenter(lot.polygon as Array<[number, number]>);
        const isDurian = lot.cropType === "sau-rieng";

        const baseBgColor = isDurian ? "#65a30d" : "#92400e";
        const activeBgColor = isDurian ? "#84cc16" : "#b45309";
        const cropIcon = isDurian ? "D" : "C";
        const cropLabel = isDurian ? "Sầu riêng" : "Cà phê";

        const icon = L.divIcon({
          className: "",
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          html: `<div style="
            width: 34px;
            height: 34px;
            border-radius: 999px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${isSelected ? activeBgColor : baseBgColor};
            color: #fff;
            border: 2px solid #fff;
            box-shadow: 0 3px 10px rgba(0,0,0,.18);
            font-size: 16px;
            font-weight: 700;
          ">${cropIcon}</div>`,
        });

        L.marker(markerPos, { icon })
          .bindTooltip(`${lot.plotName} (${lot.lotCode}) • ${cropLabel}`, {
            direction: "top",
            offset: [0, -8],
          })
          .on("click", (event: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(event);
            focusLot(lot, {
              flyTo: false,
              syncForm: false,
            });
          })
          .on("dblclick", (event: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(event);
            focusLot(lot);
            showOnlyPolygon(lot);
            setSheetOpen(true);
          })
          .addTo(markerLayer);
      });
  }, [filteredLotsForMap, selectedLot]);

  useEffect(() => {
    const map = mapRef.current;
    const streetLayer = streetLayerRef.current;
    const satelliteLayer = satelliteLayerRef.current;
    if (!map || !streetLayer || !satelliteLayer) {
      return;
    }

    if (activeLayer === "street") {
      if (!map.hasLayer(streetLayer)) {
        streetLayer.addTo(map);
      }
      if (map.hasLayer(satelliteLayer)) {
        map.removeLayer(satelliteLayer);
      }
      return;
    }

    if (!map.hasLayer(satelliteLayer)) {
      satelliteLayer.addTo(map);
    }
    if (map.hasLayer(streetLayer)) {
      map.removeLayer(streetLayer);
    }
  }, [activeLayer]);

  const geocodePlace = async (query: string, label: string) => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    try {
      const url =
        "https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=vn&limit=1&q=" +
        encodeURIComponent(query);

      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        return;
      }

      const results = (await response.json()) as Array<{
        lat: string;
        lon: string;
        display_name: string;
      }>;
      if (!Array.isArray(results) || results.length === 0) {
        return;
      }

      const top = results[0];
      const lat = Number(top.lat);
      const lon = Number(top.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return;
      }

      if (searchMarkerRef.current) {
        map.removeLayer(searchMarkerRef.current);
      }

      searchMarkerRef.current = L.marker([lat, lon]).addTo(map);
      searchMarkerRef.current
        .bindPopup(`<b>${label}</b><br/>${top.display_name}`)
        .openPopup();

      map.flyTo([lat, lon], 12, { duration: 0.8 });
      setKeyword("");
    } catch {
      // Ignore network errors and keep UI responsive.
    }
  };

  const handleSearchSubmit = () => {
    if (searchResults.length > 0) {
      handleSelectLot(searchResults[0]);
      return;
    }

    if (!placeSearchResults.length) {
      return;
    }

    void geocodePlace(placeSearchResults[0].query, placeSearchResults[0].label);
  };

  const hasSearchResults =
    searchResults.length > 0 || placeSearchResults.length > 0;

  return (
    <>
      <section
        className="min-h-0"
        style={{
          minHeight: `${GIS_MIN_HEIGHT_PX}px`,
          height: GIS_VIEWPORT_HEIGHT,
        }}
      >
        <div className="relative isolate h-full overflow-hidden rounded-2xl border border-emerald-200 shadow-sm">
          <div ref={mapContainerRef} className="gis-map h-full w-full" />

          <div className="absolute left-18 right-4 top-4 z-1100">
            <div className="relative w-full max-w-136 rounded-xl border border-emerald-100 bg-white p-1 shadow-xs">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSearchSubmit();
                  }
                }}
                placeholder="Tìm lô, nông dân, tỉnh, thành phố..."
                className="h-10 border-none bg-transparent pl-8 shadow-none focus-visible:ring-0"
              />

              {keyword.trim().length > 0 && (
                <div className="absolute left-2 right-2 top-12 z-1110 rounded-md border bg-white p-1 shadow-lg">
                  {hasSearchResults ? (
                    <>
                      {searchResults.map((lot) => (
                        <button
                          key={`search-${lot.id}`}
                          type="button"
                          onClick={() => handleSelectLot(lot)}
                          className="flex w-full items-center justify-between rounded px-2 py-2 text-left hover:bg-emerald-50"
                        >
                          <span>
                            <span className="block text-sm font-semibold text-emerald-900">
                              {lot.plotName}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {lot.lotCode} • {lot.district}, {lot.province}
                            </span>
                          </span>
                          <Badge
                            variant="outline"
                            className="border-emerald-300 text-emerald-700"
                          >
                            Lô đất
                          </Badge>
                        </button>
                      ))}

                      {placeSearchResults.map((place) => (
                        <button
                          key={`place-${place.type}:${place.query}`}
                          type="button"
                          onClick={() =>
                            void geocodePlace(place.query, place.label)
                          }
                          className="flex w-full items-center justify-between rounded px-2 py-2 text-left hover:bg-sky-50"
                        >
                          <span>
                            <span className="block text-sm font-semibold text-sky-900">
                              {place.label}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              Tìm theo {place.type}
                            </span>
                          </span>
                          <Badge
                            variant="outline"
                            className="border-sky-300 text-sky-700"
                          >
                            {place.type}
                          </Badge>
                        </button>
                      ))}
                    </>
                  ) : (
                    <p className="px-2 py-2 text-sm text-muted-foreground">
                      Không tìm thấy kết quả phù hợp.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="absolute right-4 top-4 z-1100 flex flex-wrap items-center justify-end gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-2 py-1.5 shadow-xs">
              <Layers className="h-4 w-4 text-emerald-700" />
              <Button
                size="sm"
                variant={activeLayer === "street" ? "primary" : "ghost"}
                onClick={() => setActiveLayer("street")}
              >
                Đường phố
              </Button>
              <Button
                size="sm"
                variant={activeLayer === "satellite" ? "primary" : "ghost"}
                onClick={() => setActiveLayer("satellite")}
              >
                Vệ tinh
              </Button>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-2 py-1.5 shadow-xs">
              <Filter className="h-4 w-4 text-emerald-700" />
              <Button
                size="sm"
                variant={tab === "all" ? "primary" : "ghost"}
                onClick={() => setTab("all")}
              >
                Tất cả
              </Button>
              <Button
                size="sm"
                variant={tab === "sau-rieng" ? "primary" : "ghost"}
                onClick={() => setTab("sau-rieng")}
              >
                Sầu riêng
              </Button>
              <Button
                size="sm"
                variant={tab === "ca-phe" ? "primary" : "ghost"}
                onClick={() => setTab("ca-phe")}
              >
                Cà phê
              </Button>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-2 py-1.5 shadow-xs">
              <Users className="h-4 w-4 text-emerald-700" />
              {roleLabel === "SUPERVISOR" ? (
                <span className="min-w-48 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-sm font-medium text-emerald-800">
                  {supervisorOptions[0]?.name || selectedLot.name_suppervisor || "Giám sát viên"}
                </span>
              ) : (
                <select
                  value={supervisorViewId}
                  onChange={(event) => setSupervisorViewId(event.target.value)}
                  disabled={isLoadingSupervisors}
                  className="h-8 min-w-48 rounded-md border border-emerald-200 bg-white px-2 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <option value="all">Xem tất cả giám sát viên</option>
                  {supervisorOptions.map((item) => (
                    <option key={`supervisor-view-${item.id}`} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </section>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="z-1301 w-[92vw] overflow-y-auto px-0 sm:max-w-lg"
        >
          <SheetHeader className="border-b pb-4">
            <SheetTitle>Sheet quản lý lô đất</SheetTitle>
            <SheetDescription>
              Tự mở khi vẽ polygon. Dữ liệu bám theo vị trí hiện tại của bản đồ.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 p-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
              <p className="text-xs uppercase tracking-widest text-emerald-700">
                Lot đang chọn
              </p>
              <p className="mt-1 text-lg font-bold text-emerald-950">
                {selectedLot.plotName}
              </p>
              <p className="text-sm text-emerald-800">
                {selectedLot.lotCode} • {selectedLot.district},{" "}
                {selectedLot.province}
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                Giám sát viên:{" "}
                {selectedLot.name_suppervisor || "Chưa phân công"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheet-lot-name">Tên lô đất</Label>
              <Input
                id="sheet-lot-name"
                value={selectedLot.plotName}
                readOnly
                className="border-slate-200 bg-white text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div className="rounded-xl border border-dashed border-emerald-200 p-3">
              <p className="text-xs text-muted-foreground">
                Vị trí hiện tại của map
              </p>
              <p className="font-semibold text-emerald-900">
                {mapCenter.lat.toFixed(6)}, {mapCenter.lng.toFixed(6)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {polygonMeta}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheet-farmer">Nông dân phụ trách</Label>
              <Input
                id="sheet-farmer"
                value={selectedLot.farmerName}
                readOnly
                className="border-slate-200 bg-white text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheet-farmer-phone">Số điện thoại nông dân</Label>
              <Input
                id="sheet-farmer-phone"
                value={selectedLot.farmerPhone || ""}
                readOnly
                className="border-slate-200 bg-white text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheet-farmer-cccd">CCCD nông dân</Label>
              <Input
                id="sheet-farmer-cccd"
                value={selectedLot.farmerCccd || ""}
                readOnly
                className="border-slate-200 bg-white text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheet-contract">Mã hợp đồng</Label>
              <Input
                id="sheet-contract"
                value={selectedLot.contractId}
                readOnly
                className="border-slate-200 bg-white text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheet-supervisor">Giám sát viên phụ trách</Label>
              <div
                id="sheet-supervisor"
                className="flex h-10 w-full items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-500"
              >
                {selectedSupervisor?.name || supervisorOptions[0]?.name || selectedLot.name_suppervisor || "Giám sát viên"}
              </div>
              {roleLabel === "SUPERVISOR" && (
                <p className="text-xs text-muted-foreground">
                  Role SUPERVISOR chỉ được tạo lô cho chính mình.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheet-crop">Loại cây trồng</Label>
              <div
                id="sheet-crop"
                className="flex h-10 w-full items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-500"
              >
                {getCropLabel(selectedLot.cropType)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-xl border border-dashed p-3">
              <div>
                <p className="text-xs text-muted-foreground">Diện tích</p>
                <p className="font-semibold text-emerald-900">
                  {selectedLot.areaHa} ha
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cập nhật</p>
                <p className="font-semibold text-emerald-900">
                  {selectedLot.updatedAt}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Giống cây</p>
                <p className="font-semibold text-emerald-900">
                  {getCropLabel(selectedLot.cropType)}
                </p>
              </div>
            </div>
          </div>

          <SheetFooter>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() => void handleCreatePlot()}
              disabled={isSaving}
            >
              <Sprout className="mr-2 h-4 w-4" />
              {isSaving ? "Đang lưu..." : "Lưu cập nhật vào luồng GIS"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
