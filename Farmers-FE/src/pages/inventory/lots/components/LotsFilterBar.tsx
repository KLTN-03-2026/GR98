import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Filter, 
  X,
  Warehouse,
  Package,
  ShieldCheck,
  AlertTriangle,
  Clock,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GetLotsFilters } from '../api/types';

interface LotsFilterBarProps {
  filters: GetLotsFilters;
  onFiltersChange: (filters: GetLotsFilters) => void;
  warehouses: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string }>;
  isLoading?: boolean;
}

const QUALITY_GRADES = [
  { value: 'A', label: 'Loại A', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { value: 'B', label: 'Loại B', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { value: 'C', label: 'Loại C', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { value: 'REJECT', label: 'Reject', color: 'bg-rose-50 text-rose-600 border-rose-100' },
];

const EXPIRY_OPTIONS = [
  { value: 'expiring-soon', label: 'Sắp hết hạn (≤7 ngày)', icon: AlertTriangle, color: 'text-amber-500' },
  { value: 'expired', label: 'Đã hết hạn', icon: Clock, color: 'text-rose-500' },
];

export function LotsFilterBar({ filters, onFiltersChange, warehouses, products, isLoading }: LotsFilterBarProps) {
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const updateFilter = (key: keyof GetLotsFilters, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="space-y-3">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
          <Filter className="size-3.5" />
          Lọc
        </div>

        {/* Warehouse Filter */}
        <Select
          value={filters.warehouseId || ''}
          onValueChange={(val) => updateFilter('warehouseId', val === 'all' ? undefined : val)}
        >
          <SelectTrigger className={cn(
            "h-8 w-auto min-w-[140px] rounded-lg text-xs font-medium border-dashed",
            filters.warehouseId ? "border-primary bg-primary/5 text-primary" : "border-slate-200"
          )}>
            <Warehouse className="size-3 mr-1.5 shrink-0" />
            <SelectValue placeholder="Kho chứa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả kho</SelectItem>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Product Filter */}
        <Select
          value={filters.productId || ''}
          onValueChange={(val) => updateFilter('productId', val === 'all' ? undefined : val)}
        >
          <SelectTrigger className={cn(
            "h-8 w-auto min-w-[140px] rounded-lg text-xs font-medium border-dashed",
            filters.productId ? "border-primary bg-primary/5 text-primary" : "border-slate-200"
          )}>
            <Package className="size-3 mr-1.5 shrink-0" />
            <SelectValue placeholder="Sản phẩm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả sản phẩm</SelectItem>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Quality Grade Filter */}
        <Select
          value={filters.qualityGrade || ''}
          onValueChange={(val) => updateFilter('qualityGrade', val === 'all' ? undefined : val)}
        >
          <SelectTrigger className={cn(
            "h-8 w-auto min-w-[120px] rounded-lg text-xs font-medium border-dashed",
            filters.qualityGrade ? "border-primary bg-primary/5 text-primary" : "border-slate-200"
          )}>
            <ShieldCheck className="size-3 mr-1.5 shrink-0" />
            <SelectValue placeholder="Phẩm cấp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả phẩm cấp</SelectItem>
            {QUALITY_GRADES.map((g) => (
              <SelectItem key={g.value} value={g.value}>
                <span className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", g.color.split(' ')[0])} />
                  {g.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Expiry Status Filter */}
        <Select
          value={filters.expiryStatus || ''}
          onValueChange={(val) => updateFilter('expiryStatus', val === 'all' ? undefined : val)}
        >
          <SelectTrigger className={cn(
            "h-8 w-auto min-w-[160px] rounded-lg text-xs font-medium border-dashed",
            filters.expiryStatus ? "border-rose-300 bg-rose-50 text-rose-600" : "border-slate-200"
          )}>
            <AlertTriangle className="size-3 mr-1.5 shrink-0" />
            <SelectValue placeholder="Hạn sử dụng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {EXPIRY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="flex items-center gap-2">
                  <opt.icon className={cn("size-3", opt.color)} />
                  {opt.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear All */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs font-bold text-slate-400 hover:text-rose-600"
            onClick={clearAllFilters}
          >
            <X className="size-3 mr-1" />
            Xóa bộ lọc ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.warehouseId && (
            <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-[10px] font-bold gap-1">
              Kho: {warehouses.find(w => w.id === filters.warehouseId)?.name}
              <X className="size-3 cursor-pointer hover:text-rose-500" onClick={() => updateFilter('warehouseId', undefined)} />
            </Badge>
          )}
          {filters.productId && (
            <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-[10px] font-bold gap-1">
              SP: {products.find(p => p.id === filters.productId)?.name}
              <X className="size-3 cursor-pointer hover:text-rose-500" onClick={() => updateFilter('productId', undefined)} />
            </Badge>
          )}
          {filters.qualityGrade && (
            <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-[10px] font-bold gap-1">
              Phẩm cấp: {filters.qualityGrade}
              <X className="size-3 cursor-pointer hover:text-rose-500" onClick={() => updateFilter('qualityGrade', undefined)} />
            </Badge>
          )}
          {filters.expiryStatus && (
            <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-[10px] font-bold gap-1 bg-rose-50 text-rose-600">
              {filters.expiryStatus === 'expired' ? 'Đã hết hạn' : 'Sắp hết hạn'}
              <X className="size-3 cursor-pointer hover:text-rose-500" onClick={() => updateFilter('expiryStatus', undefined)} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
