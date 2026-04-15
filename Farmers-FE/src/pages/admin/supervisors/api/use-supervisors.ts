import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractData } from '@/client/lib/api-client';
import { supervisorApi } from './supervisor-api';
import type { SupervisorResponse, PaginatedSupervisorsResponse } from './types';

// ─── Queries ────────────────────────────────────────────────────────────────

export function useSupervisors(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  zoneId?: string;
}) {
  return useQuery({
    queryKey: ['supervisors', params],
    queryFn: async () => {
      const response = await supervisorApi.list(params);
      return extractData<PaginatedSupervisorsResponse>(response);
    },
    placeholderData: (prev) => prev,
  });
}

export function useAllSupervisors(params?: {
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}) {
  return useQuery({
    queryKey: ['supervisors', 'all', params],
    queryFn: async () => {
      const allSupervisors: SupervisorResponse[] = [];
      let page = 1;
      let totalPages = 1;

      do {
        const response = await supervisorApi.list({
          page,
          limit: 20, // Backend enforces Max(20)
          status: params?.status,
        });
        const payload = extractData<PaginatedSupervisorsResponse>(response);
        allSupervisors.push(...payload.data);
        totalPages = Math.max(1, payload.totalPages || 1);
        page += 1;
      } while (page <= totalPages);

      return allSupervisors;
    },
  });
}

export function useSupervisor(id: string) {
  return useQuery({
    queryKey: ['supervisor', id],
    queryFn: async () => {
      const response = await supervisorApi.getById(id);
      return extractData<SupervisorResponse>(response);
    },
    enabled: !!id,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function useCreateSupervisor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Parameters<typeof supervisorApi.create>[0]) => {
      const response = await supervisorApi.create(data);
      return extractData<SupervisorResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisors'] });
      toast.success('Đã tạo giám sát viên mới');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không tạo được giám sát viên');
    },
  });
}

export function useUpdateSupervisor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof supervisorApi.update>[1];
    }) => {
      const response = await supervisorApi.update(id, data);
      return extractData<SupervisorResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisors'] });
      toast.success('Đã cập nhật giám sát viên');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không cập nhật được giám sát viên');
    },
  });
}

export function useDeleteSupervisor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await supervisorApi.delete(id);
      return extractData<{ id: string; deletedAt: string }>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisors'] });
      toast.success('Đã xóa giám sát viên');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không xóa được giám sát viên');
    },
  });
}
