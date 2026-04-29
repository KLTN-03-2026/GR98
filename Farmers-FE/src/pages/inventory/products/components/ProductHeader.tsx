import {
  Search,
  Plus,
  Filter,
  RefreshCcw,
  ShoppingBag,
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
import { PRODUCT_STATUS_LABELS, type ProductStatus } from '@/client/types';

interface ProductHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: ProductStatus | 'ALL';
  onStatusChange: (value: ProductStatus | 'ALL') => void;
  onOpenCreate: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function ProductHeader({
  search,
  onSearchChange,
  status,
  onStatusChange,
  onOpenCreate,
  onRefresh,
  isRefreshing,
}: ProductHeaderProps) {
  return (
    <Card className="border-dashed border-emerald-400/50 bg-white rounded-[2rem] shadow-sm">
      <CardContent className="p-4 sm:p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <ShoppingBag className="size-4" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-manrope font-bold tracking-tight text-slate-900">
              Quản lý niêm yết
            </h1>
            <p className="text-xs text-muted-foreground">
              Đưa nông sản lên sàn thương mại điện tử chuyên nghiệp
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group min-w-[240px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-600 transition-colors" />
            <Input
              placeholder="Tìm sản phẩm, SKU..."
              className="h-10 rounded-full border-slate-200 pl-9 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 bg-white"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <Select value={status} onValueChange={(v) => onStatusChange(v as any)}>
            <SelectTrigger className="h-10 w-44 rounded-full border-slate-200 bg-white px-4 text-xs font-bold">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <SelectValue placeholder="Trạng thái" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200">
              <SelectItem value="ALL" className="text-xs font-bold">Tất cả trạng thái</SelectItem>
              {Object.entries(PRODUCT_STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-xs font-bold uppercase">{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-full border-slate-200 bg-white"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCcw className={cn("size-4 text-slate-400", isRefreshing && "animate-spin")} />
            </Button>

            <Button 
              onClick={onOpenCreate} 
              className="h-10 rounded-full px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
            >
              <Plus className="size-4" />
              <span className="text-sm">Niêm yết mới</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
