import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Loader2, Layers, MapPin, RefreshCw } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useDiseaseHeatmap } from './api/hooks';
import type {
  DiseaseHeatmapQuery,
  HeatmapPoint,
  HeatmapSeverity,
} from './api/types';
import { HeatLayer } from './components/HeatLayer';
import { PlotMarker } from './components/PlotMarker';
import { SidePanel } from './components/SidePanel';

// Fix default marker icon (Leaflet known issue với webpack/vite)
// CircleMarker không bị ảnh hưởng nhưng để phòng nếu dùng Marker default
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Auto-fit bounds khi data đổi
function FitBounds({ points }: { points: HeatmapPoint[] }) {
  const map = useMap();
  useMemo(() => {
    if (points.length === 0) return;
    const latLngs = points.map((p) => [p.lat, p.lng] as [number, number]);
    const bounds = L.latLngBounds(latLngs);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    }
  }, [points, map]);
  return null;
}

type LayerMode = 'heatmap' | 'marker' | 'both';
type BaseMapMode = 'street' | 'satellite';

export default function DiseaseHeatmapPage() {
  const [filter, setFilter] = useState<DiseaseHeatmapQuery>({
    windowDays: 7,
  });
  const [layerMode, setLayerMode] = useState<LayerMode>('both');
  const [baseMap, setBaseMap] = useState<BaseMapMode>('street');

  const { data, isLoading, isFetching, refetch } = useDiseaseHeatmap(filter);

  const heatPoints = useMemo(() => {
    if (!data) return [];
    return data.points.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      intensity: p.weight,
    }));
  }, [data]);

  const showHeat = layerMode === 'heatmap' || layerMode === 'both';
  const showMarkers = layerMode === 'marker' || layerMode === 'both';

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] gap-2 p-3 overflow-hidden">
      {/* Compact header: title + filter + reload inline */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 mr-2">
          <MapPin className="h-5 w-5 text-rose-500 shrink-0" />
          <div>
            <h1 className="text-lg font-bold leading-tight">Bản đồ cảnh báo dịch bệnh</h1>
            <p className="text-[11px] text-muted-foreground leading-tight">
              GIS heatmap — AI Vision + Phiên quét
            </p>
          </div>
        </div>

        <div className="h-6 w-px bg-border" />

        <Select
          value={String(filter.windowDays ?? 7)}
          onValueChange={(v) => setFilter({ ...filter, windowDays: Number(v) })}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 ngày qua</SelectItem>
            <SelectItem value="7">7 ngày qua</SelectItem>
            <SelectItem value="14">14 ngày qua</SelectItem>
            <SelectItem value="30">30 ngày qua</SelectItem>
            <SelectItem value="90">90 ngày qua</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filter.cropType ?? 'all'}
          onValueChange={(v) =>
            setFilter({ ...filter, cropType: v === 'all' ? undefined : v })
          }
        >
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue placeholder="Cây trồng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả cây</SelectItem>
            <SelectItem value="ca-phe">Cà phê</SelectItem>
            <SelectItem value="sau-rieng">Sầu riêng</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filter.minSeverity ?? 'all'}
          onValueChange={(v) =>
            setFilter({
              ...filter,
              minSeverity: v === 'all' ? undefined : (v as HeatmapSeverity),
            })
          }
        >
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue placeholder="Mức độ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mọi mức</SelectItem>
            <SelectItem value="light">≥ Nhẹ</SelectItem>
            <SelectItem value="medium">≥ Vừa</SelectItem>
            <SelectItem value="severe">Chỉ Nặng</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 ml-auto">
          <Layers className="h-3.5 w-3.5 text-muted-foreground mx-1" />
          {(['heatmap', 'marker', 'both'] as LayerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setLayerMode(m)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                layerMode === m
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m === 'heatmap' ? 'Nhiệt' : m === 'marker' ? 'Điểm' : 'Cả 2'}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-8 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
          Tải lại
        </Button>
      </div>

      {/* Map + Side panel */}
      <div className="flex flex-1 gap-2 min-h-0">
        {/* Map */}
        <Card className="flex-1 rounded-2xl overflow-hidden relative">
          {(isLoading || isFetching) && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[400] bg-white px-3 py-1.5 rounded-full shadow-lg border flex items-center gap-2 text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Đang tải bản đồ...
            </div>
          )}
          <MapContainer
            center={[14.0583, 108.2772]} // Tâm Việt Nam (gần Pleiku/Tây Nguyên)
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
          >
            {baseMap === 'street' ? (
              <TileLayer
                key="street"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            ) : (
              <TileLayer
                key="satellite"
                attribution="Tiles &copy; Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            )}

            {data && data.points.length > 0 && <FitBounds points={data.points} />}

            {showHeat && heatPoints.length > 0 && (
              <HeatLayer points={heatPoints} radius={40} blur={28} />
            )}

            {showMarkers &&
              data?.points.map((p) => (
                <PlotMarker key={p.plotId} point={p} />
              ))}
          </MapContainer>

          {/* Base map toggle — đồng bộ style với Quản lý Vùng trồng */}
          <div className="absolute top-6 right-6 z-[1000] inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-2.5 py-1.5 shadow-md">
            <Layers className="h-4 w-4 text-emerald-700 ml-1" />
            <Button
              size="sm"
              variant={baseMap === 'street' ? 'primary' : 'ghost'}
              onClick={() => setBaseMap('street')}
              className="h-8 px-3 text-xs"
            >
              Đường phố
            </Button>
            <Button
              size="sm"
              variant={baseMap === 'satellite' ? 'primary' : 'ghost'}
              onClick={() => setBaseMap('satellite')}
              className="h-8 px-3 text-xs"
            >
              Vệ tinh
            </Button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur rounded-lg shadow-lg border px-3 py-2 text-xs">
            <p className="font-bold text-[10px] uppercase text-gray-500 mb-1.5">
              Mức nhiễm
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
                <span>Khỏe</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-yellow-400" />
                <span>Nhẹ</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-orange-500" />
                <span>Vừa</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-rose-600" />
                <span>Nặng</span>
              </div>
            </div>
          </div>

          {data && data.points.length === 0 && !isLoading && (
            <div className="absolute inset-0 z-[400] flex items-center justify-center bg-white/40 backdrop-blur-sm">
              <div className="bg-white border rounded-xl shadow-xl p-6 max-w-sm text-center">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-bold mb-1">Không có dữ liệu</h3>
                <p className="text-sm text-muted-foreground">
                  Chưa có lô đất nào có toạ độ + lần quét trong khoảng thời gian này.
                  Hãy mở rộng khoảng thời gian hoặc kiểm tra plot đã nhập lat/lng chưa.
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Side panel — responsive width, scroll riêng. Trên laptop nhỏ
            (<1366px) panel hẹp 18rem, desktop lớn 20rem. */}
        <div className="w-72 lg:w-80 shrink-0 h-full overflow-y-auto rounded-xl border bg-card">
          {data ? (
            <SidePanel summary={data.summary} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
