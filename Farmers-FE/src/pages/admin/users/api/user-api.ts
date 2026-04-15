import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  type ApiSuccessResponse,
} from '@/client/lib/api-client';
import type { UserResponse, PaginatedUsersResponse } from './types';

export const userApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: 'ADMIN' | 'SUPERVISOR' | 'INVENTORY' | 'CLIENT';
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    excludeClient?: boolean;
  }) => apiGet<ApiSuccessResponse<PaginatedUsersResponse>>('/users', { params }),

  getById: (id: string) =>
    apiGet<ApiSuccessResponse<UserResponse>>(`/users/${id}`),

  create: (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role: 'ADMIN' | 'SUPERVISOR' | 'INVENTORY' | 'CLIENT';
    avatar?: string;
    province?: string;
    businessName?: string;
    defaultAddress?: string;
  }) => apiPost<ApiSuccessResponse<UserResponse>>('/users', data),

  update: (
    id: string,
    data: Partial<{
      email: string;
      password: string;
      fullName: string;
      phone: string;
      role: 'ADMIN' | 'SUPERVISOR' | 'INVENTORY' | 'CLIENT';
      status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
      avatar: string;
      clearAvatar: boolean;
      province: string;
      businessName: string;
      defaultAddress: string;
    }>,
  ) => apiPatch<ApiSuccessResponse<UserResponse>>(`/users/${id}`, data),

  delete: (id: string) =>
    apiDelete<ApiSuccessResponse<{ id: string; deletedAt: string }>>(`/users/${id}`),
};
