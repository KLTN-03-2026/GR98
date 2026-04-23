import {
  apiGet,
  apiPatch,
  apiPost,
  type ApiSuccessResponse,
} from '@/client/lib/api-client';
import type {
  AdminWarehouseDetail,
  AdminWarehouseRow,
  CreateWarehousePayload,
  UpdateWarehousePayload,
} from './types';

export const adminWarehousesApi = {
  list: () =>
    apiGet<ApiSuccessResponse<AdminWarehouseRow[]>>('/inventory/warehouses'),

  getById: (id: string) =>
    apiGet<ApiSuccessResponse<AdminWarehouseDetail>>(
      `/inventory/warehouses/${id}`,
    ),

  create: (data: CreateWarehousePayload) =>
    apiPost<ApiSuccessResponse<AdminWarehouseRow>>('/inventory/warehouses', data),

  update: (id: string, data: UpdateWarehousePayload) =>
    apiPatch<ApiSuccessResponse<AdminWarehouseRow>>(
      `/inventory/warehouses/${id}`,
      data,
    ),
};
