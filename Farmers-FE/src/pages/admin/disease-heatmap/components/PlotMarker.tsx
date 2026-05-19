import { CircleMarker, Popup } from 'react-leaflet';
import type { HeatmapPoint } from '../api/types';

const severityColor: Record<HeatmapPoint['severity'], string> = {
  none: '#22c55e',     // green
  light: '#eab308',    // yellow
  medium: '#f97316',   // orange
  severe: '#dc2626',   // red
};

const severityLabel: Record<HeatmapPoint['severity'], string> = {
  none: 'Khỏe mạnh',
  light: 'Nhẹ',
  medium: 'Vừa',
  severe: 'Nặng',
};

const cropLabel = (key: string) =>
  ({ 'ca-phe': 'Cà phê', 'sau-rieng': 'Sầu riêng' } as Record<string, string>)[key] ?? key;

interface PlotMarkerProps {
  point: HeatmapPoint;
  onClick?: (point: HeatmapPoint) => void;
}

export function PlotMarker({ point, onClick }: PlotMarkerProps) {
  const color = severityColor[point.severity];
  // Radius scales theo diện tích để to-nhỏ dễ phân biệt
  const radius = Math.min(18, 6 + Math.log10(point.areaHa + 1) * 6);

  return (
    <CircleMarker
      center={[point.lat, point.lng]}
      pathOptions={{
        color: color,
        fillColor: color,
        fillOpacity: 0.7,
        weight: 2,
      }}
      radius={radius}
      eventHandlers={{
        click: () => onClick?.(point),
      }}
    >
      <Popup>
        <div className="text-xs space-y-1.5 min-w-[200px]">
          <div className="font-semibold text-sm">
            📍 Lô {point.plotCode}
          </div>
          <div className="text-muted-foreground">
            {point.farmerName} · {cropLabel(point.cropType)}
          </div>
          {point.province && (
            <div className="text-muted-foreground text-[11px]">
              {point.district ? `${point.district}, ` : ''}{point.province}
            </div>
          )}
          <hr className="my-1.5" />
          <div className="flex items-center justify-between">
            <span>Diện tích:</span>
            <span className="font-semibold">{point.areaHa} ha</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Mức độ:</span>
            <span
              className="font-bold px-1.5 py-0.5 rounded text-[10px]"
              style={{ backgroundColor: color, color: '#fff' }}
            >
              {severityLabel[point.severity]}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Cây nhiễm:</span>
            <span className="font-semibold">
              {point.infectedCount}/{point.totalScans} ({Math.round(point.infectionRate * 100)}%)
            </span>
          </div>
          {point.topDisease && (
            <div className="flex items-center justify-between">
              <span>Bệnh chính:</span>
              <span className="font-semibold text-red-600">{point.topDisease}</span>
            </div>
          )}
          {point.lastScanAt && (
            <div className="text-[10px] text-muted-foreground pt-1">
              Cập nhật: {new Date(point.lastScanAt).toLocaleString('vi-VN')}
            </div>
          )}
        </div>
      </Popup>
    </CircleMarker>
  );
}
