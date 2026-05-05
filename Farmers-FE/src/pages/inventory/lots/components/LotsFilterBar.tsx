import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { Label } from '@/components/ui/label';
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
    <div className="flex flex-wrap items-end gap-3 w-full">
      {/* Product */}
      <div className="space-y-1.5 min-w-[180px] flex-1 max-w-xs">
        <Label className="text-xs font-medium">Sản phẩm</Label>
        <Select
          value={filters.productId || ''}
          onValueChange={(val) => updateFilter('productId', val === 'all' ? undefined : val)}
        >
          <SelectTrigger className={cn("h-9 rounded-md", filters.productId && "border-primary")}>
            <SelectValue placeholder="Tất cả sản phẩm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả sản phẩm</SelectItem>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Warehouse */}
      <div className="space-y-1.5 min-w-[180px] flex-1 max-w-xs">
        <Label className="text-xs font-medium">Kho chứa</Label>
        <Select
          value={filters.warehouseId || ''}
          onValueChange={(val) => updateFilter('warehouseId', val === 'all' ? undefined : val)}
        >
          <SelectTrigger className={cn("h-9 rounded-md", filters.warehouseId && "border-primary")}>
            <SelectValue placeholder="Tất cả kho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả kho</SelectItem>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quality Grade */}
      <div className="space-y-1.5 min-w-[120px]">
        <Label className="text-xs font-medium">Phẩm cấp</Label>
        <Select
          value={filters.qualityGrade || ''}
          onValueChange={(val) => updateFilter('qualityGrade', val === 'all' ? undefined : val)}
        >
          <SelectTrigger className={cn("h-9 rounded-md", filters.qualityGrade && "border-primary")}>
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {QUALITY_GRADES.map((g) => (
              <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Expiry Status */}
      <div className="space-y-1.5 min-w-[150px]">
        <Label className="text-xs font-medium">Hạn sử dụng</Label>
        <Select
          value={filters.expiryStatus || ''}
          onValueChange={(val) => updateFilter('expiryStatus', val === 'all' ? undefined : val)}
        >
          <SelectTrigger className={cn("h-9 rounded-md", filters.expiryStatus && "border-primary")}>
            <SelectValue placeholder="Mặc định" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mặc định</SelectItem>
            {EXPIRY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear All */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-2 text-xs text-muted-foreground hover:text-primary"
          onClick={clearAllFilters}
        >
          <X className="mr-1.5 h-3.5 w-3.5" />
          Xóa lọc
        </Button>
      )}
    </div>
  );
}
