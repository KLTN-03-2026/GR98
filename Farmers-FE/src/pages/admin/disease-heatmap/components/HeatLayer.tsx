import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

/**
 * Wrapper React cho leaflet.heat plugin.
 * Render lớp heatmap mờ chồng lên map dựa vào danh sách điểm [lat, lng, intensity].
 */
export interface HeatPoint {
  lat: number;
  lng: number;
  /** 0..1 — cường độ điểm nóng */
  intensity: number;
}

interface HeatLayerProps {
  points: HeatPoint[];
  /** Bán kính mỗi điểm (px) */
  radius?: number;
  /** Bán kính blur giữa các điểm */
  blur?: number;
  /** Cường độ tối đa (= điểm có intensity bằng max sẽ tô màu đậm nhất) */
  max?: number;
  /** Zoom min/max để hiện lớp */
  minOpacity?: number;
}

export function HeatLayer({
  points,
  radius = 35,
  blur = 25,
  max = 1.0,
  minOpacity = 0.35,
}: HeatLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const latlngs = points.map((p) => [p.lat, p.lng, p.intensity] as [number, number, number]);

    // Color gradient: xanh nhạt → vàng → cam → đỏ
    const layer = (L as any).heatLayer(latlngs, {
      radius,
      blur,
      max,
      minOpacity,
      gradient: {
        0.0: 'rgba(34, 197, 94, 0.0)',   // transparent
        0.2: 'rgba(34, 197, 94, 0.6)',   // emerald
        0.4: 'rgba(234, 179, 8, 0.7)',   // yellow
        0.6: 'rgba(249, 115, 22, 0.8)',  // orange
        0.8: 'rgba(239, 68, 68, 0.85)',  // red
        1.0: 'rgba(185, 28, 28, 0.95)',  // dark red
      },
    });

    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, points, radius, blur, max, minOpacity]);

  return null;
}
