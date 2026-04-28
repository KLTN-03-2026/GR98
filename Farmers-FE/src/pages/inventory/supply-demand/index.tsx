import { useState } from 'react';
import {
  TrendingUp,
  RefreshCcw,
  Search,
  LayoutDashboard,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSupplyDemand } from './api/hooks';
import { SupplyDemandChart } from './components/SupplyDemandChart';
import { SummaryCard } from './components/SummaryCard';
import { SupplyDemandTable } from './components/SupplyDemandTable';
import type { SupplyDemandItem } from './api/types';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Package, 
  ShoppingCart, 
  TrendingDown 
} from 'lucide-react';

export default function InventorySupplyDemandPage() {
  const [filters, setFilters] = useState({
    cropType: '',
    fromDate: '',
    toDate: '',
  });

  const { data, isLoading, refetch, isRefetching } = useSupplyDemand(filters);

  const totalExpected =
    data?.items.reduce((acc: number, item: SupplyDemandItem) => acc + item.expectedKg, 0) ?? 0;
  const totalStock =
    data?.items.reduce((acc: number, item: SupplyDemandItem) => acc + item.actualStockKg, 0) ?? 0;
  const totalPending =
    data?.items.reduce((acc: number, item: SupplyDemandItem) => acc + item.pendingOrderKg, 0) ?? 0;

  const gap = totalStock - totalPending;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/8">
              <LayoutDashboard className="size-4 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Cân đối Cung - Cầu</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Phân tích sản lượng dự kiến và nhu cầu thị trường
          </p>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Sản lượng Dự kiến"
          value={totalExpected}
          unit="kg"
          icon={FileText}
          description="Từ hợp đồng & báo cáo"
          accent="primary"
          isLoading={isLoading}
        />
        <SummaryCard
          title="Tồn kho Thực tế"
          value={totalStock}
          unit="kg"
          icon={Package}
          description="Hiện có trong kho"
          accent="emerald"
          isLoading={isLoading}
        />
        <SummaryCard
          title="Nhu cầu Đơn hàng"
          value={totalPending}
          unit="kg"
          icon={ShoppingCart}
          description="Đơn chưa xuất kho"
          accent="rose"
          isLoading={isLoading}
        />
        <SummaryCard
          title="Cán cân Dự phòng"
          value={gap}
          unit="kg"
          icon={gap >= 0 ? TrendingUp : TrendingDown}
          description={gap >= 0 ? 'Dư cung (Sẵn sàng)' : 'Thiếu hụt (Cần nhập)'}
          accent={gap >= 0 ? 'emerald' : 'rose'}
          isLoading={isLoading}
        />
      </div>

      {/* Content Sections - Stacked Vertically for Space */}
      <div className="flex flex-col gap-8 pb-8">
        <SupplyDemandChart data={data?.items ?? []} />
        <SupplyDemandTable 
          items={data?.items} 
          isLoading={isLoading || isRefetching} 
          onReload={() => refetch()}
          filterToolbar={
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm theo loại cây trồng..."
                className="pl-9 h-9 bg-background border-muted-foreground/20 focus-visible:ring-1"
                value={filters.cropType}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, cropType: e.target.value }))
                }
                disabled={isLoading || isRefetching}
              />
            </div>
          }
        />
      </div>
    </div>
  );
}
