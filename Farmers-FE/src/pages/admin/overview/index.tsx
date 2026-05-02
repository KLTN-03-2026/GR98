import { useState } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  const { data, isLoading, isError, error, refetch } = useOverviewDashboard(filters);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-primary/[0.07] via-background to-background pb-8 pt-4 dark:from-primary/15">
      <div className="mx-auto w-full max-w-none space-y-6 px-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card px-5 py-6 shadow-sm sm:px-8">
          <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                <LayoutDashboard className="size-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Tổng quan quản trị
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Đơn hàng, doanh thu và vận hành toàn tenant — theo kỳ bạn chọn.
                </p>
              </div>
            </div>
            <AdminTimeRange filters={filters} onChange={setFilters} />
          </div>
        </section>

        {isError && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertTitle>Không tải được dashboard</AlertTitle>
            <AlertDescription className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center">
              <span>{error instanceof Error ? error.message : 'Lỗi không xác định'}</span>
              <button
                type="button"
                className="font-medium underline-offset-2 hover:underline"
                onClick={() => void refetch()}
              >
                Thử lại
              </button>
            </AlertDescription>
          </Alert>
        )}

        <OverviewErrorBoundary>
          <OverviewKpiCards sections={data?.sections} isLoading={isLoading} />

          <OverviewCharts
            timeseries={data?.timeseries}
            orderFulfillDistribution={data?.orderFulfillDistribution}
            orderPaymentDistribution={data?.orderPaymentDistribution}
            contractStatusDistribution={data?.contractStatusDistribution}
            isLoading={isLoading}
          />

          <OverviewActivityTable activities={data?.recentActivity} isLoading={isLoading} />
        </OverviewErrorBoundary>
      </div>
    </div>
  );
}
