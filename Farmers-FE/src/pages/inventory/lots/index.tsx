import { useState } from 'react';
import {
  Plus,
  MapPin,
  Box,
  Info,
  History,
  MoreVertical,
  Calendar,
  ChevronRight,
  RefreshCcw,
  Search,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetLots } from './api';
import { useGetWarehouses } from '../warehouses/api';
import { format } from 'date-fns';
import CreateLotModal from './components/CreateLotModal';
import TraceabilityView from './components/TraceabilityView';
import type { InventoryLot } from './api/types';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

function LotCardSkeleton() {
  return (
    <Card className="animate-pulse border-l-4 border-l-emerald-400/40">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-44" />
        </div>
        <Skeleton className="h-8 w-full rounded-full" />
      </CardContent>
    </Card>
  );
}

function LotCard({
  lot,
  onTrace,
}: {
  lot: InventoryLot;
  onTrace: () => void;
}) {
  return (
    <Card className="group rounded-2xl border border-l-4 border-l-emerald-500 bg-linear-to-br from-white to-emerald-50/60 p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
            {lot.product.name}
          </h3>
          <p className="mt-0.5 truncate text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            SKU: {lot.product.sku}
          </p>
        </div>
        <Badge 
          variant="outline" 
          className={cn(
            "rounded-full border-none px-2 py-0.5 text-[10px] font-bold",
            lot.qualityGrade === 'A' ? 'bg-emerald-500/10 text-emerald-700' : 
            lot.qualityGrade === 'B' ? 'bg-amber-500/10 text-amber-700' : 
            lot.qualityGrade === 'C' ? 'bg-orange-500/10 text-orange-700' : 
            'bg-rose-500/10 text-rose-700'
          )}
        >
          Hạng {lot.qualityGrade}
        </Badge>
      </div>

      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <p className="inline-flex items-center gap-2">
          <MapPin className="h-4 w-4 text-emerald-500" />
          <span className="truncate font-medium">{lot.warehouse.name}</span>
        </p>
        <p className="inline-flex items-center gap-2">
          <Box className="h-4 w-4 text-emerald-500" />
          <span className="font-bold text-slate-900">
            {lot.quantityKg.toLocaleString()} {lot.product.unit}
          </span>
        </p>
        <div className="flex items-center gap-2 text-xs opacity-70">
          <Calendar className="h-3.5 w-3.5" />
          {format(new Date(lot.createdAt), 'dd/MM/yyyy', { locale: vi })}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button
          onClick={onTrace}
          className="flex-1 rounded-full bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600 hover:text-white h-8 text-xs font-bold transition-all shadow-none"
        >
          Truy xuất nguồn gốc
          <ChevronRight className="size-3 ml-1" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 rounded-full">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem onClick={onTrace} className="gap-2">
              <History className="size-4" /> Truy xuất
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
              <Info className="size-4" /> Chi tiết
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}

export default function InventoryLotsPage() {
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [isTraceOpen, setIsTraceOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleOpenTrace = (id: string) => {
    setSelectedLotId(id);
    setIsTraceOpen(true);
  };

  const { data: lots, isLoading, isRefetching, refetch } = useGetLots({
    warehouseId: warehouseFilter !== 'all' ? warehouseFilter : undefined,
    qualityGrade: gradeFilter !== 'all' ? gradeFilter : undefined,
  });

  const { data: warehouses } = useGetWarehouses();

  const filteredLots = lots?.filter((lot) =>
    lot.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lot.product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full min-h-0 flex flex-col gap-5 p-4 sm:p-6 font-manrope">
      {/* Header & Filter Card - Admin Style */}
      <Card className="border-dashed border-emerald-400/50 bg-white">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <Box className="size-4" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Quản lý Lô hàng
                </h1>
              </div>
              <p className="text-xs text-muted-foreground">
                {isLoading ? 'Đang tải danh sách...' : `Theo dõi và quản lý ${lots?.length ?? 0} lô hàng`}
              </p>
            </div>

            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-10 px-6"
            >
              <Plus className="size-4" />
              <span className="font-bold text-sm">Nhập kho mới</span>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-emerald-100/50">
            <div className="relative group flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-600 transition-colors" />
              <Input
                placeholder="Tìm sản phẩm, SKU..."
                className="h-10 rounded-full border-slate-200 pl-9 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger className="h-10 w-[180px] rounded-full border-slate-200 bg-white">
                <SelectValue placeholder="Tất cả kho" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Tất cả kho</SelectItem>
                {warehouses?.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="h-10 w-[140px] rounded-full border-slate-200 bg-white">
                <SelectValue placeholder="Chất lượng" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Mọi hạng</SelectItem>
                <SelectItem value="A">Hạng A</SelectItem>
                <SelectItem value="B">Hạng B</SelectItem>
                <SelectItem value="C">Hạng C</SelectItem>
                <SelectItem value="REJECT">Loại bỏ</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-full border-slate-200"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCcw className={cn("size-4", isRefetching && "animate-spin")} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lot Grid */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <LotCardSkeleton key={i} />)
          ) : filteredLots && filteredLots.length > 0 ? (
            filteredLots.map((lot) => (
              <LotCard
                key={lot.id}
                lot={lot}
                onTrace={() => handleOpenTrace(lot.id)}
              />
            ))
          ) : (
            <div className="col-span-full py-10">
              <Card className="border-dashed border-slate-300 bg-slate-50">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <Box className="h-10 w-10 text-slate-300 mb-3" />
                  <h3 className="text-sm font-bold text-slate-600">Không tìm thấy lô hàng</h3>
                  <p className="text-xs text-muted-foreground">Thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <CreateLotModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
      
      <TraceabilityView 
        lotId={selectedLotId}
        isOpen={isTraceOpen}
        onClose={() => {
          setIsTraceOpen(false);
          setSelectedLotId(null);
        }}
      />
    </div>
  );
}
