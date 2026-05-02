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
    <div className="group relative min-w-0 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card to-primary/[0.04] pl-1 shadow-sm transition-shadow hover:shadow-md dark:to-primary/[0.08]">
      <div className="flex h-full flex-col rounded-r-[0.9rem] border border-l-0 border-border/40 bg-card/85 px-4 py-3.5 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-[18px]" />
          </div>
          {delta.positive !== null ? (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums',
                delta.positive
                  ? 'bg-primary/15 text-primary'
                  : 'border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400',
              )}
            >
              {delta.positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {delta.text}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
        <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {formatMetricValue(value, format)}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Kỳ trước:{' '}
          <span className="font-medium text-foreground tabular-nums">
            {formatMetricValue(previousValue, format)}
          </span>
        </p>
      </div>
    </div>
  );
}
