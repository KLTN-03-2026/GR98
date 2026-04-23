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

function LotCardSkeleton() {
  return (
    <Card className="rounded-[24px] border border-border/70 bg-card/85 p-5 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-10 rounded-[12px]" />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
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
    <Card className="group relative overflow-hidden rounded-[24px] border border-border/70 bg-card/85 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
      {/* Decorative background accent */}
      <div className="absolute -right-4 -top-4 size-24 rounded-full bg-primary/5 blur-2xl transition-all duration-500 group-hover:bg-primary/10" />

      <div className="relative flex flex-col h-full gap-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h3 className="font-manrope text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {lot.product.name}
              </h3>
              <Badge 
                variant="outline" 
                className={`
                  rounded-full border-none px-2 py-0.5 text-[10px] font-bold
                  ${lot.qualityGrade === 'A' ? 'bg-emerald-500/10 text-emerald-700' : ''}
                  ${lot.qualityGrade === 'B' ? 'bg-amber-500/10 text-amber-700' : ''}
                  ${lot.qualityGrade === 'C' ? 'bg-orange-500/10 text-orange-700' : ''}
                  ${lot.qualityGrade === 'REJECT' ? 'bg-rose-500/10 text-rose-700' : ''}
                `}
              >
                Hạng {lot.qualityGrade}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground leading-relaxed">
              <span className="bg-muted/50 px-1.5 py-0.5 rounded border border-border/50 uppercase">SKU: {lot.product.sku}</span>
            </div>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[12px] border border-primary/12 bg-primary/8 text-primary shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            <Box className="size-5" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-xl border border-border/50 bg-muted/30 p-2.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Kho hàng</span>
            <div className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-primary" />
              <span className="font-manrope text-xs font-bold truncate">{lot.warehouse.name}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-border/50 bg-muted/30 p-2.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Số lượng</span>
            <div className="flex items-center gap-1.5">
              <Box className="size-3.5 text-primary" />
              <span className="font-manrope text-xs font-bold">
                {lot.quantityKg.toLocaleString()} {lot.product.unit}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-dashed border-border/50 pt-3">
          <div className="flex items-center gap-1.5 font-medium">
            <Calendar className="size-3.5" />
            {format(new Date(lot.createdAt), 'dd/MM/yyyy', { locale: vi })}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-7 p-0 rounded-lg transition-colors hover:bg-white shadow-none">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-primary/10">
              <DropdownMenuItem 
                onClick={onTrace}
                className="gap-2 cursor-pointer"
              >
                <History className="size-4" />
                <span>Truy xuất nguồn gốc</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                <Info className="size-4" />
                <span>Chi tiết lô hàng</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button
          onClick={onTrace}
          className="w-full rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 border-none group-hover:bg-primary group-hover:text-primary-foreground shadow-none h-9 text-[11px] font-bold"
        >
          <span>Truy xuất nguồn gốc</span>
          <ChevronRight className="size-4 ml-1.5" />
        </Button>
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

  // Fetch data
  const { data: lots, isLoading, isRefetching, refetch } = useGetLots({
    warehouseId: warehouseFilter !== 'all' ? warehouseFilter : undefined,
    qualityGrade: gradeFilter !== 'all' ? gradeFilter : undefined,
  });

  const { data: warehouses } = useGetWarehouses();

  const filteredLots = lots?.filter((lot) =>
    lot.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lot.product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenTrace = (id: string) => {
    setSelectedLotId(id);
    setIsTraceOpen(true);
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-6 font-manrope">
      {/* Header & Functional Bar */}
      <section className="relative shrink-0 overflow-hidden rounded-[22px] border border-primary/10 bg-card/90 p-1 shadow-sm backdrop-blur-md">
        <div className="relative flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between lg:px-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-xl border border-primary/12 bg-primary/8">
                <Box className="size-4 text-primary" />
              </div>
              <h1 className="font-manrope text-xl font-bold tracking-tight text-foreground">
                Quản lý Lô hàng
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Đang tải danh sách...' : `Theo dõi và quản lý ${lots?.length ?? 0} lô hàng trong hệ thống`}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative group min-w-[240px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Tìm sản phẩm, SKU..."
                className="h-10 rounded-full border-border/80 bg-background/50 pl-9 transition-all focus-visible:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 rounded-full bg-background/50 p-1 border border-border/60">
              <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                <SelectTrigger className="h-8 w-[140px] border-none bg-transparent font-medium shadow-none focus:ring-0 text-[11px]">
                  <SelectValue placeholder="Tất cả kho" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-primary/10">
                  <SelectItem value="all">Tất cả kho</SelectItem>
                  {warehouses?.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="h-4 w-px bg-border" />
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="h-8 w-[120px] border-none bg-transparent font-medium shadow-none focus:ring-0 text-[11px]">
                  <SelectValue placeholder="Chất lượng" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-primary/10">
                  <SelectItem value="all">Mọi loại</SelectItem>
                  <SelectItem value="A">Hạng A</SelectItem>
                  <SelectItem value="B">Hạng B</SelectItem>
                  <SelectItem value="C">Hạng C</SelectItem>
                  <SelectItem value="REJECT">Loại bỏ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="size-10 rounded-full border-border/60 bg-background"
                onClick={() => refetch()}
                disabled={isRefetching}
              >
                <RefreshCcw className={`size-4 ${isRefetching ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="h-10 gap-2 rounded-full bg-primary px-6 text-[12px] font-bold shadow-md transition-all hover:shadow-lg active:scale-95"
              >
                <Plus className="size-4" />
                <span>Nhập kho</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Lot Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <div className="col-span-full py-20">
            <Card className="border-dashed border-2 bg-muted/20 rounded-[24px]">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="p-4 bg-muted/50 rounded-full">
                  <Box className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">Không tìm thấy lô hàng</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {searchQuery ? 'Thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc.' : 'Hiện tại chưa có lô hàng nào trong danh sách.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Components */}
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
