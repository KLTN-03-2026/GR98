import { useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Clock,
  AlertTriangle,
  ArrowRightLeft,
  Package2,
  RefreshCcw,
  Warehouse as WarehouseIcon,
  TrendingUp,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useInventoryDashboard, useInventoryChartData } from './api';
import { TransactionChart } from './components/TransactionChart';
import { DataTable, DataTableColumnHeader } from '@/components/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import type { TransactionResponse, PendingOrderResponse } from './api/types';
import { cn } from '@/lib/utils';

const FULFILL_BADGE: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  PENDING: { label: 'Chờ xử lý', variant: 'destructive' },
  PACKING: { label: 'Đang đóng gói', variant: 'warning' },
  SHIPPED: { label: 'Đang giao', variant: 'secondary' },
  DELIVERED: { label: 'Đã giao', variant: 'success' },
  CANCELLED: { label: 'Đã hủy', variant: 'secondary' },
};

const TRANSACTION_BADGE: Record<string, { label: string; className: string }> = {
  inbound: { label: 'Nhập kho', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  outbound: { label: 'Xuất kho', className: 'bg-rose-50 text-rose-700 border-rose-100' },
  adjustment: { label: 'Điều chỉnh', className: 'bg-blue-50 text-blue-700 border-blue-100' },
};

function KpiCard({
  icon: Icon,
  label,
  value,
  description,
  accentColor = "emerald",
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  description?: string;
  accentColor?: "emerald" | "amber" | "rose" | "violet";
}) {
  const colors = {
    emerald: "border-l-emerald-500 bg-emerald-50/30",
    amber: "border-l-amber-500 bg-amber-50/30",
    rose: "border-l-rose-500 bg-rose-50/30",
    violet: "border-l-violet-500 bg-violet-50/30",
  };

  return (
    <Card className={cn("rounded-2xl border-l-4 p-4 shadow-xs transition hover:shadow-md", colors[accentColor])}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="font-manrope text-2xl font-black text-slate-900">{value}</p>
          {description && (
            <p className="text-[10px] text-muted-foreground leading-tight">{description}</p>
          )}
        </div>
        <div className={cn(
          "flex size-10 items-center justify-center rounded-xl border shadow-xs",
          accentColor === "emerald" ? "bg-emerald-500 text-white" : 
          accentColor === "amber" ? "bg-amber-500 text-white" : 
          accentColor === "rose" ? "bg-rose-500 text-white" : "bg-violet-500 text-white"
        )}>
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}

function StatBar({
  totalStock,
  pendingOrders,
  expiringLots,
  stagnantLots,
}: {
  totalStock: number;
  pendingOrders: number;
  expiringLots: number;
  stagnantLots: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-full border border-emerald-100 bg-emerald-50/50 px-4 py-2">
      <div className="flex items-center gap-2 text-[11px] text-slate-600 font-bold uppercase">
        <TrendingUp className="size-3.5 text-emerald-600" />
        <span>
          Lưu trữ: <span className="text-emerald-700">{(totalStock / 1000).toFixed(1)} tấn</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="rounded-full bg-white text-[10px] border-emerald-100">
          {pendingOrders} đơn chờ
        </Badge>
        <Badge variant="outline" className="rounded-full bg-white text-[10px] border-emerald-100 text-rose-600">
          {expiringLots} lô sắp hết hạn
        </Badge>
      </div>
    </div>
  );
}

const transactionColumns: ColumnDef<TransactionResponse>[] = [
  {
    accessorKey: 'createdAt',
    header: 'Ngày giờ',
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">
        {format(new Date(row.original.createdAt), 'dd/MM HH:mm')}
      </span>
    ),
  },
  {
    accessorKey: 'warehouse.name',
    header: 'Kho hàng',
    cell: ({ row }) => (
      <span className="font-bold text-xs text-slate-900">{row.original.warehouse.name}</span>
    ),
  },
  {
    accessorKey: 'product.name',
    header: 'Sản phẩm',
    cell: ({ row }) => (
      <span className="text-xs font-medium">{row.original.product.name}</span>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Loại',
    cell: ({ row }) => {
      const type = row.original.type;
      const config = TRANSACTION_BADGE[type] ?? { label: type, className: '' };
      return (
        <Badge variant="outline" className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold uppercase", config.className)}>
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'quantityKg',
    header: 'Số lượng',
    cell: ({ row }) => (
      <div className="text-right font-bold text-xs tabular-nums text-slate-900">
        {row.original.quantityKg.toLocaleString()} kg
      </div>
    ),
  },
];

const orderColumns: ColumnDef<PendingOrderResponse>[] = [
  {
    accessorKey: 'orderCode',
    header: 'Mã đơn',
    cell: ({ row }) => <span className="font-bold text-xs">{row.original.orderCode}</span>,
  },
  {
    accessorKey: 'client.user.fullName',
    header: 'Khách hàng',
    cell: ({ row }) => <span className="text-xs">{row.original.client?.user.fullName ?? '—'}</span>,
  },
  {
    accessorKey: 'paymentStatus',
    header: 'Thanh toán',
    cell: ({ row }) => (
      <Badge variant={row.original.paymentStatus === 'PAID' ? 'success' : 'secondary'} className="text-[9px]">
        {row.original.paymentStatus === 'PAID' ? 'Đã trả' : 'Chưa'}
      </Badge>
    ),
  },
  {
    accessorKey: 'fulfillStatus',
    header: 'Trạng thái',
    cell: ({ row }) => {
      const config = FULFILL_BADGE[row.original.fulfillStatus] ?? { label: row.original.fulfillStatus, variant: 'default' };
      return <Badge variant={config.variant} className="text-[9px] uppercase">{config.label}</Badge>;
    },
  },
  {
    accessorKey: 'total',
    header: 'Tổng tiền',
    cell: ({ row }) => (
      <div className="text-right font-bold text-xs tabular-nums text-emerald-600">
        {row.original.total.toLocaleString()}đ
      </div>
    ),
  },
];

export default function InventoryOverviewPage() {
  const { data, isLoading, refetch, isRefetching } = useInventoryDashboard();
  const { data: chartData, isLoading: isChartLoading } = useInventoryChartData();
  const [activeTab, setActiveTab] = useState<'transactions' | 'orders'>('transactions');

  return (
    <div className="h-full min-h-0 flex flex-col gap-5 p-4 sm:p-6 font-manrope">
      {/* Header Card - Admin Style */}
      <Card className="border-dashed border-emerald-400/50 bg-white">
        <CardContent className="p-4 sm:p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <LayoutDashboard className="size-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Tổng quan Kho hàng
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Cập nhật tình hình tồn kho thời gian thực
            </p>
          </div>

          <div className="flex items-center gap-3">
            <StatBar
              totalStock={data?.totalStockKg ?? 0}
              pendingOrders={data?.pendingOrders ?? 0}
              expiringLots={data?.expiringLots ?? 0}
              stagnantLots={data?.stagnantLots ?? 0}
            />
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Package}
          label="Tổng tồn kho"
          value={isLoading ? '...' : `${(data?.totalStockKg ?? 0).toLocaleString()} kg`}
          description="Sản lượng thực tế"
          accentColor="emerald"
        />
        <KpiCard
          icon={ShoppingCart}
          label="Đơn hàng"
          value={isLoading ? '...' : data?.pendingOrders ?? 0}
          description="Đang chờ xử lý"
          accentColor="amber"
        />
        <KpiCard
          icon={Clock}
          label="Sắp hết hạn"
          value={isLoading ? '...' : data?.expiringLots ?? 0}
          description="Trong 7 ngày"
          accentColor="rose"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Tồn đọng"
          value={isLoading ? '...' : data?.stagnantLots ?? 0}
          description="Trên 30 ngày"
          accentColor="violet"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 min-h-0 flex-1">
        {/* Chart Column */}
        <div className="xl:col-span-2 flex flex-col gap-5 min-h-[400px]">
          <Card className="flex-1 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <CardHeader className="py-3 px-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-slate-400">
                <TrendingUp className="size-3.5" />
                Biểu đồ giao dịch
              </h3>
            </CardHeader>
            <CardContent className="p-0">
              <TransactionChart data={chartData} isLoading={isChartLoading} />
            </CardContent>
          </Card>
        </div>

        {/* Tables Column */}
        <div className="flex flex-col gap-5 min-h-0">
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-full w-full">
            <button
              onClick={() => setActiveTab('transactions')}
              className={cn(
                "flex-1 h-8 flex items-center justify-center rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                activeTab === 'transactions' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Giao dịch
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={cn(
                "flex-1 h-8 flex items-center justify-center rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                activeTab === 'orders' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Đơn hàng
            </button>
          </div>

          <Card className="flex-1 rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
            <CardHeader className="py-3 px-4 border-b border-slate-100 bg-slate-50/30 flex-row items-center justify-between space-y-0">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {activeTab === 'transactions' ? 'Giao dịch gần đây' : 'Đơn hàng mới'}
              </h3>
              <Badge variant="outline" className="text-[10px] rounded-full">
                {activeTab === 'transactions' ? data?.recentTransactions?.length ?? 0 : data?.pendingOrdersList?.length ?? 0}
              </Badge>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0 overflow-y-auto">
              {activeTab === 'transactions' ? (
                <DataTable
                  columns={transactionColumns}
                  data={data?.recentTransactions ?? []}
                  isLoading={isLoading}
                  hiddenSearch
                  className="w-full"
                  tableClassName="border-none shadow-none rounded-none"
                />
              ) : (
                <DataTable
                  columns={orderColumns}
                  data={data?.pendingOrdersList ?? []}
                  isLoading={isLoading}
                  hiddenSearch
                  className="w-full"
                  tableClassName="border-none shadow-none rounded-none"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
