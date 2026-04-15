import { apiGet, apiPost, apiPatch, apiDelete } from '@/client/lib/api-client';
import type { CategoryResponse, PaginatedCategoriesResponse, CreateCategoryPayload } from './types';

// ============================================================
// CATEGORY API ENDPOINTS
// ============================================================
export const categoryApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    apiGet<PaginatedCategoriesResponse>('/categories', { params }),

  getById: (id: string) =>
    apiGet<CategoryResponse>(`/categories/${id}`),

  getBySlug: (slug: string) =>
    apiGet<CategoryResponse>(`/categories/slug/${slug}`),

  create: (data: CreateCategoryPayload) =>
    apiPost<CategoryResponse>('/categories', data),

  update: (id: string, data: Partial<CreateCategoryPayload>) =>
    apiPatch<CategoryResponse>(`/categories/${id}`, data),

  reorder: (orders: Array<{ id: string; sortOrder: number }>) =>
    apiPatch<{ updated: number }>('/categories/reorder', { orders }),

  delete: (id: string) =>
    apiDelete<{ id: string; deletedAt: string }>(`/categories/${id}`),
};
