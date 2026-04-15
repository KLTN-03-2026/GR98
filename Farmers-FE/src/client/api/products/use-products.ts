import { useQuery } from '@tanstack/react-query';
import { extractData } from '@/client/lib/api-client';
import type { Product } from '@/client/types';
import { productApi } from './product-api';

export function useProducts(filters: {
  page?: number;
  limit?: number;
  search?: string;
  cropType?: string;
  grade?: string;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: string;
  sortBy?: string;
}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const response = await productApi.list(filters);
      const result = extractData<{
        items: Product[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(response);
      return result;
    },
    placeholderData: (prev) => prev,
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const response = await productApi.getBySlug(slug);
      return extractData<Product>(response);
    },
    enabled: !!slug,
  });
}

export function useFeaturedProducts(limit = 8) {
  return useQuery({
    queryKey: ['products', 'featured', limit],
    queryFn: async () => {
      const response = await productApi.getFeatured(limit);
      return extractData<Product[]>(response);
    },
  });
}

export function useRelatedProducts(productId: string, limit = 4) {
  return useQuery({
    queryKey: ['product', productId, 'related'],
    queryFn: async () => {
      const response = await productApi.getRelated(productId, limit);
      return extractData<Product[]>(response);
    },
    enabled: !!productId,
  });
}

export function useProductsByCategory(
  categorySlug: string,
  params?: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: ['products', 'category', categorySlug, params],
    queryFn: async () => {
      const response = await productApi.getByCategory(categorySlug, params);
      return extractData<{
        items: Product[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(response);
    },
    enabled: !!categorySlug,
  });
}
