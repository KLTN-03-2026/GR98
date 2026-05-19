import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  Minus,
} from 'lucide-react';
import type {
  HeatmapAlertLevel,
  HeatmapSummary,
} from '../api/types';

const alertStyles: Record<
  HeatmapAlertLevel,
  { bg: string; border: string; text: string; label: string; icon: typeof AlertTriangle }
> = {
  high: {
    bg: 'bg-rose-50',
    border: 'border-rose-300',
    text: 'text-rose-700',
    label: 'NGUY HIỂM',
    icon: ShieldAlert,
  },
  medium: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-700',
    label: 'CHÚ Ý',
    icon: AlertTriangle,
  },
  low: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-700',
    label: 'BÌNH THƯỜNG',
    icon: Minus,
  },
};

const TrendIcon = ({ pct }: { pct: number | null }) => {
  if (pct === null) return <Minus className="h-3 w-3 text-gray-400" />;
  if (pct > 5) return <TrendingUp className="h-3 w-3 text-rose-500" />;
  if (pct < -5) return <TrendingDown className="h-3 w-3 text-emerald-500" />;
  return <Minus className="h-3 w-3 text-gray-400" />;
};

interface SidePanelProps {
  summary: HeatmapSummary;
}

export function SidePanel({ summary }: SidePanelProps) {
  const overall = alertStyles[summary.alertLevel];
  const OverallIcon = overall.icon;

  return (
    <div className="flex flex-col gap-2.5 p-3 text-sm h-full">
      {/* Overall alert — compact horizontal */}
      <div className={`${overall.bg} ${overall.border} border-2 rounded-xl p-3 shrink-0`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <OverallIcon className={`h-4 w-4 ${overall.text}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${overall.text}`}>
              {overall.label}
            </span>
          </div>
          <span className={`text-xs ${overall.text} font-semibold`}>
            {summary.infectedPlots}/{summary.totalPlots} lô
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center bg-white/70 rounded-lg p-2">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase">Tỉ lệ nhiễm</p>
            <p className={`text-2xl font-bold leading-tight ${overall.text}`}>
              {Math.round(summary.avgInfectionRate * 100)}%
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase">Mất sản lượng</p>
            <p className={`text-2xl font-bold leading-tight ${overall.text}`}>
              ~{summary.estimatedYieldLossPct}%
            </p>
          </div>
        </div>
      </div>

      {/* Top diseases — compact, flex-1 chia đều với province card */}
      <div className="bg-card border rounded-xl p-3 flex-1 min-h-0 overflow-y-auto">
        <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wider">
          📊 Top bệnh trong kỳ
        </h3>
        {summary.topDiseases.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Không phát hiện bệnh nào.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {summary.topDiseases.slice(0, 5).map((d, i) => (
              <li
                key={d.name}
                className="flex items-center justify-between gap-2 py-0.5"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground font-mono w-4 shrink-0">
                    {i + 1}.
                  </span>
                  <span className="text-sm truncate font-medium">{d.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-sm">{d.count}</span>
                  <div className="flex items-center gap-0.5 text-xs w-14 justify-end">
                    <TrendIcon pct={d.trendPct} />
                    {d.trendPct !== null && (
                      <span
                        className={
                          d.trendPct > 5
                            ? 'text-rose-600 font-semibold'
                            : d.trendPct < -5
                              ? 'text-emerald-600'
                              : 'text-muted-foreground'
                        }
                      >
                        {d.trendPct > 0 ? '+' : ''}
                        {d.trendPct}%
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Province alerts — compact list, flex-1 chia đều với top diseases */}
      <div className="bg-card border rounded-xl p-3 flex-1 min-h-0 overflow-y-auto">
        <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wider">
          🌍 Cảnh báo theo tỉnh
        </h3>
        {summary.provinces.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Chưa có dữ liệu.</p>
        ) : (
          <ul className="space-y-1.5">
            {summary.provinces.slice(0, 6).map((p) => {
              const s = alertStyles[p.alertLevel];
              const Icon = s.icon;
              return (
                <li
                  key={p.province}
                  className={`${s.bg} border-l-2 ${s.border} rounded-r px-2.5 py-1.5`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <Icon className={`h-3.5 w-3.5 ${s.text} shrink-0`} />
                      <span className="text-sm font-semibold truncate">{p.province}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-sm font-bold ${s.text}`}>
                        {Math.round(p.infectionRate * 100)}%
                      </span>
                      <div className="flex items-center text-xs w-14 justify-end">
                        <TrendIcon pct={p.trendPct} />
                        {p.trendPct !== null && (
                          <span
                            className={
                              p.trendPct > 5
                                ? 'text-rose-600 font-semibold'
                                : 'text-muted-foreground'
                            }
                          >
                            {p.trendPct > 0 ? '+' : ''}
                            {p.trendPct}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
