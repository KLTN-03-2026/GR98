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
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetWarehouses } from './api/hooks';
import type { Warehouse } from './api/types';

function WarehouseCardSkeleton() {
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

function WarehouseCard({
  warehouse,
  onClick,
}: {
  warehouse: Warehouse;
  onClick: () => void;
}) {
  return (
    <Card className="group relative overflow-hidden rounded-[24px] border border-border/70 bg-card/85 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
      {/* Decorative background accent */}
      <div className="absolute -right-4 -top-4 size-24 rounded-full bg-primary/5 blur-2xl transition-all duration-500 group-hover:bg-primary/10" />

      <div className="relative flex flex-col h-full gap-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h3 className="font-manrope text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                {warehouse.name}
              </h3>
              <Badge
                variant="outline"
                className="rounded-full border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300"
              >
                Hoạt động
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground leading-relaxed">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate max-w-[200px]">{warehouse.locationAddress ?? 'Chưa cập nhật địa chỉ'}</span>
            </div>
          </div>
          <div className="flex size-11 items-center justify-center rounded-[14px] border border-primary/12 bg-primary/8 text-primary shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            <WarehouseIcon className="size-5" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-xl border border-border/50 bg-muted/30 p-2.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Lô hàng</span>
            <div className="flex items-center gap-1.5">
              <Box className="size-3.5 text-primary" />
              <span className="font-manrope text-sm font-bold">{warehouse.lotCount}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-border/50 bg-muted/30 p-2.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Khởi tạo</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-primary" />
              <span className="font-manrope text-sm font-bold">
                {format(new Date(warehouse.createdAt), 'MM/yyyy')}
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={onClick}
          className="w-full rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 border-none group-hover:bg-primary group-hover:text-primary-foreground shadow-none"
        >
          <span>Xem chi tiết kho</span>
          <ChevronRight className="size-4 ml-1.5" />
        </Button>
      </div>
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
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-6">
      {/* Header & Functional Bar */}
      <section className="relative shrink-0 overflow-hidden rounded-[22px] border border-primary/10 bg-card/90 p-1 shadow-sm backdrop-blur-md">
        <div className="relative flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between lg:px-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-xl border border-primary/12 bg-primary/8">
                <WarehouseIcon className="size-4 text-primary" />
              </div>
              <h1 className="font-manrope text-xl font-bold tracking-tight text-foreground">
                Quản lý Kho hàng
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Đang tải danh sách...' : `Đang quản lý ${warehouses?.length ?? 0} kho được phân công`}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative group min-w-[280px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Tìm tên kho, địa chỉ..."
                className="h-10 rounded-full border-border/80 bg-background/50 pl-9 transition-all focus-visible:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
            </div>
          </div>
        </div>
      </section>

      {/* Warehouse Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
          <div className="col-span-full py-20">
            <Card className="border-dashed border-2 bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                <div className="p-4 bg-muted/50 rounded-full">
                  <WarehouseIcon className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Không tìm thấy kho hàng</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {searchQuery ? 'Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.' : 'Bạn chưa được phân công quản lý kho hàng nào.'}
                  </p>
                </div>
                {searchQuery && (
                  <Button
                    variant="link"
                    className="text-primary"
                    onClick={() => setSearchQuery('')}
                  >
                    Xóa tìm kiếm
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
