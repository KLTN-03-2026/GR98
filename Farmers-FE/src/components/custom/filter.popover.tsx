import { Funnel, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface FilterOptionValue {
  value: string;
  label: string;
}

export interface FilterOption {
  key: string;
  label: string;
  values: FilterOptionValue[];
}

export interface FilterItem {
  key: string;
  values: string[];
}

export interface FilterPopoverProps {
  filterOptions: FilterOption[];
  filterList: FilterItem[];
  onFilterListChange: (filterList: FilterItem[]) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerLabel?: string;
  popoverTitle?: string;
  className?: string;
}

export function FilterPopover({
  filterOptions,
  filterList,
  onFilterListChange,
  open,
  onOpenChange,
  triggerLabel = 'Filters',
  popoverTitle = 'Filters',
}: FilterPopoverProps) {
  const toggleFilter = (key: string, value: string) => {
    const currentFilter = filterList.find((f) => f.key === key);
    const currentValues = currentFilter?.values || [];
    
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    const updatedFilterList = currentFilter
      ? filterList.map((f) =>
          f.key === key ? { ...f, values: newValues } : f
        )
      : [...filterList, { key, values: newValues }];

    // Remove filter items with empty values
    const cleanedFilterList = updatedFilterList.filter(
      (f) => f.values.length > 0
    );

    onFilterListChange(cleanedFilterList);
  };

  const clearFilters = () => {
    onFilterListChange([]);
  };

  const getFilterValues = (key: string): string[] => {
    return filterList.find((f) => f.key === key)?.values || [];
  };

  const hasActiveFilters = filterList.length > 0;

  const getActiveFiltersCount = (): number => {
    return filterList.reduce((total, filter) => total + filter.values.length, 0);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
        >
          <Funnel className="h-4 w-4" />
          {triggerLabel}
          {hasActiveFilters && (
            <Badge
              variant="secondary"
              className="ml-2 h-5 min-w-5 rounded-full px-1.5 text-xs"
            >
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-sm">{popoverTitle}</h4>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {filterOptions.map((option) => {
              const selectedValues = getFilterValues(option.key);
              
              return (
                <div key={option.key}>
                  <h5 className="text-xs font-medium text-muted-foreground mb-2">
                    {option.label}
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((valueOption) => (
                      <Button
                        key={valueOption.value}
                        variant={
                          selectedValues.includes(valueOption.value)
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        onClick={() => toggleFilter(option.key, valueOption.value)}
                        className="h-8 text-xs"
                      >
                        {valueOption.label}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

