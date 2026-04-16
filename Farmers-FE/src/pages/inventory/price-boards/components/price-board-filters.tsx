import { Search, FilterX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PRICE_BOARD_GRADES } from './grade-badge';
import { Card, CardContent } from '@/components/ui/card';

interface PriceBoardFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  gradeFilter: string;
  onGradeFilterChange: (value: string) => void;
  isActiveFilter: string;
  onIsActiveFilterChange: (value: string) => void;
  onClear: () => void;
}

export function PriceBoardFilters({
  search,
  onSearchChange,
  gradeFilter,
  onGradeFilterChange,
  isActiveFilter,
  onIsActiveFilterChange,
  onClear,
}: PriceBoardFiltersProps) {
  const hasFilter = search || gradeFilter || isActiveFilter;

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm loại nông sản..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-10 border-slate-200"
            />
          </div>

          <div className="flex items-center gap-3">
            <Select value={gradeFilter} onValueChange={onGradeFilterChange}>
              <SelectTrigger className="w-[180px] h-10 border-slate-200">
                <SelectValue placeholder="Tất cả phẩm cấp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phẩm cấp</SelectItem>
                {PRICE_BOARD_GRADES.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={isActiveFilter} onValueChange={onIsActiveFilterChange}>
              <SelectTrigger className="w-[180px] h-10 border-slate-200">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="true">Đang hoạt động</SelectItem>
                <SelectItem value="false">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>

            {hasFilter && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClear} 
                className="h-10 px-3 text-muted-foreground border-slate-200"
              >
                <FilterX className="size-4 mr-2" />
                Đặt lại
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
