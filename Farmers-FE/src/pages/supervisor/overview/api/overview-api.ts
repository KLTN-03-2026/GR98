import { apiGet } from '@/client/lib/api-client';
import type { DashboardOverviewDto, SupervisorOverviewFilters } from './types';

export const overviewDashboardApi = {
  getOverview: (filters: SupervisorOverviewFilters) =>
    apiGet<DashboardOverviewDto>('/dashboard/overview', {
      params: {
        rangePreset: filters.rangePreset,
        from: filters.from,
        to: filters.to,
      },
    }),
};
