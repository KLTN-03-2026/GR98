import { apiGet, apiPost, apiPatch } from '@/client/lib/api-client';
import type { Product } from '@/client/types';
import type { InventoryLot, LotTrace, CreateLotInput, UpdateLotInput, PendingHarvest, LotTransaction, GetLotsFilters } from './types';

export const lotApi = {
  getLots: (params: GetLotsFilters) =>
    apiGet<InventoryLot[]>('/inventory/lots', { params }),
  
  createLot: (data: CreateLotInput) =>
    apiPost<InventoryLot>('/inventory/lots', data),
  
  getLotById: (id: string) =>
    apiGet<LotTrace>(`/inventory/lots/${id}`),

  updateLot: (id: string, data: UpdateLotInput) =>
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

  confirmReceipt: (data: { lotId: string; actualWeight: number; note?: string }) =>
    apiPost<InventoryLot>(`/inventory/lots/${data.lotId}/confirm`, { 
      actualWeight: data.actualWeight, 
      note: data.note 
    }),

  rejectLot: (data: { lotId: string; reason: string }) =>
    apiPost<InventoryLot>(`/inventory/lots/${data.lotId}/reject`, {
      reason: data.reason,
    }),
  
  receiveHarvest: (data: {
    dailyReportId: string;
    contractId: string;
    warehouseId: string;
    actualWeight: number;
    qualityGrade: string;
    note?: string;
  }) =>
    apiPost<InventoryLot>('/inventory/receive-harvest', data),
};
