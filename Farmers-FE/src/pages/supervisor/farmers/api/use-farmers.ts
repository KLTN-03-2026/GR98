import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractData } from '@/client/lib/api-client';
import { supervisorFarmerApi } from './farmer-api';
import type { FarmerResponse, PaginatedFarmersResponse } from './types';

export function useSupervisorFarmers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  province?: string;
  enabled?: boolean;
}) {
  const { enabled = true, ...queryParams } = params ?? {};
  return useQuery({
    queryKey: ['supervisor-farmers', queryParams],
    queryFn: async () => {
      const response = await supervisorFarmerApi.list(queryParams);
      return extractData<PaginatedFarmersResponse>(response);
    },
    enabled,
    placeholderData: (prev) => prev,
  });
}

export function useCreateSupervisorFarmer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Parameters<typeof supervisorFarmerApi.create>[0]) => {
      const response = await supervisorFarmerApi.create(data);
      return extractData<FarmerResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisor-farmers'] });
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
      toast.success('Đã tạo nông dân mới');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không tạo được nông dân');
    },
  });
}

export function useUpdateSupervisorFarmer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof supervisorFarmerApi.update>[1];
    }) => {
      const response = await supervisorFarmerApi.update(id, data);
      return extractData<FarmerResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisor-farmers'] });
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
      toast.success('Đã cập nhật nông dân');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không cập nhật được nông dân');
    },
  });
}

export function useDeleteSupervisorFarmer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await supervisorFarmerApi.delete(id);
      return extractData<{ id: string; deletedAt: string }>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisor-farmers'] });
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
      toast.success('Đã xóa nông dân');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không xóa được nông dân');
    },
  });
}
