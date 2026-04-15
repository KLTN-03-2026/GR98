import { useQuery } from '@tanstack/react-query';
import { extractData } from '@/client/lib/api-client';
import { warehouseApi } from './api';
import type { Warehouse, WarehouseDetail } from './types';

export const warehouseKeys = {
  all: ['warehouses'] as const,
  lists: () => [...warehouseKeys.all, 'list'] as const,
  details: () => [...warehouseKeys.all, 'detail'] as const,
  detail: (id: string) => [...warehouseKeys.details(), id] as const,
};

export const useGetWarehouses = () => {
  return useQuery({
    queryKey: warehouseKeys.lists(),
    queryFn: async () => {
      const response = await warehouseApi.getWarehouses();
      return extractData<Warehouse[]>(response);
    },
  });
};

export const useGetWarehouseDetail = (id: string) => {
  return useQuery({
    queryKey: warehouseKeys.detail(id),
    queryFn: async () => {
      const response = await warehouseApi.getWarehouseDetail(id);
      return extractData<WarehouseDetail>(response);
    },
    enabled: !!id,
  });
};
