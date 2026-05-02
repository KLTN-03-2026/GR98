import { useQuery } from '@tanstack/react-query';
import { extractData } from '@/client/lib/api-client';
import { overviewDashboardApi } from './overview-api';
import type { DashboardOverviewDto, SupervisorOverviewFilters } from './types';

export function useOverviewDashboard(filters: SupervisorOverviewFilters) {
  return useQuery({
    queryKey: ['dashboard', 'overview', 'supervisor', filters],
    queryFn: async () => {
      const response = await overviewDashboardApi.getOverview(filters);
      return extractData<DashboardOverviewDto>(response);
    },
  });
}
