import { useState } from 'react';
import { Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { SupervisorOverviewFilters } from './api/types';
import { useOverviewDashboard } from './api/use-overview-dashboard';
import { OverviewActivityTable } from './components/overview-activity-table';
import { OverviewCharts } from './components/overview-charts';
import { OverviewKpiCards } from './components/overview-kpi-cards';
import { SupervisorTimeRange } from './components/supervisor-time-range';

export default function SupervisorOverviewPage() {
  const [filters, setFilters] = useState<SupervisorOverviewFilters>({
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
                <Sprout className="size-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Tổng quan giám sát viên
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Chỉ số theo kỳ bạn chọn, trong phạm vi phụ trách.
                </p>
              </div>
            </div>
            <SupervisorTimeRange filters={filters} onChange={setFilters} />
          </div>
        </section>

        {!isLoading &&
          data?.missingDailyReportsToday !== undefined &&
          data.missingDailyReportsToday > 0 && (
            <Alert className="rounded-xl border-amber-500/35 bg-amber-500/[0.08] text-foreground dark:bg-amber-500/10">
              <AlertTitle>Hôm nay còn lô chưa báo cáo</AlertTitle>
              <AlertDescription className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Có{' '}
                  <strong className="tabular-nums text-foreground">
                    {data.missingDailyReportsToday}
                  </strong>{' '}
                  lô phụ trách chưa có báo cáo đã gửi hoặc đã duyệt trong ngày.
                </span>
                <Link
                  to="/supervisor/daily-reports"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Đi tới báo cáo hàng ngày
                </Link>
              </AlertDescription>
            </Alert>
          )}

        {isError && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertTitle>Không tải được tổng quan</AlertTitle>
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

        <OverviewKpiCards kpis={data?.kpis} isLoading={isLoading} />

        <OverviewCharts
          timeseries={data?.timeseries}
          statusDistribution={data?.statusDistribution}
          dailyReportStatusDistribution={data?.dailyReportStatusDistribution}
          isLoading={isLoading}
        />

        <OverviewActivityTable activities={data?.recentActivity} isLoading={isLoading} />
      </div>
    </div>
  );
}
