import { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  RefreshCw,
  ShieldCheck,
  Sprout,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AdminOverviewFilters } from './api/types';
import { useOverviewDashboard } from './api/use-overview-dashboard';
import { AdminTimeRange } from './components/admin-time-range';
import { OverviewActivityTable } from './components/overview-activity-table';
import { OverviewCharts } from './components/overview-charts';
import { OverviewErrorBoundary } from './components/overview-error-boundary';
import { OverviewKpiCards } from './components/overview-kpi-cards';

export default function AdminOverviewPage() {
  const [filters, setFilters] = useState<AdminOverviewFilters>({
    rangePreset: '14d',
  });
  const { data, isLoading, isFetching, isError, error, refetch } = useOverviewDashboard(filters);

  const summary = useMemo(() => {
    const cards = data?.sections.flatMap((section) => section.cards) ?? [];
    const revenue = cards.find((card) => card.id === 'revenue_mtd');
    const orders = cards.find((card) => card.id === 'orders_mtd');
    const contracts = cards.find((card) => card.id === 'contracts');

    return {
      revenue: revenue ? `${Math.round(revenue.value).toLocaleString('vi-VN')} đ` : '—',
      orders: orders ? orders.value.toLocaleString('vi-VN') : '—',
      contracts: contracts ? contracts.value.toLocaleString('vi-VN') : '—',
    };
  }, [data?.sections]);

  return (
    <div className="min-h-[calc(100vh-4rem)] overflow-hidden bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_32rem),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.32)_42%,hsl(var(--background)))] pb-10 pt-5 dark:bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.2),transparent_30rem),linear-gradient(180deg,hsl(var(--background)),hsl(var(--primary)/0.06)_45%,hsl(var(--background)))]">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72 bg-[linear-gradient(115deg,hsl(var(--primary)/0.12),transparent_38%,hsl(var(--secondary)/0.1))] blur-3xl" />
      <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-[0_24px_80px_rgba(47,93,80,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-card/80 sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/4 size-72 rounded-full bg-secondary/15 blur-3xl" />
          <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary shadow-none hover:bg-primary/10">
                  Admin Command Center
                </Badge>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="size-3.5" />
                  Dữ liệu toàn tenant
                </span>
              </div>

              <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-primary to-[#2F5D50] text-primary-foreground shadow-[0_18px_38px_rgba(47,93,80,0.28)] ring-1 ring-white/50">
                  <LayoutDashboard className="size-7" />
                </div>
                <div className="max-w-3xl">
                  <h1 className="text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl lg:text-5xl">
                    Tổng quan quản trị
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                    Theo dõi sức khỏe vận hành, doanh thu, hợp đồng và hoạt động mới nhất trong một bảng điều khiển trực quan.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-primary/15 bg-primary/[0.06] p-4">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <BarChart3 className="size-4 text-primary" />
                    Doanh thu MTD
                  </div>
                  <p className="mt-2 truncate text-xl font-semibold tabular-nums text-foreground">{summary.revenue}</p>
                </div>
                <div className="rounded-2xl border border-secondary/20 bg-secondary/[0.06] p-4">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <Activity className="size-4 text-secondary" />
                    Đơn hàng MTD
                  </div>
                  <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">{summary.orders}</p>
                </div>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] p-4">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <Sprout className="size-4 text-emerald-600" />
                    Hợp đồng
                  </div>
                  <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">{summary.contracts}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-3xl border border-primary/15 bg-card/80 p-3 shadow-sm backdrop-blur xl:min-w-[360px]">
              <div className="flex items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CalendarDays className="size-4 text-primary" />
                  Bộ lọc thời gian
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-full px-3 text-xs"
                  isLoading={isFetching && !isLoading}
                  onClick={() => void refetch()}
                >
                  <RefreshCw className="size-3.5" />
                  Làm mới
                </Button>
              </div>
              <AdminTimeRange filters={filters} onChange={setFilters} />
            </div>
          </div>
        </section>

        {isError && (
          <Alert variant="destructive" className="rounded-2xl border-destructive/30 bg-destructive/10 shadow-sm">
            <AlertTitle>Không tải được dashboard</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span>{error instanceof Error ? error.message : 'Lỗi không xác định'}</span>
              <Button
                type="button"
                variant="outline-destructive"
                size="sm"
                className="w-fit rounded-full"
                onClick={() => void refetch()}
              >
                Thử lại
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <OverviewErrorBoundary>
          <div className="space-y-6">
            <OverviewKpiCards sections={data?.sections} isLoading={isLoading} />

            <OverviewCharts
              timeseries={data?.timeseries}
              orderFulfillDistribution={data?.orderFulfillDistribution}
              orderPaymentDistribution={data?.orderPaymentDistribution}
              contractStatusDistribution={data?.contractStatusDistribution}
              isLoading={isLoading}
            />
            <OverviewActivityTable activities={data?.recentActivity} isLoading={isLoading} />
          </div>
        </OverviewErrorBoundary>
      </div>
    </div>
  );
}
