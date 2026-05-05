// src/pages/inventory/categories/CategoryFilters.tsx
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface CategoryFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: 'all' | 'active' | 'inactive'; // union type
  onStatusChange: (value: 'all' | 'active' | 'inactive') => void;
}


export function CategoryFilters({ search, onSearchChange, status, onStatusChange }: CategoryFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative group min-w-[200px]">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-600 transition-colors" />
        <Input
          placeholder="Tìm danh mục..."
          className="h-9 rounded-full border-slate-200 pl-9 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      {/* Status Filter */}
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[150px] h-9 rounded-full border-slate-200">
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả</SelectItem>
          <SelectItem value="active">Hoạt động</SelectItem>
          <SelectItem value="inactive">Không hoạt động</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
