import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractData } from '@/client/lib/api-client';
import { inventoryStaffApi } from './inventory-staff-api';
import type { InventoryStaffResponse, PaginatedInventoryStaffResponse } from './types';

// ─── Queries ────────────────────────────────────────────────────────────────

export function useInventoryStaff(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}) {
  return useQuery({
    queryKey: ['inventoryStaff', params],
    queryFn: async () => {
      const response = await inventoryStaffApi.list(params);
      return extractData<PaginatedInventoryStaffResponse>(response);
    },
    placeholderData: (prev) => prev,
  });
}

export function useInventoryStaffById(id: string) {
  return useQuery({
    queryKey: ['inventoryStaff', id],
    queryFn: async () => {
      const response = await inventoryStaffApi.getById(id);
      return extractData<InventoryStaffResponse>(response);
    },
    enabled: !!id,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function useCreateInventoryStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Parameters<typeof inventoryStaffApi.create>[0]) => {
      const response = await inventoryStaffApi.create(data);
      return extractData<InventoryStaffResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryStaff'] });
      toast.success('Đã tạo nhân viên kho mới');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không tạo được nhân viên kho');
    },
  });
}

export function useUpdateInventoryStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof inventoryStaffApi.update>[1];
    }) => {
      const response = await inventoryStaffApi.update(id, data);
      return extractData<InventoryStaffResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryStaff'] });
      toast.success('Đã cập nhật nhân viên kho');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không cập nhật được nhân viên kho');
    },
  });
}

export function useDeleteInventoryStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await inventoryStaffApi.delete(id);
      return extractData<{ id: string; deletedAt: string }>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryStaff'] });
      toast.success('Đã xóa nhân viên kho');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không xóa được nhân viên kho');
    },
  });
}
