import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractData } from '@/client/lib/api-client';
import { adminWarehousesApi } from './warehouses-api';
import type {
  AdminWarehouseDetail,
  AdminWarehouseRow,
  CreateWarehousePayload,
  UpdateWarehousePayload,
} from './types';

export const adminWarehouseKeys = {
  all: ['admin-warehouses'] as const,
  list: () => [...adminWarehouseKeys.all, 'list'] as const,
  detail: (id: string) => [...adminWarehouseKeys.all, 'detail', id] as const,
};

export function useAdminWarehousesList() {
  return useQuery({
    queryKey: adminWarehouseKeys.list(),
    queryFn: async () => {
      const res = await adminWarehousesApi.list();
      return extractData<AdminWarehouseRow[]>(res);
    },
  });
}

export function useAdminWarehouseDetail(id: string) {
  return useQuery({
    queryKey: adminWarehouseKeys.detail(id),
    queryFn: async () => {
      const res = await adminWarehousesApi.getById(id);
      return extractData<AdminWarehouseDetail>(res);
    },
    enabled: !!id,
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateWarehousePayload) => {
      const res = await adminWarehousesApi.create(data);
      return extractData<AdminWarehouseRow>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminWarehouseKeys.list() });
      toast.success('Đã tạo kho hàng');
    },
    onError: (e: { message?: string }) => {
      toast.error(e.message || 'Không tạo được kho');
    },
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateWarehousePayload;
    }) => {
      const res = await adminWarehousesApi.update(id, data);
      return extractData<AdminWarehouseRow>(res);
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: adminWarehouseKeys.list() });
      qc.invalidateQueries({ queryKey: adminWarehouseKeys.detail(id) });
      toast.success('Đã cập nhật kho hàng');
    },
    onError: (e: { message?: string }) => {
      toast.error(e.message || 'Không cập nhật được kho');
    },
  });
}
