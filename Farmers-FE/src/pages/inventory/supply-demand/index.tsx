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
    <div className="h-full min-h-0 flex flex-col gap-8 p-6 font-manrope bg-slate-50/30 overflow-y-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
            <LayoutDashboard className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Cân đối Cung - Cầu
            </h1>
            <p className="text-xs text-muted-foreground">
              Phân tích sản lượng dự kiến và nhu cầu thị trường
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group min-w-[240px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-600 transition-colors" />
            <Input
              placeholder="Tìm theo loại cây trồng..."
              className="h-10 rounded-full border-slate-200 pl-9 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 bg-white"
              value={filters.cropType}
              onChange={(e) =>
                setFilters((f) => ({ ...f, cropType: e.target.value }))
              }
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="size-10 rounded-full border-slate-200 bg-white"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCcw className={cn("size-4", isRefetching && "animate-spin")} />
          </Button>
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
        <SupplyDemandTable items={data?.items} isLoading={isLoading} />
      </div>
    </div>
  );
}
