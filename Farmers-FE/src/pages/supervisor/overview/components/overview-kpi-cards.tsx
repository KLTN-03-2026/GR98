import {
  ClipboardList,
  FileText,
  ListTodo,
  MapPin,
  ScanSearch,
  TrendingDown,
  TrendingUp,
  Users,
  Wheat,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { DashboardKpi } from '../api/types';

const iconMap: Record<string, typeof Users> = {
  farmers: Wheat,
  plots: MapPin,
  contracts: FileText,
  orders: ClipboardList,
  daily_reports: ClipboardList,
  plant_scans: ScanSearch,
  assignments_pending: ListTodo,
};

/** Các cột co giãn đều, lấp hết chiều ngang (tránh lệch trái khi ít hơn 6 card). */
const kpiGridClass =
  'grid w-full gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,11rem),1fr))]';

function formatDelta(pct: number | null): { text: string; positive: boolean | null } {
  if (pct === null) return { text: '—', positive: null };
  if (pct === 0) return { text: '0%', positive: true };
  const positive = pct > 0;
  return { text: `${positive ? '+' : ''}${pct.toFixed(1)}%`, positive };
}

export function OverviewKpiCards({
  kpis,
  isLoading,
}: {
  kpis: DashboardKpi[] | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className={kpiGridClass}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 min-w-0 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!kpis?.length) return null;

  return (
    <div className={kpiGridClass}>
      {kpis.map((kpi) => {
        const Icon = iconMap[kpi.id] ?? Users;
        const delta = formatDelta(kpi.changePercent);
        return (
          <div
            key={kpi.id}
            className="group relative min-w-0 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card to-primary/[0.06] pl-1 shadow-sm transition-shadow hover:shadow-md dark:to-primary/[0.1]"
          >
            <div className="flex h-full flex-col rounded-r-[0.9rem] border border-l-0 border-border/40 bg-card/80 px-4 py-3.5 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-[18px]" />
                </div>
                {kpi.id === 'assignments_pending' ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : delta.positive !== null ? (
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums',
                      delta.positive
                        ? 'bg-primary/15 text-primary'
                        : 'bg-amber-500/15 text-amber-900 dark:text-amber-200',
                    )}
                  >
                    {delta.positive ? (
                      <TrendingUp className="size-3" />
                    ) : (
                      <TrendingDown className="size-3" />
                    )}
                    {delta.text}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                {kpi.value.toLocaleString('vi-VN')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{kpi.label}</p>
              {kpi.id === 'assignments_pending' ? (
                <p className="mt-1 text-xs text-muted-foreground">Trạng thái tại thời điểm tải</p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  Kỳ trước:{' '}
                  <span className="font-medium text-foreground tabular-nums">
                    {kpi.previousValue.toLocaleString('vi-VN')}
                  </span>
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
