import { apiGet, apiPost } from '@/client/lib/api-client';
import type { Product } from '@/client/types';
import type { InventoryLot, LotTrace, CreateLotInput, PendingHarvest, LotTransaction } from './types';

export const lotApi = {
  getLots: (params: { warehouseId?: string; productId?: string; qualityGrade?: string }) =>
    apiGet<InventoryLot[]>('/inventory/lots', { params }),
  
  createLot: (data: CreateLotInput) =>
    apiPost<InventoryLot>('/inventory/lots', data),
  
  getLotById: (id: string) =>
    apiGet<LotTrace>(`/inventory/lots/${id}`),

  getProducts: () =>
    apiGet<Product[]>('/inventory/products'),

  getContracts: () =>
    apiGet<any[]>('/inventory/contracts'),

  updateLotGrade: (id: string, data: { qualityGrade: string; note: string }) =>
    apiPost<InventoryLot>(`/inventory/lots/${id}/grade`, data),

  getPendingHarvests: () =>
    apiGet<PendingHarvest[]>('/inventory/pending-harvests'),

  getWarehouses: () =>
    apiGet<any[]>('/inventory/warehouses'),

  getLotTimeline: (id: string) =>
    apiGet<LotTransaction[]>(`/inventory/lots/${id}/timeline`),
};
