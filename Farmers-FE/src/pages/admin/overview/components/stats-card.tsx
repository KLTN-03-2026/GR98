import type { ComponentType } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatMetricValue(value: number, format?: 'number' | 'currency') {
  if (format === 'currency') {
    return `${Math.round(value).toLocaleString('vi-VN')} đ`;
  }
  return value.toLocaleString('vi-VN');
}

function formatDelta(pct: number | null): { text: string; positive: boolean | null } {
  if (pct === null) return { text: '—', positive: null };
  if (pct === 0) return { text: '0%', positive: true };
  const positive = pct > 0;
  return { text: `${positive ? '+' : ''}${pct.toFixed(1)}%`, positive };
}

export function StatsCard({
  icon: Icon,
  label,
  value,
  previousValue,
  changePercent,
  format,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  previousValue: number;
  changePercent: number | null;
  format?: 'number' | 'currency';
}) {
  const delta = formatDelta(changePercent);

  return (
    <div className="group relative min-w-0 overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-[0_14px_36px_rgba(47,93,80,0.08)] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_20px_48px_rgba(47,93,80,0.14)] dark:border-white/10 dark:bg-card/80">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-emerald-400 opacity-80" />
      <div className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-80" />
      <div className="relative flex h-full flex-col px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
            <Icon className="size-[18px]" />
          </div>
          {delta.positive !== null ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold tabular-nums',
                delta.positive
                  ? 'bg-primary/12 text-primary ring-1 ring-primary/15'
                  : 'bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20 dark:text-rose-400',
              )}
            >
              {delta.positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {delta.text}
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">—</span>
          )}
        </div>
        <p className="mt-5 text-2xl font-bold tabular-nums tracking-[-0.03em] text-foreground">
          {formatMetricValue(value, format)}
        </p>
        <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{label}</p>
        <div className="mt-4 rounded-2xl bg-muted/45 px-3 py-2 text-xs text-muted-foreground">
          Kỳ trước{' '}
          <span className="font-semibold text-foreground tabular-nums">
            {formatMetricValue(previousValue, format)}
          </span>
        </div>
      </div>
    </div>
  );
}
