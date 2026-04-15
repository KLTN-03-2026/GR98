import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractData } from '@/client/lib/api-client';
import { profileApi } from './profile-api';
import type { ShippingAddressApi, CreateShippingAddressPayload } from './types';

export function useCreateShippingAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateShippingAddressPayload) => {
      const res = await profileApi.createAddress(data);
      return extractData<ShippingAddressApi>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Đã thêm địa chỉ giao hàng');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không thêm được địa chỉ');
    },
  });
}

export function useDeleteShippingAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await profileApi.deleteAddress(id);
      return extractData<{ id: string; deletedAt: string }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Đã xóa địa chỉ');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không xóa được địa chỉ');
    },
  });
}

export function useSetDefaultShippingAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await profileApi.setDefaultAddress(id);
      return extractData<{ id: string; isDefault: boolean }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Đã đặt địa chỉ mặc định');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không đặt được mặc định');
    },
  });
}
