import { apiGet } from '@/client/lib/api-client';
import type { AdminDashboardOverviewDto, AdminOverviewFilters } from './types';

export const overviewDashboardApi = {
  getOverview: (filters: AdminOverviewFilters) =>
    apiGet<AdminDashboardOverviewDto>('/dashboard/admin/overview', {
      params: {
        rangePreset: filters.rangePreset,
        from: filters.from,
        to: filters.to,
      },
    }),
};
