import { apiGet, apiPost, apiPatch, apiDelete } from '@/client/lib/api-client';
import { ReviewStatus } from '@/client/types';

// ============================================================
// REVIEW API ENDPOINTS
// ============================================================
export const reviewApi = {
  listByProduct: (productId: string, params?: { page?: number; limit?: number }) =>
    apiGet<unknown>(`/products/${productId}/reviews`, { params }),

  create: (productId: string, data: { rating: number; comment?: string; imageUrls?: string[] }) =>
    apiPost<unknown>(`/products/${productId}/reviews`, data),

  // Internal Management Endpoints
  listInternal: (params?: { page?: number; limit?: number; status?: ReviewStatus; search?: string }) =>
    apiGet<unknown>('/reviews/internal', { params }),

  updateStatus: (id: string, status: ReviewStatus) =>
    apiPatch<unknown>(`/reviews/${id}/status`, { status }),

  delete: (id: string) =>
    apiDelete<unknown>(`/reviews/${id}`),
};
