import React from 'react';
import { Search, FilterX, Tag, Layers, Star, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PRODUCT_STATUS_LABELS,
  GRADE_LABELS,
  CROP_TYPES,
  type ProductStatus,
  type QualityGrade,
  type Category
} from '@/client/types';

interface ProductFiltersProps {
  filters: {
    search?: string;
    status?: string;
    grade?: string;
    cropType?: string;
    categoryId?: string;
  };
  categories: Category[];
  onFilterChange: (key: string, value: any) => void;
  onClear: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  categories,
  onFilterChange,
  onClear,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6 space-y-4 animate-in slide-in-from-top duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Tìm theo tên, SKU..."
            className="pl-10 h-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
          />
        </div>

        {/* Status */}
        <Select
          value={filters.status || 'ALL'}
          onValueChange={(val) => onFilterChange('status', val === 'ALL' ? undefined : val)}
        >
          <SelectTrigger className="h-10 bg-slate-50/50 border-slate-200">
            <div className="flex items-center gap-2">
              <Info className="size-4 text-slate-400" />
              <SelectValue placeholder="Trạng thái" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            {Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category */}
        <Select
          value={filters.categoryId || 'ALL'}
          onValueChange={(val) => onFilterChange('categoryId', val === 'ALL' ? undefined : val)}
        >
          <SelectTrigger className="h-10 bg-slate-50/50 border-slate-200">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-slate-400" />
              <SelectValue placeholder="Danh mục" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả danh mục</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Grade */}
        <Select
          value={filters.grade || 'ALL'}
          onValueChange={(val) => onFilterChange('grade', val === 'ALL' ? undefined : val)}
        >
          <SelectTrigger className="h-10 bg-slate-50/50 border-slate-200">
            <div className="flex items-center gap-2">
              <Star className="size-4 text-slate-400" />
              <SelectValue placeholder="Phẩm cấp" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả phẩm cấp</SelectItem>
            {Object.entries(GRADE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                Loại {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Crop Type */}
        <div className="flex gap-2">
          <Select
            value={filters.cropType || 'ALL'}
            onValueChange={(val) => onFilterChange('cropType', val === 'ALL' ? undefined : val)}
          >
            <SelectTrigger className="h-10 bg-slate-50/50 border-slate-200 flex-1">
              <div className="flex items-center gap-2">
                <Tag className="size-4 text-slate-400" />
                <SelectValue placeholder="Loại cây" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả loại cây</SelectItem>
              {Object.entries(CROP_TYPES).map(([key, label]) => (
                <SelectItem key={key} value={label}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
            onClick={onClear}
            title="Xóa lọc"
          >
            <FilterX className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
