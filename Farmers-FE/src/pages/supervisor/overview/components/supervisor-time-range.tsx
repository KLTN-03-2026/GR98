import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SupervisorOverviewFilters, SupervisorOverviewRangePreset } from '../api/types';

const PRESETS: Array<{ value: SupervisorOverviewRangePreset; label: string }> = [
  { value: '7d', label: '7 ngày' },
  { value: '14d', label: '14 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: 'mtd', label: 'Tháng này' },
];

export function SupervisorTimeRange({
  filters,
  onChange,
}: {
  filters: SupervisorOverviewFilters;
  onChange: (next: SupervisorOverviewFilters) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Khoảng thời gian
      </span>
      <div className="inline-flex flex-wrap gap-1 rounded-full border border-primary/20 bg-primary/[0.04] p-1 dark:bg-primary/[0.08]">
        {PRESETS.map((p) => (
          <Button
            key={p.value}
            type="button"
            size="sm"
            variant={filters.rangePreset === p.value ? 'default' : 'ghost'}
            className={cn(
              'h-8 rounded-full px-3 text-xs text-foreground',
              filters.rangePreset === p.value &&
                'border-transparent bg-primary text-primary-foreground hover:bg-primary/90',
            )}
            onClick={() => onChange({ ...filters, rangePreset: p.value })}
          >
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
