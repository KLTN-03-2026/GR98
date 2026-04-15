import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractData } from '@/client/lib/api-client';
import type { Review } from '@/client/types';
import { reviewApi } from './review-api';

export function useProductReviews(
  productId: string,
  params?: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: ['reviews', productId, params],
    queryFn: async () => {
      const response = await reviewApi.listByProduct(productId, params);
      return extractData<{
        items: Review[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(response);
    },
    enabled: !!productId,
  });
}

export function useCreateReview(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { rating: number; comment?: string; imageUrls?: string[] }) => {
      const response = await reviewApi.create(productId, data);
      return extractData<Review>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      toast.success('Cảm ơn bạn đã đánh giá!');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Gửi đánh giá thất bại');
    },
  });
}
