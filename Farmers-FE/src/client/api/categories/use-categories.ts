import { useQuery } from '@tanstack/react-query';
import { extractData } from '@/client/lib/api-client';
import { categoryApi } from './category-api';
import type { CategoryResponse, PaginatedCategoriesResponse } from './types';

/** Hook dùng cho CLIENT side (products page filter) */
export function useCategories(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['categories', params],
    queryFn: async () => {
      const response = await categoryApi.list(params);
      return extractData<PaginatedCategoriesResponse>(response);
    },
  });
}

export function useCategoryById(id: string) {
  return useQuery({
    queryKey: ['category', id],
    queryFn: async () => {
      const response = await categoryApi.getById(id);
      return extractData<CategoryResponse>(response);
    },
    enabled: !!id,
  });
}
