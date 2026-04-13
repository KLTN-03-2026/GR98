import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Filter, Layers, Search, Sprout } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

type CropType = 'sau-rieng' | 'ca-phe';
type GISTab = 'all' | CropType;

interface LotPoint {
  id: string;
  lotCode: string;
  plotName: string;
  farmerName: string;
  contractId: string;
  province: string;
  district: string;
  areaHa: number;
  cropType: CropType;
  progress: 'on-track' | 'attention';
  lat: number;
  lng: number;
  updatedAt: string;
}

interface Place {
  label: string;
  query: string;
  type: 'Tỉnh/Thành' | 'Quận/Huyện';
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

const LOTS: LotPoint[] = [
  {
    id: 'lot-001',
    lotCode: 'VT-L001',
    plotName: 'Lô Khe Mây',
    farmerName: 'Nguyen Van Son',
    contractId: 'CT-2026-101',
    province: 'Son La',
    district: 'Moc Chau',
    areaHa: 2.8,
    cropType: 'ca-phe',
    progress: 'on-track',
    lat: 20.84,
    lng: 104.74,
    updatedAt: '13/04/2026 09:30',
  },
  {
    id: 'lot-002',
    lotCode: 'VT-L002',
    plotName: 'Lô Suối Đá',
    farmerName: 'Tran Thi Hoa',
    contractId: 'CT-2026-108',
    province: 'Dak Lak',
    district: 'Cu Mgar',
    areaHa: 3.2,
    cropType: 'sau-rieng',
    progress: 'attention',
    lat: 12.81,
    lng: 108.07,
    updatedAt: '13/04/2026 10:05',
  },
  {
    id: 'lot-003',
    lotCode: 'VT-L003',
    plotName: 'Lô Đồi Gió',
    farmerName: 'Le Van Nam',
    contractId: 'CT-2026-115',
    province: 'Lam Dong',
    district: 'Bao Loc',
    areaHa: 1.9,
    cropType: 'ca-phe',
    progress: 'on-track',
    lat: 11.55,
    lng: 107.8,
    updatedAt: '13/04/2026 11:12',
  },
  {
    id: 'lot-004',
    lotCode: 'VT-L004',
    plotName: 'Lô Bến Hồ',
    farmerName: 'Pham Quoc Viet',
    contractId: 'CT-2026-121',
    province: 'Tien Giang',
    district: 'Cai Lay',
    areaHa: 2.1,
    cropType: 'sau-rieng',
    progress: 'on-track',
    lat: 10.4,
    lng: 106.12,
    updatedAt: '13/04/2026 08:40',
  },
];

interface GISWorkspaceProps {
  title: string;
  roleLabel: string;
  description: string;
}

const DEFAULT_POLYGON_META = 'Chưa có polygon. Dùng công cụ vẽ trên map để mở Sheet chỉnh sửa.';
const getCropLabel = (crop: CropType) => (crop === 'sau-rieng' ? 'Sầu riêng' : 'Cà phê');

export default function GISWorkspace({ title, roleLabel, description }: GISWorkspaceProps) {
  const [tab, setTab] = useState<GISTab>('all');
  const [keyword, setKeyword] = useState('');
  const [selectedLotId, setSelectedLotId] = useState<string>(LOTS[0].id);
  const [activeLayer, setActiveLayer] = useState<'street' | 'satellite'>('street');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [hasPolygon, setHasPolygon] = useState(false);
  const [polygonMeta, setPolygonMeta] = useState(DEFAULT_POLYGON_META);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 16.2, lng: 106.2 });
  const [sheet, setSheet] = useState(() => ({
    plotName: LOTS[0].plotName,
    farmerName: LOTS[0].farmerName,
    contractId: LOTS[0].contractId,
    cropType: LOTS[0].cropType,
  }));
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);
  const streetLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);

  const visibleLots = useMemo(() => LOTS.filter((lot) => tab === 'all' || lot.cropType === tab), [tab]);

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
          lot.district.toLowerCase().includes(normalized)
      )
      .slice(0, 8);
  }, [keyword, visibleLots]);

  const placeSearchResults = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    return allPlaces.filter((item) => item.label.toLowerCase().includes(normalized)).slice(0, 8);
  }, [allPlaces, keyword]);

  const selectedLot = useMemo(() => {
    return visibleLots.find((lot) => lot.id === selectedLotId) ?? visibleLots[0] ?? LOTS[0];
  }, [visibleLots, selectedLotId]);

  const stats = useMemo(() => {
    const totalArea = visibleLots.reduce((sum, lot) => sum + lot.areaHa, 0);
    return {
      totalLots: visibleLots.length,
      totalArea: totalArea.toFixed(1),
      warningCount: visibleLots.filter((lot) => lot.progress === 'attention').length,
    };
  }, [visibleLots]);

  const focusLot = (lot: LotPoint) => {
    setSelectedLotId(lot.id);
    setSheet({
      plotName: lot.plotName,
      farmerName: lot.farmerName,
      contractId: lot.contractId,
      cropType: lot.cropType,
    });

    const map = mapRef.current;
    if (map) {
      map.flyTo([lot.lat, lot.lng], Math.max(map.getZoom(), 9), { duration: 0.35 });
    }
  };

  const handleSelectLot = (lot: LotPoint) => {
    focusLot(lot);
    setKeyword('');
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      minZoom: 5,
      maxZoom: 18,
    }).setView([16.2, 106.2], 6);

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    });

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles &copy; Esri' }
    );

    streetLayer.addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      position: 'topleft',
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
        return 'Polygon đã tạo.';
      }

      const rings = layer.getLatLngs();
      const firstRing = (rings[0] ?? []) as L.LatLng[];
      if (!firstRing.length) {
        return 'Polygon đã tạo.';
      }

      const area = L.GeometryUtil.geodesicArea(firstRing);
      const hectares = area / 10000;
      return `Polygon: ${area.toFixed(0)} m2 (${hectares.toFixed(2)} ha)`;
    };

    const onDrawCreated: L.LeafletEventHandlerFn = (event) => {
      const drawEvent = event as L.DrawEvents.Created;
      drawnItems.clearLayers();
      drawnItems.addLayer(drawEvent.layer);
      setPolygonMeta(toAreaText(drawEvent.layer));
      setHasPolygon(true);
      setSheetOpen(true);
    };

    const onDrawEdited: L.LeafletEventHandlerFn = () => {
      const firstLayer = drawnItems.getLayers()[0];
      if (firstLayer) {
        setPolygonMeta(toAreaText(firstLayer));
      }
    };

    const onDrawDeleted: L.LeafletEventHandlerFn = () => {
      setHasPolygon(false);
      setSheetOpen(false);
      setPolygonMeta(DEFAULT_POLYGON_META);
    };

    const onMoveEnd = () => {
      const center = map.getCenter();
      setMapCenter({ lat: center.lat, lng: center.lng });
    };

    map.on(L.Draw.Event.CREATED, onDrawCreated);
    map.on(L.Draw.Event.EDITED, onDrawEdited);
    map.on(L.Draw.Event.DELETED, onDrawDeleted);
    map.on('moveend', onMoveEnd);

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);
    setTimeout(() => map.invalidateSize(), 80);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.off(L.Draw.Event.CREATED, onDrawCreated);
      map.off(L.Draw.Event.EDITED, onDrawEdited);
      map.off(L.Draw.Event.DELETED, onDrawDeleted);
      map.off('moveend', onMoveEnd);
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      searchMarkerRef.current = null;
      streetLayerRef.current = null;
      satelliteLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data.json', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const raw = (await response.json()) as ProvinceInput[] | Record<string, ProvinceHashValue>;

        const hashInput: ProvinceInput[] = Array.isArray(raw)
          ? raw
          : Object.keys(raw || {}).map((id) => {
              const province = raw[id] || { name: '', districts: {} };
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
            type: 'Tỉnh/Thành',
          });

          (province.districts || []).forEach((district) => {
            if (!district?.name) {
              return;
            }

            places.push({
              label: `${district.name} - ${province.name}`,
              query: `${district.name}, ${province.name}, Việt Nam`,
              type: 'Quận/Huyện',
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

    visibleLots.forEach((lot) => {
      const isSelected = lot.id === selectedLot.id;
      const fillColor = isSelected ? '#f59e0b' : lot.cropType === 'sau-rieng' ? '#10b981' : '#0ea5e9';

      L.circleMarker([lot.lat, lot.lng], {
        radius: isSelected ? 10 : 8,
        color: '#ffffff',
        weight: 2,
        fillColor,
        fillOpacity: 1,
      })
        .bindTooltip(`${lot.plotName} (${lot.lotCode})`, {
          direction: 'top',
          offset: [0, -8],
        })
        .on('click', () => focusLot(lot))
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

    if (activeLayer === 'street') {
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
    if (!map || !visibleLots.length) {
      return;
    }

    const bounds = L.latLngBounds(visibleLots.map((lot) => [lot.lat, lot.lng] as [number, number]));
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
        'https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=vn&limit=1&q=' +
        encodeURIComponent(query);

      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        return;
      }

      const results = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>;
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
      searchMarkerRef.current.bindPopup(`<b>${label}</b><br/>${top.display_name}`).openPopup();

      map.flyTo([lat, lon], 12, { duration: 0.8 });
      setKeyword('');
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

  const hasSearchResults = searchResults.length > 0 || placeSearchResults.length > 0;

  return (
    <>
      <section className="h-full min-h-0">
        <div className="relative isolate h-full min-h-[740px] overflow-hidden rounded-2xl border border-emerald-200 shadow-sm">
          <div ref={mapContainerRef} className="h-full w-full" />

          <div className="absolute left-4 right-4 top-4 z-1100 flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-100 bg-white/90 p-2 shadow-sm backdrop-blur-sm">
            <div className="relative min-w-60 flex-1 rounded-xl border border-emerald-100 bg-white p-1 shadow-xs">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
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
                            <span className="block text-sm font-semibold text-emerald-900">{lot.plotName}</span>
                            <span className="block text-xs text-muted-foreground">{lot.lotCode} • {lot.district}, {lot.province}</span>
                          </span>
                          <Badge variant="outline" className="border-emerald-300 text-emerald-700">Lô đất</Badge>
                        </button>
                      ))}

                      {placeSearchResults.map((place) => (
                        <button
                          key={`place-${place.type}:${place.query}`}
                          type="button"
                          onClick={() => void geocodePlace(place.query, place.label)}
                          className="flex w-full items-center justify-between rounded px-2 py-2 text-left hover:bg-sky-50"
                        >
                          <span>
                            <span className="block text-sm font-semibold text-sky-900">{place.label}</span>
                            <span className="block text-xs text-muted-foreground">Tìm theo {place.type}</span>
                          </span>
                          <Badge variant="outline" className="border-sky-300 text-sky-700">{place.type}</Badge>
                        </button>
                      ))}
                    </>
                  ) : (
                    <p className="px-2 py-2 text-sm text-muted-foreground">Không tìm thấy kết quả phù hợp.</p>
                  )}
                </div>
              )}
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-2 py-1.5 shadow-xs">
              <Filter className="h-4 w-4 text-emerald-700" />
              <Button size="sm" variant={tab === 'all' ? 'primary' : 'ghost'} onClick={() => setTab('all')}>
                Tất cả
              </Button>
              <Button size="sm" variant={tab === 'sau-rieng' ? 'primary' : 'ghost'} onClick={() => setTab('sau-rieng')}>
                Sầu riêng
              </Button>
              <Button size="sm" variant={tab === 'ca-phe' ? 'primary' : 'ghost'} onClick={() => setTab('ca-phe')}>
                Cà phê
              </Button>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-2 py-1.5 shadow-xs">
              <Layers className="h-4 w-4 text-emerald-700" />
              <Button size="sm" variant={activeLayer === 'street' ? 'primary' : 'ghost'} onClick={() => setActiveLayer('street')}>
                Đường phố
              </Button>
              <Button
                size="sm"
                variant={activeLayer === 'satellite' ? 'primary' : 'ghost'}
                onClick={() => setActiveLayer('satellite')}
              >
                Vệ tinh
              </Button>
              <Button size="sm" variant="outline" disabled={!hasPolygon} onClick={() => setSheetOpen(true)}>
                Mở Sheet
              </Button>
            </div>
          </div>

          <div className="pointer-events-none absolute left-16 right-4 top-21 z-1090 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-white/30 bg-emerald-950/70 px-3 py-2 text-white shadow-sm backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-white/80">Lô hiển thị</p>
              <p className="mt-0.5 text-lg font-bold leading-tight">{stats.totalLots}</p>
            </div>
            <div className="rounded-lg border border-white/30 bg-emerald-950/70 px-3 py-2 text-white shadow-sm backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-white/80">Tổng diện tích</p>
              <p className="mt-0.5 text-lg font-bold leading-tight">{stats.totalArea} ha</p>
            </div>
            <div className="rounded-lg border border-white/30 bg-emerald-950/70 px-3 py-2 text-white shadow-sm backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-white/80">Cảnh báo</p>
              <p className="mt-0.5 text-lg font-bold leading-tight">{stats.warningCount}</p>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-1090 rounded-2xl border border-emerald-100 bg-white/95 p-3 shadow-sm backdrop-blur-sm">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                {roleLabel}
              </Badge>
              <span className="text-emerald-900">{title}</span>
              <span className="text-muted-foreground">• {description}</span>
            </div>
            <p className="mb-2 text-xs text-muted-foreground">{polygonMeta}</p>
            <div className="grid max-h-40 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
              {visibleLots.map((lot) => (
                <button
                  key={`lot-${lot.id}`}
                  type="button"
                  onClick={() => handleSelectLot(lot)}
                  className={`pointer-events-auto rounded-xl border px-3 py-2 text-left transition ${
                    selectedLot.id === lot.id
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-border bg-white hover:border-emerald-200 hover:bg-emerald-50/40'
                  }`}
                >
                  <p className="text-sm font-semibold text-emerald-900">{lot.plotName}</p>
                  <p className="text-xs text-muted-foreground">{lot.lotCode} • {lot.province}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="z-1301 w-[92vw] overflow-y-auto px-0 sm:max-w-lg">
          <SheetHeader className="border-b pb-4">
            <SheetTitle>Sheet quản lý lô đất</SheetTitle>
            <SheetDescription>
              Tự mở khi vẽ polygon. Dữ liệu bám theo vị trí hiện tại của bản đồ.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 p-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
              <p className="text-xs uppercase tracking-widest text-emerald-700">Lot đang chọn</p>
              <p className="mt-1 text-lg font-bold text-emerald-950">{sheet.plotName}</p>
              <p className="text-sm text-emerald-800">{selectedLot.lotCode} • {selectedLot.district}, {selectedLot.province}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheet-lot-name">Tên lô đất</Label>
              <Input
                id="sheet-lot-name"
                value={sheet.plotName}
                onChange={(event) => setSheet((prev) => ({ ...prev, plotName: event.target.value }))}
                placeholder="Nhập tên lô bạn muốn đặt"
              />
            </div>

            <div className="rounded-xl border border-dashed border-emerald-200 p-3">
              <p className="text-xs text-muted-foreground">Vị trí hiện tại của map</p>
              <p className="font-semibold text-emerald-900">
                {mapCenter.lat.toFixed(6)}, {mapCenter.lng.toFixed(6)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{polygonMeta}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheet-farmer">Nông dân phụ trách</Label>
              <Input
                id="sheet-farmer"
                value={sheet.farmerName}
                onChange={(event) => setSheet((prev) => ({ ...prev, farmerName: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheet-contract">Mã hợp đồng</Label>
              <Input
                id="sheet-contract"
                value={sheet.contractId}
                onChange={(event) => setSheet((prev) => ({ ...prev, contractId: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheet-crop">Loại cây trồng</Label>
              <select
                id="sheet-crop"
                value={sheet.cropType}
                onChange={(event) => setSheet((prev) => ({ ...prev, cropType: event.target.value as CropType }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="sau-rieng">Sầu riêng</option>
                <option value="ca-phe">Cà phê</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-xl border border-dashed p-3">
              <div>
                <p className="text-xs text-muted-foreground">Diện tích</p>
                <p className="font-semibold text-emerald-900">{selectedLot.areaHa} ha</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tiến độ</p>
                <p className="font-semibold text-emerald-900">
                  {selectedLot.progress === 'on-track' ? 'Đúng kế hoạch' : 'Cần theo dõi'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cập nhật</p>
                <p className="font-semibold text-emerald-900">{selectedLot.updatedAt}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Giống cây</p>
                <p className="font-semibold text-emerald-900">{getCropLabel(sheet.cropType)}</p>
              </div>
            </div>
          </div>

          <SheetFooter>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
              <Sprout className="mr-2 h-4 w-4" />
              Lưu cập nhật vào luồng GIS
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
