import { apiGet } from '@/client/lib/api-client';

// ============================================================
// PRODUCT API ENDPOINTS
// ============================================================
export const productApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    cropType?: string;
    grade?: string;
    minPrice?: number;
    maxPrice?: number;
    categoryId?: string;
    sortBy?: string;
  }) => apiGet<unknown>('/products', { params }),

  getBySlug: (slug: string) =>
    apiGet<unknown>(`/products/${slug}`),

  getFeatured: (limit = 8) =>
    apiGet<unknown>('/products/featured', { params: { limit } }),

  getByCategory: (categorySlug: string, params?: { page?: number; limit?: number }) =>
    apiGet<unknown>(`/products/category/${categorySlug}`, { params }),

  getRelated: (productId: string, limit = 4) =>
    apiGet<unknown>(`/products/${productId}/related`, { params: { limit } }),
};
