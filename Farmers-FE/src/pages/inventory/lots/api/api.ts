import { apiGet, apiPost } from '@/client/lib/api-client';
import type { InventoryLot, LotTrace, CreateLotInput } from './types';

export const lotApi = {
  getLots: (params: { warehouseId?: string; productId?: string; qualityGrade?: string }) =>
    apiGet<InventoryLot[]>('/inventory/lots', { params }),
  
  createLot: (data: CreateLotInput) =>
    apiPost<InventoryLot>('/inventory/lots', data),
  
  getLotTrace: (id: string) =>
    apiGet<LotTrace>(`/inventory/lots/${id}`),

  getProducts: () =>
    apiGet<{ id: string; name: string; sku: string; unit: string }[]>('/inventory/products'),

  getContracts: () =>
    apiGet<{ id: string; contractNo: string; farmer: { fullName: string }; plot: { plotCode: string } }[]>('/inventory/contracts'),

  updateLotGrade: (id: string, data: { qualityGrade: string; note: string }) =>
    apiPost<InventoryLot>(`/inventory/lots/${id}/grade`, data),
};
