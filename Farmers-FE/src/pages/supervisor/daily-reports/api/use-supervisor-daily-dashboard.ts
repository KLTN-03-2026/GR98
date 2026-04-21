import { useQuery } from '@tanstack/react-query';
import { useMe } from '@/client/api/auth/use-me';
import { extractData } from '@/client/lib/api-client';
import {
  getLocalDayEndIso,
  getLocalDayStartIso,
  getTodayLocalIsoDate,
} from '@/lib/local-day-range';
import { plotApi, type PaginatedPlotsResponse } from '@/pages/admin/plots/api';
import type { PlotResponse } from '@/pages/admin/plots/api/types';
import {
  dailyReportApi,
  type PaginatedDailyReportsResponse,
} from '@/pages/admin/daily-reports/api';

/** Prefix invalidate sau khi gửi/lưu báo cáo. */
export const SUPERVISOR_DAILY_DASHBOARD_QUERY_KEY = ['supervisor-daily-dashboard'] as const;

const PLOT_PAGE_LIMIT = 50;
const REPORT_PAGE_LIMIT = 16;

export type SupervisorDailyDashboard = {
  plots: PlotResponse[];
  submittedTodayPlotIds: string[];
  missingCount: number;
};

export function useSupervisorDailyDashboard() {
  const { data: me } = useMe();
  const supervisorProfileId = me?.supervisorProfile?.id ?? '';
  const todayIso = getTodayLocalIsoDate();
  const from = getLocalDayStartIso(todayIso);
  const to = getLocalDayEndIso(todayIso);

  return useQuery({
    queryKey: [...SUPERVISOR_DAILY_DASHBOARD_QUERY_KEY, supervisorProfileId, from, to],
    enabled: Boolean(supervisorProfileId) && me?.role === 'SUPERVISOR',
    staleTime: 30_000,
    queryFn: async (): Promise<SupervisorDailyDashboard> => {
      const plots: PlotResponse[] = [];
      let plotPage = 1;
      let plotTotalPages = 1;
      do {
        const res = await plotApi.list({
          page: plotPage,
          limit: PLOT_PAGE_LIMIT,
          id_suppervisor: supervisorProfileId,
        });
        const payload = extractData<PaginatedPlotsResponse>(res);
        plots.push(...payload.data);
        plotTotalPages = Math.max(1, payload.totalPages ?? 1);
        plotPage += 1;
      } while (plotPage <= plotTotalPages);

      const managedPlotIds = new Set(plots.map((p) => p.id));
      const submittedToday = new Set<string>();
      const statuses = ['SUBMITTED', 'REVIEWED'] as const;

      for (const status of statuses) {
        let reportPage = 1;
        let reportTotalPages = 1;
        do {
          const response = await dailyReportApi.list({
            page: reportPage,
            limit: REPORT_PAGE_LIMIT,
            status,
            from,
            to,
          });
          const payload = extractData<PaginatedDailyReportsResponse>(response);
          payload.data.forEach((row) => {
            if (managedPlotIds.has(row.plotId)) {
              submittedToday.add(row.plotId);
            }
          });
          reportTotalPages = Math.max(1, payload.totalPages ?? 1);
          reportPage += 1;
        } while (reportPage <= reportTotalPages);
      }

      const submittedTodayPlotIds = Array.from(submittedToday);
      const missingCount = plots.filter((p) => !submittedToday.has(p.id)).length;

      return { plots, submittedTodayPlotIds, missingCount };
    },
  });
}
