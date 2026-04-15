import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractData } from '@/client/lib/api-client';
import { farmerApi } from './farmer-api';
import type { FarmerResponse, PaginatedFarmersResponse } from './types';

export function useFarmers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  supervisorId?: string;
  province?: string;
}) {
  return useQuery({
    queryKey: ['farmers', params],
    queryFn: async () => {
      const response = await farmerApi.list(params);
      return extractData<PaginatedFarmersResponse>(response);
    },
    placeholderData: (prev) => prev,
  });
}

export function useFarmer(id: string) {
  return useQuery({
    queryKey: ['farmer', id],
    queryFn: async () => {
      const response = await farmerApi.getById(id);
      return extractData<FarmerResponse>(response);
    },
    enabled: !!id,
  });
}

export function useCreateFarmer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Parameters<typeof farmerApi.create>[0]) => {
      const response = await farmerApi.create(data);
      return extractData<FarmerResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
      toast.success('Đã tạo nông dân mới');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không tạo được nông dân');
    },
  });
}

export function useUpdateFarmer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof farmerApi.update>[1];
    }) => {
      const response = await farmerApi.update(id, data);
      return extractData<FarmerResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
      toast.success('Đã cập nhật nông dân');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không cập nhật được nông dân');
    },
  });
}

export function useDeleteFarmer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await farmerApi.delete(id);
      return extractData<{ id: string; deletedAt: string }>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
      toast.success('Đã xóa nông dân');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không xóa được nông dân');
    },
  });
}
