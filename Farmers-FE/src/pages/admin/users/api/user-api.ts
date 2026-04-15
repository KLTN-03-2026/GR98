import { apiGet, apiPost, apiPatch, apiDelete } from '@/client/lib/api-client';
import type { UserResponse, PaginatedUsersResponse } from './types';

export const userApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: 'ADMIN' | 'SUPERVISOR' | 'INVENTORY' | 'CLIENT';
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  }) => apiGet<PaginatedUsersResponse>('/users', { params }),

  getById: (id: string) =>
    apiGet<UserResponse>(`/users/${id}`),

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
  }) => apiPost<UserResponse>('/users', data),

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
  ) => apiPatch<UserResponse>(`/users/${id}`, data),

  delete: (id: string) =>
    apiDelete<{ id: string; deletedAt: string }>(`/users/${id}`),
};
