import { useState, useMemo } from 'react';
import {
  TrendingUp,
  RefreshCcw,
  Search,
  FileText,
  Package,
  ShoppingCart,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useSupplyDemand } from './api/hooks';
import { SupplyDemandChart } from './components/SupplyDemandChart';
import { SummaryCard } from './components/SummaryCard';
import { SupplyDemandTable } from './components/SupplyDemandTable';
import type { SupplyDemandItem } from './api/types';
import { format } from 'date-fns';

export default function InventorySupplyDemandPage() {
  const [filters, setFilters] = useState({
    cropType: '',
    fromDate: '',
    toDate: '',
  });

  const { data, isLoading, refetch, isRefetching } = useSupplyDemand(filters);

  const stats = useMemo(() => {
    const totalExpected = data?.items.reduce((acc: number, item: SupplyDemandItem) => acc + item.expectedKg, 0) ?? 0;
    const totalStock = data?.items.reduce((acc: number, item: SupplyDemandItem) => acc + item.actualStockKg, 0) ?? 0;
    const totalPending = data?.items.reduce((acc: number, item: SupplyDemandItem) => acc + item.pendingOrderKg, 0) ?? 0;
    const gap = totalStock - totalPending;
    return { totalExpected, totalStock, totalPending, gap };
  }, [data]);

  return (
    <div className="space-y-6 p-4 md:p-6 font-manrope">
      {/* Header Section - Admin Daily Reports Style */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/8">
                    <TrendingUp className="size-4 text-primary" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Cân đối Cung - Cầu</h1>
            </div>
            <Button
                variant="outline"
                size="icon"
                className="size-9 rounded-xl border-slate-200"
                onClick={() => refetch()}
                disabled={isRefetching}
            >
                <RefreshCcw className={`size-4 text-muted-foreground ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Phân tích sản lượng dự kiến từ hợp đồng và nhu cầu thực tế từ đơn hàng thị trường.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold uppercase text-[10px] tracking-wider px-2.5 py-0.5">
            Tồn kho: {stats.totalStock.toLocaleString('vi-VN')} kg
          </Badge>
          <Badge variant="secondary" className="bg-rose-50 text-rose-700 border-rose-100 font-bold uppercase text-[10px] tracking-wider px-2.5 py-0.5">
            Nhu cầu: {stats.totalPending.toLocaleString('vi-VN')} kg
          </Badge>
          <Badge 
            variant="secondary" 
            className={cn(
                "font-bold uppercase text-[10px] tracking-wider px-2.5 py-0.5 border",
                stats.gap >= 0 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                    : "bg-rose-50 text-rose-700 border-rose-100"
            )}
          >
            Cán cân: {stats.gap >= 0 ? '+' : ''}{stats.gap.toLocaleString('vi-VN')} kg
          </Badge>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Sản lượng Dự kiến"
          value={stats.totalExpected}
          icon={FileText}
          description="Từ hợp đồng & báo cáo thu hoạch"
          accentColor="primary"
          isLoading={isLoading}
        />
        <SummaryCard
          title="Tồn kho Thực tế"
          value={stats.totalStock}
          icon={Package}
          description="Hiện có sẵn trong các kho hàng"
          accentColor="emerald"
          isLoading={isLoading}
        />
        <SummaryCard
          title="Nhu cầu Đơn hàng"
          value={stats.totalPending}
          icon={ShoppingCart}
          description="Tổng khối lượng đơn chưa xuất"
          accentColor="rose"
          isLoading={isLoading}
        />
        <SummaryCard
          title="Cán cân Dự phòng"
          value={stats.gap}
          icon={stats.gap >= 0 ? TrendingUp : TrendingDown}
          description={stats.gap >= 0 ? 'Dư cung (Sẵn sàng xuất)' : 'Thiếu hụt (Cần nhập thêm)'}
          accentColor={stats.gap >= 0 ? 'emerald' : 'rose'}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Analytics Chart */}
        <SupplyDemandChart data={data?.items ?? []} />

        {/* Detailed Table */}
        <SupplyDemandTable 
          items={data?.items} 
          isLoading={isLoading || isRefetching} 
          onReload={() => refetch()}
          filterToolbar={
            <div className="flex flex-wrap items-end gap-3 w-full">
              <div className="space-y-1.5 min-w-[200px] flex-1 max-w-sm">
                <Label className="text-xs font-medium">Tìm sản phẩm</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tên cây trồng..."
                    className="pl-8 h-9 rounded-md text-sm"
                    value={filters.cropType}
                    onChange={(e) => setFilters((f) => ({ ...f, cropType: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5 min-w-[150px]">
                <Label className="text-xs font-medium">Từ ngày</Label>
                <Input
                  type="date"
                  className="h-9 rounded-md text-sm"
                  value={filters.fromDate}
                  onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5 min-w-[150px]">
                <Label className="text-xs font-medium">Đến ngày</Label>
                <Input
                  type="date"
                  className="h-9 rounded-md text-sm"
                  value={filters.toDate}
                  onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
                />
              </div>

              {(filters.cropType || filters.fromDate || filters.toDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({ cropType: '', fromDate: '', toDate: '' })}
                  className="h-9 px-3 text-xs text-muted-foreground hover:text-rose-600"
                >
                  Xóa lọc
                </Button>
              )}
              
              <div className="ml-auto pb-0.5">
                  <Badge variant="outline" className="h-9 px-3 border-dashed flex items-center gap-2">
                     <Activity className="size-3.5 text-primary" />
                     <span className="text-xs font-normal text-muted-foreground">Cập nhật: {format(new Date(), 'HH:mm')}</span>
                  </Badge>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}

