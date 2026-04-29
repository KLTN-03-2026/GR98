import { LayoutDashboard, Package, Clock, AlertTriangle, ShoppingCart, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInventoryDashboard, useInventoryChartData } from './api';
import { TransactionChart } from './components/TransactionChart';
import { KpiCard } from './components/KpiCard';
import { StatBar } from './components/StatBar';
import { TransactionTable } from './components/TransactionTable';
import { OrderTable } from './components/OrderTable';
import { cn } from '@/lib/utils';

export default function InventoryOverviewPage() {
  const { data, isLoading, refetch, isRefetching } = useInventoryDashboard();
  const { data: chartData, isLoading: isChartLoading } = useInventoryChartData();

  return (
    <div className="h-full min-h-0 flex flex-col gap-8 p-6 font-manrope bg-slate-50/30 overflow-y-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-[1.25rem] bg-white border border-slate-200/60 shadow-sm text-emerald-600">
            <LayoutDashboard className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Tổng quan Kho hàng
            </h1>
            <p className="text-xs text-muted-foreground">
              Hệ thống quản lý tồn kho thời gian thực
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="size-11 rounded-2xl bg-white border-slate-200 shadow-sm hover:bg-slate-50 transition-all hover:scale-105 active:scale-95"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCcw className={cn("size-5 text-slate-600", isRefetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Quick Stats & Filters */}
      <div className="flex items-center">
        <StatBar
          totalStock={data?.totalStockKg ?? 0}
          pendingOrders={data?.pendingOrders ?? 0}
          expiringLots={data?.expiringLots ?? 0}
          stagnantLots={data?.stagnantLots ?? 0}
        />
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Package}
          label="Tổng tồn kho"
          value={isLoading ? '...' : `${(data?.totalStockKg ?? 0).toLocaleString()} kg`}
          description="Sản lượng hàng hóa thực tế"
          accentColor="emerald"
        />
        <KpiCard
          icon={ShoppingCart}
          label="Đơn hàng"
          value={isLoading ? '...' : data?.pendingOrders ?? 0}
          description="Yêu cầu đang chờ xử lý"
          accentColor="amber"
        />
        <KpiCard
          icon={Clock}
          label="Sắp hết hạn"
          value={isLoading ? '...' : data?.expiringLots ?? 0}
          description="Cần xử lý trong 7 ngày"
          accentColor="rose"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Tồn đọng"
          value={isLoading ? '...' : data?.stagnantLots ?? 0}
          description="Hàng lưu kho trên 30 ngày"
          accentColor="violet"
        />
      </div>

      {/* Chart Section */}
      <div className="w-full">
        <TransactionChart data={chartData} isLoading={isChartLoading} />
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-8">
        <TransactionTable 
          data={data?.recentTransactions ?? []} 
          isLoading={isLoading} 
        />
        <OrderTable 
          data={data?.pendingOrdersList ?? []} 
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
}
