import { 
  Search, 
  FilterX, 
  RefreshCcw, 
  Coins,
  Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { PRICE_BOARD_GRADES } from './grade-badge';

interface PriceBoardHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  gradeFilter: string;
  onGradeFilterChange: (value: string) => void;
  isActiveFilter: string;
  onIsActiveFilterChange: (value: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function PriceBoardHeader({
  search,
  onSearchChange,
  gradeFilter,
  onGradeFilterChange,
  isActiveFilter,
  onIsActiveFilterChange,
  onRefresh,
  isRefreshing,
}: PriceBoardHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-dashed border-emerald-400/50 bg-white rounded-[2rem] shadow-sm">
        <CardContent className="p-4 sm:p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Coins className="size-4" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-manrope font-bold tracking-tight text-slate-900 line-clamp-1">
                Thiết lập Bảng giá gốc
              </h1>
              <p className="text-xs text-muted-foreground line-clamp-1">
                Quản lý và điều phối giá mua/bán nông sản niêm yết
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-full border-slate-200 bg-white transition-all hover:bg-slate-50"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCcw className={cn("size-4 text-slate-400", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative group flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-600 transition-colors" />
          <Input
            placeholder="Tìm loại nông sản..."
            className="h-10 rounded-full border-slate-200 pl-10 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 bg-white font-medium placeholder:font-medium placeholder:text-slate-300"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <Select value={gradeFilter} onValueChange={onGradeFilterChange}>
          <SelectTrigger className="h-10 w-[180px] rounded-full border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 hover:border-slate-300 transition-all overflow-hidden">
            <div className="flex items-center gap-2 truncate">
              <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <div className="truncate">
                <SelectValue placeholder="Phẩm cấp" />
              </div>
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-xl">
            <SelectItem value="all" className="text-xs font-bold">TẤT CẢ PHẨM CẤP</SelectItem>
            {PRICE_BOARD_GRADES.map((g) => (
              <SelectItem key={g.value} value={g.value} className="text-xs font-bold uppercase">{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={isActiveFilter} onValueChange={onIsActiveFilterChange}>
          <SelectTrigger className="h-10 w-[160px] rounded-full border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 hover:border-slate-300 transition-all overflow-hidden">
            <div className="flex items-center gap-2 truncate">
              <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <div className="truncate">
                <SelectValue placeholder="Trạng thái" />
              </div>
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-xl">
            <SelectItem value="all" className="text-xs font-bold">TẤT CẢ TRẠNG THÁI</SelectItem>
            <SelectItem value="true" className="text-xs font-bold uppercase">HOẠT ĐỘNG</SelectItem>
            <SelectItem value="false" className="text-xs font-bold uppercase">TẠM DỪNG</SelectItem>
          </SelectContent>
        </Select>

        {(search || gradeFilter !== 'all' || isActiveFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSearchChange('');
              onGradeFilterChange('all');
              onIsActiveFilterChange('all');
            }}
            className="h-10 rounded-full px-4 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all text-[10px] font-bold uppercase tracking-tight"
          >
            <FilterX className="size-3.5 mr-1.5" />
            Xóa bộ lọc
          </Button>
        )}
      </div>
    </div>
  );
}
