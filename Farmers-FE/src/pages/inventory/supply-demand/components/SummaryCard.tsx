import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

function formatMetricValue(value: number, format?: 'number' | 'currency' | 'kg') {
  if (format === 'currency') {
    return `${Math.round(value).toLocaleString('vi-VN')} đ`;
  }
  if (format === 'kg') {
    return `${value.toLocaleString('vi-VN')} kg`;
  }
  return value.toLocaleString('vi-VN');
}

interface SummaryCardProps {
  title: string;
  value: number;
  unit?: string;
  icon: ComponentType<{ className?: string }>;
  description: string;
  accentColor?: 'primary' | 'secondary' | 'tertiary' | 'rose' | 'emerald' | 'amber';
  isLoading: boolean;
  format?: 'number' | 'currency' | 'kg';
}

export function SummaryCard({
  title,
  value,
  icon: Icon,
  description,
  accentColor = 'primary',
  isLoading,
  format = 'kg',
}: SummaryCardProps) {
  
  const colorMap = {
    primary: 'text-primary bg-primary/10 border-primary/15',
    secondary: 'text-secondary bg-secondary/10 border-secondary/15',
    tertiary: 'text-tertiary bg-tertiary/10 border-tertiary/15',
    rose: 'text-rose-600 bg-rose-500/10 border-rose-500/15',
    emerald: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/15',
    amber: 'text-amber-600 bg-amber-500/10 border-amber-500/15',
  };

  return (
    <div className="group relative min-w-0 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card to-primary/[0.04] pl-1 shadow-sm transition-all hover:shadow-md dark:to-primary/[0.08]">
      <div className="flex h-full flex-col rounded-r-[0.9rem] border border-l-0 border-border/40 bg-card/85 px-4 py-3.5 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-2">
          <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", colorMap[accentColor])}>
            <Icon className="size-[18px]" />
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="mt-3 h-8 w-32" />
        ) : (
          <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-foreground leading-none">
            {formatMetricValue(value, format)}
          </p>
        )}
        
        <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-800">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
