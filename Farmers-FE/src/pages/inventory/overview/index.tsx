import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Clock,
  AlertTriangle,
  ArrowRightLeft,
  Package2,
  ShoppingCart,
  RefreshCcw,
  Warehouse as WarehouseIcon,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useInventoryDashboard, useInventoryChartData } from './api';
import { TransactionChart } from './components/TransactionChart';
import { DataTable, DataTableColumnHeader } from '@/components/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import type { TransactionResponse, PendingOrderResponse } from './api/types';

const FULFILL_BADGE: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: 'Chờ xử lý',
    className: 'border-rose-200 bg-rose-500/10 text-rose-700 dark:border-rose-500/30 dark:text-rose-300',
  },
  PACKING: {
    label: 'Đang đóng gói',
    className: 'border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:text-amber-300',
  },
  SHIPPED: {
    label: 'Đang giao',
    className: 'border-blue-200 bg-blue-500/10 text-blue-700 dark:border-blue-500/30 dark:text-blue-300',
  },
  DELIVERED: {
    label: 'Đã giao',
    className: 'border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300',
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'border-gray-200 bg-gray-500/10 text-gray-600 dark:border-gray-500/30 dark:text-gray-400',
  },
};

const TRANSACTION_BADGE: Record<string, { label: string; className: string }> = {
  inbound: {
    label: 'Nhập kho',
    className: 'border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300',
  },
  outbound: {
    label: 'Xuất kho',
    className: 'border-rose-200 bg-rose-500/10 text-rose-700 dark:border-rose-500/30 dark:text-rose-300',
  },
  adjustment: {
    label: 'Điều chỉnh',
    className: 'border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:text-amber-300',
  },
};

function KpiCard({
  icon: Icon,
  label,
  value,
  description,
  accentClass,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  description?: string;
  accentClass?: string;
}) {
  return (
    <Card className="group relative overflow-hidden rounded-[24px] border border-border/70 bg-card/85 py-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
      {/* Decorative background accent */}
      <div className={`absolute -right-4 -top-4 size-24 rounded-full blur-3xl transition-all duration-500 group-hover:opacity-80 ${accentClass?.includes('primary') ? 'bg-primary/10' : 'bg-muted-foreground/10'}`} />

      <CardContent className="relative flex flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
              {label}
            </p>
            <p className="font-manrope text-3xl font-black tracking-tight text-foreground">{value}</p>
            {description && (
              <p className="text-[11px] font-medium text-muted-foreground/80 leading-relaxed">{description}</p>
            )}
          </div>
          <div
            className={`flex size-12 shrink-0 items-center justify-center rounded-[16px] border shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
              accentClass ??
              'border-primary/15 bg-primary/8 text-primary'
            }`}
          >
            <Icon className="size-6" />
          </div>
        </div>
      </CardContent>
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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/40 bg-muted/20 px-5 py-2.5 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
        <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
          <TrendingUp className="size-3.5" />
        </div>
        <span>
          Đang lưu trữ <span className="font-bold text-foreground">{(totalStock / 1000).toFixed(1)} tấn</span> nông sản
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <InfoPill
          icon={ShoppingCart}
          label={`${pendingOrders} đơn chờ`}
          variant={pendingOrders > 0 ? 'warning' : 'default'}
        />
        <div className="h-4 w-px bg-border/50" />
        <InfoPill
          icon={Clock}
          label={`${expiringLots} lô sắp hết hạn`}
          variant={expiringLots > 0 ? 'destructive' : 'default'}
        />
        <div className="h-4 w-px bg-border/50" />
        <InfoPill
          icon={AlertTriangle}
          label={`${stagnantLots} lô tồn đọng`}
          variant={stagnantLots > 0 ? 'destructive' : 'default'}
        />
      </div>
    </div>
  );
}

type PillVariant = 'default' | 'warning' | 'destructive';

function InfoPill({
  icon: Icon,
  label,
  variant = 'default',
}: {
  icon?: LucideIcon;
  label: string;
  variant?: PillVariant;
}) {
  const variantMap: Record<PillVariant, string> = {
    default: 'border-border/70 bg-background/80 text-muted-foreground',
    warning: 'border-amber-200/70 bg-amber-500/8 text-amber-700 dark:border-amber-500/30 dark:text-amber-300',
    destructive: 'border-rose-200/70 bg-rose-500/8 text-rose-700 dark:border-rose-500/30 dark:text-rose-300',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${variantMap[variant]}`}
    >
      {Icon ? <Icon className="size-2.5" /> : null}
      {label}
    </span>
  );
}



// ============================================================
// COLUMN DEFINITIONS
// ============================================================

const transactionColumns: ColumnDef<TransactionResponse>[] = [
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ngày giờ" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap text-xs">
        {format(new Date(row.original.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
      </span>
    ),
  },
  {
    accessorKey: 'warehouse.name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kho hàng" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.warehouse.name}</span>
    ),
  },
  {
    accessorKey: 'product.name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sản phẩm" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground font-medium text-xs">{row.original.product.name}</span>
    ),
  },
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Loại" />
    ),
    cell: ({ row }) => {
      const type = row.original.type;
      const badge = TRANSACTION_BADGE[type] ?? { label: type, className: '' };
      return (
        <Badge
          variant="outline"
          className={`rounded-full border px-2 py-0.5 text-[9px] font-medium tracking-wide ${badge.className}`}
        >
          {badge.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'quantityKg',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Số lượng" className="justify-end" />
    ),
    cell: ({ row }) => (
      <div className="text-right font-semibold tabular-nums">
        {row.original.quantityKg.toLocaleString('vi-VN')} kg
      </div>
    ),
  },
];

const orderColumns: ColumnDef<PendingOrderResponse>[] = [
  {
    accessorKey: 'orderCode',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mã đơn" />
    ),
    cell: ({ row }) => <span className="font-medium">{row.original.orderCode}</span>,
  },
  {
    id: 'customerName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Khách hàng" />
    ),
    cell: ({ row }) => <span>{row.original.client?.user.fullName ?? '—'}</span>,
  },
  {
    accessorKey: 'shippingAddrText',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Địa chỉ giao" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate text-muted-foreground" title={row.original.shippingAddrText ?? ''}>
        {row.original.shippingAddrText ?? '—'}
      </div>
    ),
  },
  {
    accessorKey: 'paymentStatus',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Thanh toán" />
    ),
    cell: ({ row }) => {
      const isPaid = row.original.paymentStatus === 'PAID';
      return (
        <Badge
          variant="outline"
          className={`rounded-full border px-2 py-0.5 text-[9px] font-medium ${
            isPaid
              ? 'border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300'
              : 'border-gray-200 bg-gray-500/10 text-gray-600 dark:border-gray-500/30 dark:text-gray-400'
          }`}
        >
          {isPaid ? 'Đã thanh toán' : row.original.paymentStatus}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'fulfillStatus',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trạng thái" />
    ),
    cell: ({ row }) => {
      const status = row.original.fulfillStatus;
      const badge = FULFILL_BADGE[status] ?? { label: status, className: '' };
      return (
        <Badge
          variant="outline"
          className={`rounded-full border px-2 py-0.5 text-[9px] font-medium tracking-wide ${badge.className}`}
        >
          {badge.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'total',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tổng tiền" className="justify-end" />
    ),
    cell: ({ row }) => (
      <div className="text-right font-semibold tabular-nums text-foreground/80">
        {row.original.total.toLocaleString('vi-VN')} đ
      </div>
    ),
  },
  {
    accessorKey: 'orderedAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ngày đặt" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap text-xs">
        {format(new Date(row.original.orderedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
      </span>
    ),
  },
];

function formatKpiValue(value: number | undefined, unit?: string): string {
  if (value === undefined || value === null) return '...';
  if (unit === 'kg') return `${value.toLocaleString('vi-VN')} kg`;
  return value.toLocaleString('vi-VN');
}

export default function InventoryOverviewPage() {
  const { data, isLoading, error, refetch, isRefetching } = useInventoryDashboard();
  const { data: chartData, isLoading: isChartLoading } = useInventoryChartData();
  const [activeTab, setActiveTab] = useState<'transactions' | 'orders'>('transactions');

  if (error) {
    return (
      <div className="p-6">
        <Card className="rounded-[28px] border border-dashed border-border/80 bg-card/60 py-0">
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full border border-dashed border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10">
              <AlertTriangle className="size-7 text-rose-500" />
            </div>
            <h3 className="mt-5 font-manrope text-xl font-semibold">
              Không thể tải dữ liệu dashboard
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Đã xảy ra lỗi khi tải dữ liệu. Vui lòng kiểm tra kết nối hoặc thử lại.
            </p>
            <Button
              variant="outline"
              className="mt-6 rounded-full"
              onClick={() => refetch()}
            >
              <RefreshCcw className="size-4" />
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalStockKg = data?.totalStockKg ?? 0;
  const pendingOrders = data?.pendingOrders ?? 0;
  const expiringLots = data?.expiringLots ?? 0;
  const stagnantLots = data?.stagnantLots ?? 0;

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto overflow-x-hidden p-6 font-manrope">
      {/* Header & Functional Bar */}
      <section className="relative shrink-0 overflow-hidden rounded-[22px] border border-primary/10 bg-card/90 p-1 shadow-sm backdrop-blur-md">
        <div className="pointer-events-none absolute inset-x-20 top-0 h-12 rounded-full bg-primary/8 blur-3xl" />

        <div className="relative h-fit shrink-0 rounded-[20px] bg-background/50 px-4 py-3.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            {/* Title block */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-xl border border-primary/12 bg-primary/8">
                  <LayoutDashboard className="size-3.5 text-primary" />
                </div>
                <h2 className="font-manrope text-xl font-bold tracking-tight text-foreground">
                  Tổng quan Kho hàng
                </h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Cập nhật tình hình xuất nhập tồn theo thời gian thực
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-8 rounded-full border-primary/12 bg-background/75 px-3 text-[11px]"
                onClick={() => refetch()}
                disabled={isRefetching}
              >
                <RefreshCcw className={`size-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-3">
            <StatBar
              totalStock={totalStockKg}
              pendingOrders={pendingOrders}
              expiringLots={expiringLots}
              stagnantLots={stagnantLots}
            />
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Package}
          label="Tổng tồn kho"
          value={formatKpiValue(isLoading ? undefined : totalStockKg, 'kg')}
          description="Tổng sản lượng các kho được phân công"
          accentClass="border-emerald-200/70 bg-emerald-500/8 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
        />
        <KpiCard
          icon={ShoppingCart}
          label="Đơn chờ xử lý"
          value={isLoading ? '...' : pendingOrders}
          description="Đơn hàng thương mại điện tử chờ duyệt"
          accentClass="border-amber-200/70 bg-amber-500/8 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
        />
        <KpiCard
          icon={Clock}
          label="Lô sắp hết hạn"
          value={isLoading ? '...' : expiringLots}
          description="Trong vòng 7 ngày tới"
          accentClass="border-rose-200/70 bg-rose-500/8 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Lô tồn đọng"
          value={isLoading ? '...' : stagnantLots}
          description="Không xuất kho hơn 30 ngày"
          accentClass="border-violet-200/70 bg-violet-500/8 text-violet-600 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300"
        />
      </div>

      {/* Transaction Chart */}
      <TransactionChart data={chartData} isLoading={isChartLoading} />

      {/* Tab bar - Segmented Control style */}
      <div className="flex w-fit items-center gap-1.5 rounded-2xl border border-border/50 bg-muted/30 p-1.5 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          className={`h-9 px-6 rounded-xl font-bold transition-all duration-300 ${
            activeTab === 'transactions' 
              ? 'bg-background text-primary shadow-sm ring-1 ring-border/20' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('transactions')}
        >
          <ArrowRightLeft className={`size-4 mr-2 ${activeTab === 'transactions' ? 'text-primary' : 'text-muted-foreground'}`} />
          Giao dịch gần đây
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-9 px-6 rounded-xl font-bold transition-all duration-300 ${
            activeTab === 'orders' 
              ? 'bg-background text-primary shadow-sm ring-1 ring-border/20' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('orders')}
        >
          <Package2 className={`size-4 mr-2 ${activeTab === 'orders' ? 'text-primary' : 'text-muted-foreground'}`} />
          Đơn hàng chờ
        </Button>
      </div>

      {/* Transactions Table */}
      {activeTab === 'transactions' && (
        <Card className="rounded-[24px] border border-border/70 bg-card/85 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <WarehouseIcon className="size-4 text-primary" />
              <span className="font-manrope text-sm font-bold">
                Giao dịch gần đây
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {isLoading ? '...' : data?.recentTransactions?.length ?? 0} giao dịch
            </span>
          </CardHeader>
          <CardContent className="px-0 py-0">
            <DataTable
              columns={transactionColumns}
              data={data?.recentTransactions ?? []}
              isLoading={isLoading}
              hiddenSearch
              pageSizeOptions={[5, 10, 15]}
              state={{ pagination: { pageIndex: 0, pageSize: 6 } }}
            />
          </CardContent>
        </Card>
      )}

      {/* Pending Orders Table */}
      {activeTab === 'orders' && (
        <Card className="rounded-[24px] border border-border/70 bg-card/85 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="size-4 text-primary" />
              <span className="font-manrope text-sm font-bold">Đơn hàng chờ xử lý</span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {isLoading ? '...' : data?.pendingOrdersList?.length ?? 0} đơn chờ
            </span>
          </CardHeader>
          <CardContent className="px-0 py-0">
            <DataTable
              columns={orderColumns}
              data={data?.pendingOrdersList ?? []}
              isLoading={isLoading}
              hiddenSearch
              pageSizeOptions={[5, 10, 15]}
              state={{ pagination: { pageIndex: 0, pageSize: 6 } }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
