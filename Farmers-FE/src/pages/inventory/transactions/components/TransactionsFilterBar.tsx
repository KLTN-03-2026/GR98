import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Calendar } from 'lucide-react';
import type { TransactionFilters } from '../api/types';
import { cn } from '@/lib/utils';

interface TransactionsFilterBarProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  warehouses: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string }>;
}

export function TransactionsFilterBar({ filters, onFiltersChange, warehouses, products }: TransactionsFilterBarProps) {
  const activeFilterCount = Object.entries(filters).filter(
    ([key, val]) => val && val !== 'all' && val !== ''
  ).length;

  const updateFilter = (key: keyof TransactionFilters, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const setDatePreset = (preset: 'today' | '7days' | 'month') => {
    const now = new Date();
    const toDate = now.toISOString().split('T')[0];
    let fromDate = toDate;

    if (preset === '7days') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      fromDate = d.toISOString().split('T')[0];
    } else if (preset === 'month') {
      fromDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    }

    onFiltersChange({ ...filters, fromDate, toDate });
  };

  return (
    <>
      {/* Warehouse */}
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

      {/* Product */}
      <Select
        value={filters.productId || 'all'}
        onValueChange={(val) => updateFilter('productId', val === 'all' ? undefined : val)}
      >
        <SelectTrigger className={cn(
          "h-9 w-auto min-w-[140px] text-sm",
          filters.productId && filters.productId !== 'all' && "border-primary text-primary"
        )}>
          <SelectValue placeholder="Sản phẩm" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả sản phẩm</SelectItem>
          {products.map(p => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Type */}
      <Select
        value={filters.type || 'all'}
        onValueChange={(val) => updateFilter('type', val === 'all' ? undefined : val)}
      >
        <SelectTrigger className={cn(
          "h-9 w-auto min-w-[130px] text-sm",
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

      {/* Date Range */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="relative">
          <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="date"
            value={filters.fromDate || ''}
            onChange={(e) => updateFilter('fromDate', e.target.value || undefined)}
            className="h-9 w-[130px] pl-7 text-xs"
            placeholder="Từ ngày"
          />
        </div>
        <span className="text-xs text-muted-foreground">→</span>
        <div className="relative">
          <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="date"
            value={filters.toDate || ''}
            onChange={(e) => updateFilter('toDate', e.target.value || undefined)}
            className="h-9 w-[130px] pl-7 text-xs"
            placeholder="Đến ngày"
          />
        </div>
      </div>

      {/* Date Presets */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs rounded-full"
          onClick={() => setDatePreset('today')}
        >
          Hôm nay
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs rounded-full"
          onClick={() => setDatePreset('7days')}
        >
          7 ngày
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs rounded-full"
          onClick={() => setDatePreset('month')}
        >
          Tháng này
        </Button>
      </div>

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
    </>
  );
}
