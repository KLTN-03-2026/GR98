import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Calendar } from 'lucide-react';
import type { TransactionFilters } from '../api/types';
import { cn } from '@/lib/utils';

interface TransactionsFilterBarProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  warehouses: Array<{ id: string; name: string }>;
}

function getDatePreset(key: string): { fromDate: string; toDate: string } {
  const now = new Date();
  const toDate = now.toISOString().split('T')[0];

  switch (key) {
    case 'today':
      return { fromDate: toDate, toDate };
    case '7days': {
      const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { fromDate: from.toISOString().split('T')[0], toDate };
    }
    case '30days': {
      const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { fromDate: from.toISOString().split('T')[0], toDate };
    }
    case 'month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { fromDate: from.toISOString().split('T')[0], toDate };
    }
    default:
      return { fromDate: '', toDate: '' };
  }
}

export function TransactionsFilterBar({ filters, onFiltersChange, warehouses }: TransactionsFilterBarProps) {
  const activeFilterCount = Object.entries(filters).filter(
    ([_, v]) => v && v !== 'all' && v !== ''
  ).length;

  const updateFilter = (key: keyof TransactionFilters, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const applyDatePreset = (preset: string) => {
    if (preset === 'all') {
      onFiltersChange({ ...filters, fromDate: undefined, toDate: undefined });
      return;
    }
    const { fromDate, toDate } = getDatePreset(preset);
    onFiltersChange({ ...filters, fromDate, toDate });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Warehouse Filter */}
      <Select
        value={filters.warehouseId || 'all'}
        onValueChange={(val) => updateFilter('warehouseId', val === 'all' ? undefined : val)}
      >
        <SelectTrigger className={cn(
          "h-9 w-auto min-w-[140px] text-sm",
          filters.warehouseId && filters.warehouseId !== 'all' && "border-primary text-primary"
        )}>
          <SelectValue placeholder="Tất cả kho" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả kho</SelectItem>
          {warehouses.map(w => (
            <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Type Filter */}
      <Select
        value={filters.type || 'all'}
        onValueChange={(val) => updateFilter('type', val === 'all' ? undefined : val)}
      >
        <SelectTrigger className={cn(
          "h-9 w-auto min-w-[140px] text-sm",
          filters.type && filters.type !== 'all' && "border-primary text-primary"
        )}>
          <SelectValue placeholder="Loại giao dịch" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả loại</SelectItem>
          <SelectItem value="inbound">Nhập kho</SelectItem>
          <SelectItem value="outbound">Xuất kho</SelectItem>
          <SelectItem value="adjustment">Điều chỉnh</SelectItem>
        </SelectContent>
      </Select>

      {/* Date Range Preset */}
      <Select
        value={
          !filters.fromDate && !filters.toDate
            ? 'all'
            : 'custom'
        }
        onValueChange={(val) => applyDatePreset(val)}
      >
        <SelectTrigger className={cn(
          "h-9 w-auto min-w-[150px] text-sm",
          (filters.fromDate || filters.toDate) && "border-primary text-primary"
        )}>
          <Calendar className="size-3 mr-1.5 shrink-0" />
          <SelectValue placeholder="Thời gian" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả thời gian</SelectItem>
          <SelectItem value="today">Hôm nay</SelectItem>
          <SelectItem value="7days">7 ngày qua</SelectItem>
          <SelectItem value="30days">30 ngày qua</SelectItem>
          <SelectItem value="month">Tháng này</SelectItem>
        </SelectContent>
      </Select>

      {/* Custom Date Range Inputs */}
      {(filters.fromDate || filters.toDate) && (
        <>
          <Input
            type="date"
            value={filters.fromDate || ''}
            onChange={(e) => updateFilter('fromDate', e.target.value || undefined)}
            className="h-9 w-auto min-w-[140px] text-sm"
          />
          <span className="text-xs text-muted-foreground">—</span>
          <Input
            type="date"
            value={filters.toDate || ''}
            onChange={(e) => updateFilter('toDate', e.target.value || undefined)}
            className="h-9 w-auto min-w-[140px] text-sm"
          />
        </>
      )}

      {/* Clear All */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-sm font-medium"
          onClick={clearAllFilters}
        >
          Xóa lọc
          <X className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
