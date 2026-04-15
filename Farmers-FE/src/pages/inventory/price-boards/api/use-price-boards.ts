import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractData } from '@/client/lib/api-client';
import { priceBoardApi } from './price-board-api';
import type { PriceBoardResponse } from './types';

export function usePriceBoards(filters: {
  page?: number;
  limit?: number;
  cropType?: string;
  grade?: string;
  isActive?: string;
}) {
  return useQuery({
    queryKey: ['priceBoards', filters],
    queryFn: async () => {
      const response = await priceBoardApi.list(filters);
      return extractData<{
        data: PriceBoardResponse[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(response);
    },
    placeholderData: (prev) => prev,
  });
}

export function usePriceBoard(id: string) {
  return useQuery({
    queryKey: ['priceBoard', id],
    queryFn: async () => {
      const response = await priceBoardApi.getById(id);
      return extractData<PriceBoardResponse>(response);
    },
    enabled: !!id,
  });
}

export function useCreatePriceBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Parameters<typeof priceBoardApi.create>[0]) => {
      const response = await priceBoardApi.create(data);
      return extractData<PriceBoardResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceBoards'] });
      toast.success('Đã tạo bảng giá mới');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không tạo được bảng giá');
    },
  });
}

export function useUpdatePriceBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof priceBoardApi.update>[1];
    }) => {
      const response = await priceBoardApi.update(id, data);
      return extractData<PriceBoardResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceBoards'] });
      toast.success('Đã cập nhật bảng giá');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không cập nhật được bảng giá');
    },
  });
}

export function useTogglePriceBoardActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await priceBoardApi.toggleActive(id);
      return extractData<PriceBoardResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceBoards'] });
      toast.success('Đã cập nhật trạng thái bảng giá');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không cập nhật được trạng thái');
    },
  });
}

export function useDeletePriceBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await priceBoardApi.delete(id);
      return extractData<{ id: string; deletedAt: string }>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceBoards'] });
      toast.success('Đã xóa bảng giá');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không xóa được bảng giá');
    },
  });
}
