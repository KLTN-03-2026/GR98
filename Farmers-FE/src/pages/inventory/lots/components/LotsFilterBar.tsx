import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GetLotsFilters } from '../api/types';

interface LotsFilterBarProps {
  filters: GetLotsFilters;
  onFiltersChange: (filters: GetLotsFilters) => void;
  warehouses: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string }>;
}

const QUALITY_GRADES = [
  { value: 'A', label: 'Loại A' },
  { value: 'B', label: 'Loại B' },
  { value: 'C', label: 'Loại C' },
  { value: 'REJECT', label: 'Reject' },
];

const EXPIRY_OPTIONS = [
  { value: 'expiring-soon', label: 'Sắp hết hạn (≤7 ngày)' },
  { value: 'expired', label: 'Đã hết hạn' },
];

export function LotsFilterBar({ filters, onFiltersChange, warehouses, products }: LotsFilterBarProps) {
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const updateFilter = (key: keyof GetLotsFilters, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  return (
    <>
      {/* Warehouse */}
      <Select
        value={filters.warehouseId || ''}
        onValueChange={(val) => updateFilter('warehouseId', val === 'all' ? undefined : val)}
      >
        <SelectTrigger className={cn(
          "h-9 w-auto min-w-[140px] text-sm",
          filters.warehouseId && "border-primary text-primary"
        )}>
          <SelectValue placeholder="Kho chứa" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả kho</SelectItem>
          {warehouses.map((w) => (
            <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Product */}
      <Select
        value={filters.productId || ''}
        onValueChange={(val) => updateFilter('productId', val === 'all' ? undefined : val)}
      >
        <SelectTrigger className={cn(
          "h-9 w-auto min-w-[140px] text-sm",
          filters.productId && "border-primary text-primary"
        )}>
          <SelectValue placeholder="Sản phẩm" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả sản phẩm</SelectItem>
          {products.map((p) => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Quality Grade */}
      <Select
        value={filters.qualityGrade || ''}
        onValueChange={(val) => updateFilter('qualityGrade', val === 'all' ? undefined : val)}
      >
        <SelectTrigger className={cn(
          "h-9 w-auto min-w-[120px] text-sm",
          filters.qualityGrade && "border-primary text-primary"
        )}>
          <SelectValue placeholder="Phẩm cấp" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả phẩm cấp</SelectItem>
          {QUALITY_GRADES.map((g) => (
            <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Expiry Status */}
      <Select
        value={filters.expiryStatus || ''}
        onValueChange={(val) => updateFilter('expiryStatus', val === 'all' ? undefined : val)}
      >
        <SelectTrigger className={cn(
          "h-9 w-auto min-w-[160px] text-sm",
          filters.expiryStatus && "border-destructive text-destructive"
        )}>
          <SelectValue placeholder="Hạn sử dụng" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả</SelectItem>
          {EXPIRY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

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
