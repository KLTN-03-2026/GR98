import { apiGet, apiPost, apiPatch, apiDelete } from '@/client/lib/api-client';
import type { PriceBoardResponse, PaginatedPriceBoardsResponse } from './types';

export const priceBoardApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    cropType?: string;
    grade?: string;
    isActive?: string;
  }) => apiGet<PaginatedPriceBoardsResponse>('/price-boards', { params }),

  getById: (id: string) =>
    apiGet<PriceBoardResponse>(`/price-boards/${id}`),

  create: (data: {
    cropType: string;
    grade: PriceBoardResponse['grade'];
    buyPrice: number;
    sellPrice: number;
    effectiveDate?: string;
  }) => apiPost<PriceBoardResponse>('/price-boards', data),

  update: (
    id: string,
    data: Partial<{
      cropType: string;
      grade: PriceBoardResponse['grade'];
      buyPrice: number;
      sellPrice: number;
      effectiveDate: string;
      isActive: boolean;
    }>,
  ) => apiPatch<PriceBoardResponse>(`/price-boards/${id}`, data),

  toggleActive: (id: string) =>
    apiPatch<PriceBoardResponse>(`/price-boards/${id}/toggle-active`, {}),

  delete: (id: string) =>
    apiDelete<{ id: string; deletedAt: string }>(`/price-boards/${id}`),
};
