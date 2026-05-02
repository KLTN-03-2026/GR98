import { useQuery } from '@tanstack/react-query';
import { extractData } from '@/client/lib/api-client';
import { overviewDashboardApi } from './overview-api';
import type { AdminDashboardOverviewDto, AdminOverviewFilters } from './types';

export function useOverviewDashboard(filters: AdminOverviewFilters) {
  return useQuery({
    queryKey: ['dashboard', 'admin', 'overview', filters],
    queryFn: async () => {
      const response = await overviewDashboardApi.getOverview(filters);
      return extractData<AdminDashboardOverviewDto>(response);
    },
  });
}
