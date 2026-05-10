import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractData } from '@/client/lib/api-client';
import type { Order } from '@/client/types';
import { orderApi } from './order-api';
import type { CreateOrderPayload, UpdateOrderPayload } from './types';

export function useOrders(params?: {
  page?: number;
  limit?: number;
  search?: string;
  paymentStatus?: string;
  fulfillStatus?: string;
  paymentMethod?: string;
  myOrders?: string;
  fromDate?: string;
  toDate?: string;
}) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const response = await orderApi.list(params);
      return extractData<{
        data: Order[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(response);
    },
    placeholderData: (prev) => prev,
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await orderApi.getById(orderId);
      return extractData<Order>(response);
    },
    enabled: !!orderId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOrderPayload) => {
      const response = await orderApi.create(data);
      return extractData<Order>(response);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`Đặt hàng thành công! Mã đơn: ${data.orderNo}`);
      return data;
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Đặt hàng thất bại');
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      data,
    }: {
      orderId: string;
      data: UpdateOrderPayload;
    }) => {
      const response = await orderApi.update(orderId, data);
      return extractData<Order>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Cập nhật đơn hàng thành công');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Cập nhật thất bại');
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      reason,
    }: {
      orderId: string;
      reason?: string;
    }) => {
      const response = await orderApi.cancel(orderId, reason ? { reason } : undefined);
      return extractData<Order>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Đơn hàng đã được hủy');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Hủy đơn thất bại');
    },
  });
}

// ─── State machine mutations ──────────────────────────────────────────

export function useConfirmPacking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, note }: { orderId: string; note?: string }) => {
      const res = await orderApi.confirmPacking(orderId, note);
      return extractData<Order>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order'] });
      toast.success('Xác nhận đơn, chuyển PACKING');
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Không thể xác nhận đơn');
    },
  });
}

export function useAssignShipper() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      shipperId,
    }: {
      orderId: string;
      shipperId: string;
    }) => {
      const res = await orderApi.assignShipper(orderId, shipperId);
      return extractData<Order>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order'] });
      toast.success('Đã gán shipper, chuyển SHIPPED');
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Không thể gán shipper');
    },
  });
}

export function useMarkDelivered() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      deliveryProofUrl,
      note,
    }: {
      orderId: string;
      deliveryProofUrl?: string;
      note?: string;
    }) => {
      const res = await orderApi.markDelivered(orderId, { deliveryProofUrl, note });
      return extractData<Order>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Đã giao hàng thành công!');
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Không thể cập nhật');
    },
  });
}

export function useAdminCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason?: string }) => {
      const res = await orderApi.adminCancel(orderId, reason);
      return extractData<Order>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order'] });
      toast.success('Đã huỷ đơn');
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Không thể huỷ đơn');
    },
  });
}
