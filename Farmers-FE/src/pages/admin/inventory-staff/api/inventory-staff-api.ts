import { apiGet, apiPost, apiPatch, apiDelete, type ApiSuccessResponse } from '@/client/lib/api-client';
import type { InventoryStaffResponse, PaginatedInventoryStaffResponse } from './types';

export const inventoryStaffApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  }) => apiGet<ApiSuccessResponse<PaginatedInventoryStaffResponse>>('/inventory-staff', { params }),

  getById: (id: string) =>
    apiGet<ApiSuccessResponse<InventoryStaffResponse>>(`/inventory-staff/${id}`),

  create: (data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    avatar?: string;
  }) => apiPost<ApiSuccessResponse<InventoryStaffResponse>>('/inventory-staff', data),

  update: (
    id: string,
    data: Partial<{
      fullName: string;
      email: string;
      phone: string;
      status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
      avatar: string;
      clearAvatar: boolean;
    }>,
  ) => apiPatch<ApiSuccessResponse<InventoryStaffResponse>>(`/inventory-staff/${id}`, data),

  delete: (id: string) =>
    apiDelete<ApiSuccessResponse<{ id: string; deletedAt: string }>>(`/inventory-staff/${id}`),
};
