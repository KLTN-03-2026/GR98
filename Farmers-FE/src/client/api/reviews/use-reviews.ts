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

// ─── Internal Management ───────────────────────────────────────────────────

export function useInternalReviews(params?: { page?: number; limit?: number; status?: string; search?: string }) {
  return useQuery({
    queryKey: ['reviews', 'internal', params],
    queryFn: async () => {
      const response = await reviewApi.listInternal(params as any);
      return extractData<{
        items: Review[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(response);
    },
  });
}

export function useUpdateReviewStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await reviewApi.updateStatus(id, status as any);
      return extractData<Review>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'internal'] });
      toast.success('Cập nhật trạng thái đánh giá thành công');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Cập nhật trạng thái đánh giá thất bại');
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await reviewApi.delete(id);
      return extractData<any>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'internal'] });
      toast.success('Xóa đánh giá thành công');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Xóa đánh giá thất bại');
    },
  });
}
