import { apiGet } from '@/client/lib/api-client';
import type { Warehouse, WarehouseDetail } from './types';

export const warehouseApi = {
  getWarehouses: () => apiGet<Warehouse[]>('/inventory/warehouses'),
  getWarehouseDetail: (id: string) => apiGet<WarehouseDetail>(`/inventory/warehouses/${id}`),
};
