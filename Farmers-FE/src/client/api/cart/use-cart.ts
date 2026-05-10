import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractData } from '@/client/lib/api-client';
import { cartApi } from './cart-api';

export interface CartResponse {
  id: string;
  items: Array<{
    id: string;
    cartId: string;
    productId: string;
    quantityKg: number;
    addedAt: string;
    product: {
      id: string;
      name: string;
      slug: string;
      pricePerKg: number;
      stockKg: number;
      reservedKg: number;
      minOrderKg: number;
      imageUrls: string[];
      thumbnailUrl?: string | null;
      status: string;
      cropType: string;
      grade: string;
    };
  }>;
  subtotal: number;
  itemCount: number;
  updatedAt?: string;
}

export function useCart(enabled = true) {
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await cartApi.get();
      return extractData<CartResponse>(res);
    },
    enabled,
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { productId: string; quantityKg: number }) => {
      const res = await cartApi.addItem(data);
      return extractData<CartResponse>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Đã thêm vào giỏ hàng');
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Không thể thêm vào giỏ');
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemId,
      quantityKg,
    }: {
      itemId: string;
      quantityKg: number;
    }) => {
      const res = await cartApi.updateItem(itemId, { quantityKg });
      return extractData<CartResponse>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Không thể cập nhật');
    },
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await cartApi.removeItem(itemId);
      return extractData<CartResponse>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Đã xóa khỏi giỏ');
    },
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await cartApi.clear();
      return extractData<CartResponse>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}
