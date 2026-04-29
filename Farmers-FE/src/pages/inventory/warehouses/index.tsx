import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Warehouse as WarehouseIcon,
  Search,
  MapPin,
  Calendar,
  Box,
  ChevronRight,
  RefreshCcw,
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetWarehouses } from './api/hooks';
import type { Warehouse } from './api/types';
import { cn } from '@/lib/utils';

function WarehouseCardSkeleton() {
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

function WarehouseCard({
  warehouse,
  onClick,
}: {
  warehouse: Warehouse;
  onClick: () => void;
}) {
  return (
    <Card className="group rounded-2xl border border-l-4 border-l-emerald-500 bg-linear-to-br from-white to-emerald-50/60 p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
            {warehouse.name}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3 text-emerald-500" />
            <span className="truncate">{warehouse.locationAddress ?? 'Chưa cập nhật địa chỉ'}</span>
          </p>
        </div>
        <Badge
          variant="outline"
          className="rounded-full border-none bg-emerald-500/10 text-emerald-700 px-2 py-0.5 text-[10px] font-bold"
        >
          Hoạt động
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1 rounded-xl border border-slate-200/60 bg-white/50 p-2.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Lô hàng</span>
          <div className="flex items-center gap-1.5">
            <Box className="size-3.5 text-emerald-600" />
            <span className="font-manrope text-sm font-bold text-slate-900">{warehouse.lotCount}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-slate-200/60 bg-white/50 p-2.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Khởi tạo</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-emerald-600" />
            <span className="font-manrope text-sm font-bold text-slate-900">
              {format(new Date(warehouse.createdAt), 'MM/yyyy')}
            </span>
          </div>
        </div>
      </div>

      <Button
        onClick={onClick}
        className="mt-4 w-full rounded-full bg-emerald-600 text-white hover:bg-emerald-700 h-9 text-xs font-bold transition-all shadow-none"
      >
        <span>Xem chi tiết kho</span>
        <ChevronRight className="size-4 ml-1.5" />
      </Button>
    </Card>
  );
}

export default function InventoryWarehousesPage() {
  const navigate = useNavigate();
  const { data: warehouses, isLoading, isRefetching, refetch } = useGetWarehouses();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWarehouses = warehouses?.filter((w: Warehouse) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.locationAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  return (
    <div className="h-full min-h-0 flex flex-col gap-5 p-4 sm:p-6 font-manrope">
      {/* Header & Filter Card - Admin Style */}
      <Card className="border-dashed border-emerald-400/50 bg-white">
        <CardContent className="space-y-4 p-4 sm:p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <WarehouseIcon className="size-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Quản lý Kho hàng
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Đang tải danh sách...' : `Đang quản lý ${warehouses?.length ?? 0} kho được phân công`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group min-w-[280px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-600 transition-colors" />
              <Input
                placeholder="Tìm tên kho, địa chỉ..."
                className="h-10 rounded-full border-slate-200 pl-9 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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

      {/* Warehouse Grid */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <WarehouseCardSkeleton key={i} />)
          ) : filteredWarehouses && filteredWarehouses.length > 0 ? (
            filteredWarehouses.map((warehouse: Warehouse) => (
              <WarehouseCard
                key={warehouse.id}
                warehouse={warehouse}
                onClick={() => navigate(`/inventory/warehouses/${warehouse.id}`)}
              />
            ))
          ) : (
            <div className="col-span-full py-10 text-center">
              <Card className="border-dashed border-slate-300 bg-slate-50">
                <CardContent className="py-10">
                  <WarehouseIcon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-600">Không tìm thấy kho hàng</h3>
                  <p className="text-xs text-muted-foreground">Bạn chưa có kho nào hoặc từ khóa tìm kiếm không khớp.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
