import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AdminOverviewFilters, AdminOverviewRangePreset } from '../api/types';

const PRESETS: Array<{ value: AdminOverviewRangePreset; label: string; caption: string }> = [
  { value: '7d', label: '7 ngày', caption: 'Nhanh' },
  { value: '14d', label: '14 ngày', caption: 'Cân bằng' },
  { value: '30d', label: '30 ngày', caption: 'Xu hướng' },
  { value: 'mtd', label: 'Tháng này', caption: 'MTD' },
];

export function AdminTimeRange({
  filters,
  onChange,
}: {
  filters: AdminOverviewFilters;
  onChange: (next: AdminOverviewFilters) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
      {PRESETS.map((p) => {
        const active = filters.rangePreset === p.value;
        return (
          <Button
            key={p.value}
            type="button"
            size="sm"
            variant={active ? 'primary' : 'ghost'}
            className={cn(
              'h-auto min-h-14 justify-start rounded-2xl border px-3 py-2 text-left transition-all duration-200',
              active
                ? 'border-transparent bg-primary text-primary-foreground shadow-[0_12px_24px_rgba(47,93,80,0.24)] hover:bg-primary/90'
                : 'border-border/70 bg-background/70 text-foreground hover:border-primary/25 hover:bg-primary/[0.06]',
            )}
            onClick={() => onChange({ ...filters, rangePreset: p.value })}
          >
            <span className="flex flex-col items-start leading-tight">
              <span className="font-semibold">{p.label}</span>
              <span className={cn('text-[11px]', active ? 'text-primary-foreground/75' : 'text-muted-foreground')}>
                {p.caption}
              </span>
            </span>
          </Button>
        );
      })}
    </div>
  );
}
