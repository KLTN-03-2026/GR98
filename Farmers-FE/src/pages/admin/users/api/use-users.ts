import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractData } from '@/client/lib/api-client';
import { userApi } from './user-api';
import type { UserResponse, PaginatedUsersResponse } from './types';

// ─── Queries ────────────────────────────────────────────────────────────────

export function useUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'ADMIN' | 'SUPERVISOR' | 'INVENTORY' | 'CLIENT';
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const response = await userApi.list(params);
      return extractData<PaginatedUsersResponse>(response);
    },
    placeholderData: (prev) => prev,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const response = await userApi.getById(id);
      return extractData<UserResponse>(response);
    },
    enabled: !!id,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Parameters<typeof userApi.create>[0]) => {
      const response = await userApi.create(data);
      return extractData<UserResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Đã tạo người dùng mới');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không tạo được người dùng');
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof userApi.update>[1];
    }) => {
      const response = await userApi.update(id, data);
      return extractData<UserResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Đã cập nhật người dùng');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không cập nhật được người dùng');
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await userApi.delete(id);
      return extractData<{ id: string; deletedAt: string }>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Đã xóa người dùng');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không xóa được người dùng');
    },
  });
}
