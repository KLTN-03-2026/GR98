import { useQuery } from '@tanstack/react-query';
import { extractData } from '@/client/lib/api-client';
import { inventoryApi } from './api';
import type { DashboardResponse, ChartDataResponse } from './types';

export function useInventoryDashboard() {
  return useQuery({
    queryKey: ['inventory', 'dashboard'],
    queryFn: async () => {
      const response = await inventoryApi.getDashboard();
      return extractData<DashboardResponse>(response);
    },
  });
}

export function useInventoryChartData() {
  return useQuery({
    queryKey: ['inventory', 'dashboard', 'chart'],
    queryFn: async () => {
      const response = await inventoryApi.getChartData();
      return extractData<ChartDataResponse>(response);
    },
  });
}