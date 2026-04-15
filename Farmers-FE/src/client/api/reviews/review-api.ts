import { apiGet, apiPost } from '@/client/lib/api-client';

// ============================================================
// REVIEW API ENDPOINTS
// ============================================================
export const reviewApi = {
  listByProduct: (productId: string, params?: { page?: number; limit?: number }) =>
    apiGet<unknown>(`/products/${productId}/reviews`, { params }),

  create: (productId: string, data: { rating: number; comment?: string; imageUrls?: string[] }) =>
    apiPost<unknown>(`/products/${productId}/reviews`, data),
};
