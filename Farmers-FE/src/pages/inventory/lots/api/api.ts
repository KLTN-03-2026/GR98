import { apiGet, apiPost, apiPatch } from '@/client/lib/api-client';
import type { Product } from '@/client/types';
import type { InventoryLot, LotTrace, CreateLotInput, PendingHarvest, LotTransaction } from './types';

export const lotApi = {
  getLots: (params: { warehouseId?: string; productId?: string; qualityGrade?: string }) =>
    apiGet<InventoryLot[]>('/inventory/lots', { params }),
  
  createLot: (data: CreateLotInput) =>
    apiPost<InventoryLot>('/inventory/lots', data),
  
  getLotById: (id: string) =>
    apiGet<LotTrace>(`/inventory/lots/${id}`),

  updateLot: (id: string, data: Partial<InventoryLot> & { note?: string }) =>
    apiPatch<InventoryLot>(`/inventory/lots/${id}`, data),

  createTransaction: (data: any) =>
    apiPost<any>('/inventory/transactions', data),

  getProducts: () =>
    apiGet<Product[]>('/inventory/products'),

  getContracts: () =>
    apiGet<any[]>('/inventory/contracts'),

  getPendingHarvests: () =>
    apiGet<PendingHarvest[]>('/inventory/pending-harvests'),

  getWarehouses: () =>
    apiGet<any[]>('/inventory/warehouses'),

  getLotTimeline: (id: string) =>
    apiGet<LotTransaction[]>(`/inventory/lots/${id}/timeline`),
};
