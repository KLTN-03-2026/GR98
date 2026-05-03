import { apiGet, apiPost, apiPatch, apiDelete } from '@/client/lib/api-client';
import type { Product, PaginatedResponse, ProductStatus, QualityGrade } from '@/client/types';

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProductStatus;
  cropType?: string;
  grade?: QualityGrade;
  categoryId?: string;
}

export interface CreateProductPayload {
  name: string;
  slug?: string;
  sku?: string;
  description?: string;
  cropType: string;
  grade: QualityGrade;
  pricePerKg: number;
  stockKg?: number;
  minOrderKg?: number;
  unit?: string;
  imageUrls?: string[];
  thumbnailUrl?: string;
  status?: ProductStatus;
  categoryIds?: string[];
}

export const inventoryProductApi = {
  list: (params?: ProductQueryParams) =>
    apiGet<PaginatedResponse<Product>>('/products', { params }),

  listInternal: (params?: ProductQueryParams) =>
    apiGet<PaginatedResponse<Product>>('/products/internal', { params }),

  getById: (id: string) =>
    apiGet<Product>(`/products/${id}`),

  create: (data: CreateProductPayload) =>
    apiPost<Product>('/products', data),

  update: (id: string, data: Partial<CreateProductPayload>) =>
    apiPatch<Product>(`/products/${id}`, data),

  delete: (id: string) =>
    apiDelete<{ success: boolean }>(`/products/${id}`),

  createFromLot: (data: any) =>
    apiPost<Product>('/products/from-lot', data),
};
