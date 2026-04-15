import { apiGet } from '@/client/lib/api-client';
import type { DashboardResponse, ChartDataResponse } from './types';

export const inventoryApi = {
  getDashboard: () => apiGet<DashboardResponse>('/inventory/dashboard'),
  getChartData: () => apiGet<ChartDataResponse>('/inventory/dashboard/chart'),
};
