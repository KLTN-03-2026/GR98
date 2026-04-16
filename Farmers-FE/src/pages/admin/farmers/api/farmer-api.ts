import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  type ApiSuccessResponse,
} from '@/client/lib/api-client';
import type { FarmerResponse, PaginatedFarmersResponse } from './types';

export const farmerApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    supervisorId?: string;
    province?: string;
  }) => apiGet<ApiSuccessResponse<PaginatedFarmersResponse>>('/farmers', { params }),

  getById: (id: string) =>
    apiGet<ApiSuccessResponse<FarmerResponse>>(`/farmers/${id}`),

  create: (data: {
    fullName: string;
    phone: string;
    cccd: string;
    bankAccount?: string;
    bankName?: string;
    bankBranch?: string;
    address?: string;
    province?: string;
    supervisorId?: string;
    status?: 'ACTIVE' | 'INACTIVE';
  }) => apiPost<ApiSuccessResponse<FarmerResponse>>('/farmers', data),

  update: (
    id: string,
    data: Partial<{
      fullName: string;
      phone: string;
      cccd: string;
      bankAccount: string;
      bankName: string;
      bankBranch: string;
      address: string;
      province: string;
      supervisorId: string | null;
      status: 'ACTIVE' | 'INACTIVE';
    }>,
  ) => apiPatch<ApiSuccessResponse<FarmerResponse>>(`/farmers/${id}`, data),

  delete: (id: string) =>
    apiDelete<ApiSuccessResponse<{ id: string; deletedAt: string }>>(`/farmers/${id}`),
};
