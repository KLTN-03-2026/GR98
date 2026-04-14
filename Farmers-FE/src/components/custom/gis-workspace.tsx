import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import { Filter, Layers, Search, Sprout } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { plotApi, type PlotResponse } from "@/client/lib/api-client";
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

const EMPTY_LOT: LotPoint = {
  id: "empty",
  lotCode: "N/A",
  plotName: "Lô mới",
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
}

const DEFAULT_POLYGON_META =
  "Chưa có polygon. Dùng công cụ vẽ trên map để mở Sheet chỉnh sửa.";
const LOCAL_POLYGON_KEY = "gis_plot_polygons_v1";
const LOCAL_PLOT_OVERRIDES_KEY = "gis_plot_overrides_v1";

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
}: GISWorkspaceProps) {
  void title;
  void roleLabel;
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
  const [polygonCoords, setPolygonCoords] = useState<Array<[number, number]>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 16.2,
    lng: 106.2,
  });
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

  const writeLocalPolygons = (value: Record<string, Array<[number, number]>>) => {
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
    map.fitBounds(polygonLayer.getBounds().pad(0.25), {
      animate: true,
      duration: 0.35,
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

  const searchResults = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    return visibleLots
      .filter(
        (lot) =>
          lot.plotName.toLowerCase().includes(normalized) ||
          lot.lotCode.toLowerCase().includes(normalized) ||
          lot.farmerName.toLowerCase().includes(normalized) ||
          lot.province.toLowerCase().includes(normalized) ||
          lot.district.toLowerCase().includes(normalized),
      )
      .slice(0, 8);
  }, [keyword, visibleLots]);

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
      visibleLots.find((lot) => lot.id === selectedLotId) ??
      visibleLots[0] ??
      lots[0] ??
      EMPTY_LOT
    );
  }, [visibleLots, selectedLotId, lots]);

  const focusLot = (lot: LotPoint) => {
    setSelectedLotId(lot.id);
    setSheet({
      plotName: lot.plotName,
      farmerName: lot.farmerName,
      farmerPhone: lot.farmerPhone || "",
      farmerCccd: lot.farmerCccd || "",
      contractId: lot.contractId,
      cropType: lot.cropType,
    });

    const map = mapRef.current;
    if (map) {
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
        province: selectedLot.province !== "N/A" ? selectedLot.province : undefined,
        district: selectedLot.district !== "N/A" ? selectedLot.district : undefined,
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
          const first = rows[0];
          setSelectedLotId((prev) => prev || first.id);
          setSheet((prev) => ({
            plotName: prev.plotName || first.plotName,
            farmerName: prev.farmerName || first.farmerName,
            farmerPhone: prev.farmerPhone || first.farmerPhone || "",
            farmerCccd: prev.farmerCccd || first.farmerCccd || "",
            contractId: prev.contractId || first.contractId,
            cropType: prev.cropType || first.cropType,
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
      setSheet((prev) => ({
        ...prev,
        plotName: "",
        farmerName: "",
        farmerPhone: "",
        farmerCccd: "",
        contractId: "",
      }));
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

    visibleLots
      .filter((lot) => isValidPolygon(lot.polygon))
      .forEach((lot) => {
        const isSelected = lot.id === selectedLot.id;
        const markerPos = polygonCenter(lot.polygon as Array<[number, number]>);

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
            background: ${isSelected ? "#f59e0b" : "#059669"};
            color: #fff;
            border: 2px solid #fff;
            box-shadow: 0 3px 10px rgba(0,0,0,.18);
            font-size: 16px;
            font-weight: 700;
          ">⌂</div>`,
        });

        L.marker(markerPos, { icon })
          .bindTooltip(`${lot.plotName} (${lot.lotCode})`, {
            direction: "top",
            offset: [0, -8],
          })
          .on("click", (event: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(event);
            focusLot(lot);
            showOnlyPolygon(lot);
          })
          .on("dblclick", (event: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(event);
            focusLot(lot);
            showOnlyPolygon(lot);
            setSheetOpen(true);
          })
          .addTo(markerLayer);
      });
  }, [visibleLots, selectedLot]);

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

  useEffect(() => {
    const map = mapRef.current;
    const lotsHasPolygon = visibleLots.filter((lot) =>
      isValidPolygon(lot.polygon),
    );
    if (!map || !lotsHasPolygon.length) {
      return;
    }

    const bounds = L.latLngBounds(
      lotsHasPolygon.map((lot) =>
        polygonCenter(lot.polygon as Array<[number, number]>),
      ),
    );
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.28), { animate: true, duration: 0.35 });
    }
  }, [tab, visibleLots]);

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
      <section className="h-full min-h-0">
        <div className="relative isolate h-full min-h-[740px] overflow-hidden rounded-2xl border border-emerald-200 shadow-sm">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheet-lot-name">Tên lô đất</Label>
              <Input
                id="sheet-lot-name"
                value={sheet.plotName}
                onChange={(event) =>
                  setSheet((prev) => ({
                    ...prev,
                    plotName: event.target.value,
                  }))
                }
                placeholder="Nhập tên lô bạn muốn đặt"
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
                value={sheet.farmerName}
                onChange={(event) =>
                  setSheet((prev) => ({
                    ...prev,
                    farmerName: event.target.value,
                  }))
                }
                placeholder="Nhập tên nông dân"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheet-farmer-phone">Số điện thoại nông dân</Label>
              <Input
                id="sheet-farmer-phone"
                value={sheet.farmerPhone}
                onChange={(event) =>
                  setSheet((prev) => ({
                    ...prev,
                    farmerPhone: event.target.value,
                  }))
                }
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheet-farmer-cccd">CCCD nông dân</Label>
              <Input
                id="sheet-farmer-cccd"
                value={sheet.farmerCccd}
                onChange={(event) =>
                  setSheet((prev) => ({
                    ...prev,
                    farmerCccd: event.target.value,
                  }))
                }
                placeholder="Nhập CCCD 12 chữ số"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheet-contract">Mã hợp đồng</Label>
              <Input
                id="sheet-contract"
                value={sheet.contractId}
                onChange={(event) =>
                  setSheet((prev) => ({
                    ...prev,
                    contractId: event.target.value,
                  }))
                }
                placeholder="Nhập mã hợp đồng"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheet-crop">Loại cây trồng</Label>
              <select
                id="sheet-crop"
                value={sheet.cropType}
                onChange={(event) =>
                  setSheet((prev) => ({
                    ...prev,
                    cropType: event.target.value as CropType,
                  }))
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="sau-rieng">Sầu riêng</option>
                <option value="ca-phe">Cà phê</option>
              </select>
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
                  {getCropLabel(sheet.cropType)}
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
