import { apiGet, apiPost, apiPatch, apiDelete, type ApiSuccessResponse } from '@/client/lib/api-client';
import type { SupervisorResponse, PaginatedSupervisorsResponse } from './types';

export const supervisorApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    zoneId?: string;
  }) => apiGet<ApiSuccessResponse<PaginatedSupervisorsResponse>>('/supervisors', { params }),

  getById: (id: string) =>
    apiGet<ApiSuccessResponse<SupervisorResponse>>(`/supervisors/${id}`),

  create: (data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    zoneId?: string;
    avatar?: string;
  }) => apiPost<ApiSuccessResponse<SupervisorResponse>>('/supervisors', data),

  update: (
    id: string,
    data: Partial<{
      fullName: string;
      email: string;
      phone: string;
      status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
      zoneId: string | null;
      lat: number;
      lng: number;
      avatar: string;
      clearAvatar: boolean;
    }>,
  ) => apiPatch<ApiSuccessResponse<SupervisorResponse>>(`/supervisors/${id}`, data),

  delete: (id: string) =>
    apiDelete<ApiSuccessResponse<{ id: string; deletedAt: string }>>(`/supervisors/${id}`),
};
