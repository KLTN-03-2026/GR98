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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useInventoryDashboard, useInventoryChartData } from './api';
import { TransactionChart } from './components/TransactionChart';

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
    <Card className="group relative overflow-hidden rounded-[20px] border border-border/70 bg-card/85 py-0 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              {label}
            </p>
            <p className="font-manrope text-2xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-[11px] text-muted-foreground leading-4">{description}</p>
            )}
          </div>
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-[14px] border shadow-sm transition-transform duration-300 group-hover:scale-110 ${
              accentClass ??
              'border-primary/15 bg-primary/8 text-primary dark:border-primary-500/20 dark:bg-primary-500/10'
            }`}
          >
            <Icon className="size-5" />
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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-border/60 bg-muted/45 px-4 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <TrendingUp className="size-3 text-primary" />
        <span>
          <span className="font-semibold text-foreground">{(totalStock / 1000).toFixed(1)} tấn</span>{' '}
          tồn kho
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <InfoPill
          icon={ShoppingCart}
          label={`${pendingOrders} đơn chờ`}
          variant={pendingOrders > 0 ? 'warning' : 'default'}
        />
        <InfoPill
          icon={Clock}
          label={`${expiringLots} lô sắp hết hạn`}
          variant={expiringLots > 0 ? 'destructive' : 'default'}
        />
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

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={`skeleton-row-${i}`} className="group/row">
          <TableCell className="bg-background group-hover/row:bg-muted/60">
            <Skeleton className="h-3.5 w-28" />
          </TableCell>
          <TableCell className="bg-background group-hover/row:bg-muted/60">
            <Skeleton className="h-3.5 w-36" />
          </TableCell>
          <TableCell className="bg-background group-hover/row:bg-muted/60">
            <Skeleton className="h-3.5 w-24" />
          </TableCell>
          <TableCell className="bg-background group-hover/row:bg-muted/60">
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell className="bg-background group-hover/row:bg-muted/60">
            <Skeleton className="ml-auto h-3.5 w-16" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

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
    <div className="flex h-full flex-col gap-5 overflow-y-auto overflow-x-hidden p-6">
      {/* Filter / Header Bar */}
      <section className="relative -mx-1 shrink-0 overflow-hidden rounded-[22px] border border-primary/10 bg-[linear-gradient(180deg,rgba(247,251,252,0.92),rgba(244,248,250,0.82))] px-1 py-1.5 shadow-[0_10px_24px_-24px_rgba(16,24,40,0.22)] backdrop-blur-md dark:bg-[linear-gradient(180deg,rgba(13,20,30,0.94),rgba(10,18,26,0.86))]">
        <div className="pointer-events-none absolute inset-x-20 top-0 h-12 rounded-full bg-primary/8 blur-3xl" />

        <div className="relative h-fit shrink-0 rounded-[20px] border border-primary/10 bg-background/72 px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            {/* Title block */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-xl border border-primary/12 bg-primary/8">
                  <LayoutDashboard className="size-3.5 text-primary" />
                </div>
                <h2 className="font-manrope text-lg font-semibold tracking-tight text-foreground">
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border/60">
        <Button
          variant="ghost"
          size="sm"
          className={`rounded-b-none ${activeTab === 'transactions' ? 'bg-primary/12 text-primary border-b-2 border-primary rounded-b-none' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('transactions')}
        >
          <ArrowRightLeft className="size-4" />
          Giao dịch gần đây
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`rounded-b-none ${activeTab === 'orders' ? 'bg-primary/12 text-primary border-b-2 border-primary rounded-b-none' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('orders')}
        >
          <Package2 className="size-4" />
          Đơn hàng chờ
        </Button>
      </div>

      {/* Transactions Table */}
      {activeTab === 'transactions' && (
        <Card className="rounded-[20px] border border-border/70 bg-card/85 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <WarehouseIcon className="size-4 text-primary" />
              <span className="font-manrope text-sm font-semibold">
                Giao dịch gần đây
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {isLoading ? '...' : data?.recentTransactions?.length ?? 0} giao dịch
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="group/row border-border/60">
                  <TableHead className="bg-muted/40 text-[10px] uppercase tracking-[0.1em]">
                    Ngày giờ
                  </TableHead>
                  <TableHead className="bg-muted/40 text-[10px] uppercase tracking-[0.1em]">
                    Kho hàng
                  </TableHead>
                  <TableHead className="bg-muted/40 text-[10px] uppercase tracking-[0.1em]">
                    Sản phẩm
                  </TableHead>
                  <TableHead className="bg-muted/40 text-[10px] uppercase tracking-[0.1em]">
                    Loại
                  </TableHead>
                  <TableHead className="bg-muted/40 text-right text-[10px] uppercase tracking-[0.1em]">
                    Số lượng
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton rows={6} />
                ) : data?.recentTransactions && data.recentTransactions.length > 0 ? (
                  data.recentTransactions.map((t) => {
                    const badge = TRANSACTION_BADGE[t.type] ?? { label: t.type, className: '' };
                    return (
                      <TableRow
                        key={t.id}
                        className="group/row border-border/40 transition-colors hover:bg-muted/30"
                      >
                        <TableCell className="bg-background/60 py-2.5 text-xs text-muted-foreground group-hover/row:bg-muted/40">
                          {format(new Date(t.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </TableCell>
                        <TableCell className="bg-background/60 py-2.5 text-sm font-medium group-hover/row:bg-muted/40">
                          {t.warehouse.name}
                        </TableCell>
                        <TableCell className="bg-background/60 py-2.5 text-sm text-muted-foreground group-hover/row:bg-muted/40">
                          {t.product.name}
                        </TableCell>
                        <TableCell className="bg-background/60 py-2.5 group-hover/row:bg-muted/40">
                          <Badge
                            variant="outline"
                            className={`rounded-full border px-2 py-0.5 text-[9px] font-medium tracking-wide ${badge.className}`}
                          >
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="bg-background/60 py-2.5 text-right font-semibold text-sm tabular-nums group-hover/row:bg-muted/40">
                          {t.quantityKg.toLocaleString('vi-VN')} kg
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 py-8">
                        <div className="flex size-12 items-center justify-center rounded-full border border-dashed border-muted-foreground/20 bg-muted/30">
                          <ArrowRightLeft className="size-5 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Không có giao dịch nào trong 30 ngày qua
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pending Orders Table */}
      {activeTab === 'orders' && (
        <Card className="rounded-[20px] border border-border/70 bg-card/85 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="size-4 text-primary" />
              <span className="font-manrope text-sm font-semibold">Đơn hàng chờ xử lý</span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {isLoading ? '...' : data?.pendingOrdersList?.length ?? 0} đơn chờ
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="group/row border-border/60">
                  <TableHead className="bg-muted/40 text-[10px] uppercase tracking-[0.1em]">
                    Mã đơn
                  </TableHead>
                  <TableHead className="bg-muted/40 text-[10px] uppercase tracking-[0.1em]">
                    Khách hàng
                  </TableHead>
                  <TableHead className="bg-muted/40 text-[10px] uppercase tracking-[0.1em]">
                    Địa chỉ giao
                  </TableHead>
                  <TableHead className="bg-muted/40 text-[10px] uppercase tracking-[0.1em]">
                    Thanh toán
                  </TableHead>
                  <TableHead className="bg-muted/40 text-[10px] uppercase tracking-[0.1em]">
                    Trạng thái
                  </TableHead>
                  <TableHead className="bg-muted/40 text-right text-[10px] uppercase tracking-[0.1em]">
                    Tổng tiền
                  </TableHead>
                  <TableHead className="bg-muted/40 text-[10px] uppercase tracking-[0.1em]">
                    Ngày đặt
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton rows={6} />
                ) : data?.pendingOrdersList && data.pendingOrdersList.length > 0 ? (
                  data.pendingOrdersList.map((o) => {
                    const badge = FULFILL_BADGE[o.fulfillStatus] ?? {
                      label: o.fulfillStatus,
                      className: '',
                    };
                    return (
                      <TableRow
                        key={o.id}
                        className="group/row border-border/40 transition-colors hover:bg-muted/30"
                      >
                        <TableCell className="bg-background/60 py-2.5 font-medium text-sm group-hover/row:bg-muted/40">
                          {o.orderCode}
                        </TableCell>
                        <TableCell className="bg-background/60 py-2.5 text-sm group-hover/row:bg-muted/40">
                          {o.client?.user.fullName ?? '—'}
                        </TableCell>
                        <TableCell className="bg-background/60 py-2.5 max-w-[180px] truncate text-sm text-muted-foreground group-hover/row:bg-muted/40">
                          {o.shippingAddrText ?? '—'}
                        </TableCell>
                        <TableCell className="bg-background/60 py-2.5 group-hover/row:bg-muted/40">
                          <Badge
                            variant="outline"
                            className={`rounded-full border px-2 py-0.5 text-[9px] font-medium ${
                              o.paymentStatus === 'PAID'
                                ? 'border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300'
                                : 'border-gray-200 bg-gray-500/10 text-gray-600 dark:border-gray-500/30 dark:text-gray-400'
                            }`}
                          >
                            {o.paymentStatus === 'PAID' ? 'Đã thanh toán' : o.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="bg-background/60 py-2.5 group-hover/row:bg-muted/40">
                          <Badge
                            variant="outline"
                            className={`rounded-full border px-2 py-0.5 text-[9px] font-medium tracking-wide ${badge.className}`}
                          >
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="bg-background/60 py-2.5 text-right font-semibold text-sm tabular-nums text-foreground/80 group-hover/row:bg-muted/40">
                          {o.total.toLocaleString('vi-VN')} đ
                        </TableCell>
                        <TableCell className="bg-background/60 py-2.5 text-xs text-muted-foreground whitespace-nowrap group-hover/row:bg-muted/40">
                          {format(new Date(o.orderedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 py-8">
                        <div className="flex size-12 items-center justify-center rounded-full border border-dashed border-muted-foreground/20 bg-muted/30">
                          <Package2 className="size-5 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Không có đơn hàng chờ xử lý
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
