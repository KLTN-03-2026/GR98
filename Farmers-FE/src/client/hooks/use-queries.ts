import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  CreateOrderRequest,
  LoginRequest,
  Order,
  Product,
  Review,
} from '@/client/types';
import {
  authApi,
  categoryApi,
  extractData,
  orderApi,
  productApi,
  reviewApi,
} from '@/client/lib/api-client';
import { useAuthStore } from '@/client/store';

// ============================================================
// AUTH HOOKS
// ============================================================
export function useLogin() {
  const { login } = useAuthStore();
  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      // 1. Login to get token
      const loginResponse = await authApi.login(data);
      const { accessToken } = extractData<{ accessToken: string }>(loginResponse);

      // 2. Get user info
      const meResponse = await authApi.getMe();
      const meData = extractData<{
        role: string;
        profileId: string;
        adminId?: string;
        fullName: string | null;
        email: string | null;
        phone: string | null;
      }>(meResponse);

      return { accessToken, meData, email: data.email || '' };
    },
    onSuccess: ({ accessToken, meData, email }) => {
      // 3. Build AuthUser and save to store
      const authUser: AuthUser = {
        id: meData.profileId,
        email: meData.email || email,
        fullName: meData.fullName || email.split('@')[0],
        phone: meData.phone || undefined,
        role: meData.role as AuthUser['role'],
        status: 'ACTIVE',
        accessToken,
      };
      login(authUser, accessToken);
      toast.success('Đăng nhập thành công!');
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || 'Đăng nhập thất bại');
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  return useMutation({
    mutationFn: async () => {
      // Call logout API if needed
    },
    onSettled: () => {
      logout();
      localStorage.removeItem('ec_cart');
      toast.success('Đã đăng xuất');
    },
  });
}

// ============================================================
// PRODUCT HOOKS
// ============================================================
export function useProducts(filters: {
  page?: number;
  limit?: number;
  search?: string;
  cropType?: string;
  grade?: string;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: string;
  sortBy?: string;
}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const response = await productApi.list(filters);
      const result = extractData<{
        items: Product[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(response);
      return result;
    },
    placeholderData: (prev) => prev,
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const response = await productApi.getBySlug(slug);
      return extractData<Product>(response);
    },
    enabled: !!slug,
  });
}

export function useFeaturedProducts(limit = 8) {
  return useQuery({
    queryKey: ['products', 'featured', limit],
    queryFn: async () => {
      const response = await productApi.getFeatured(limit);
      return extractData<Product[]>(response);
    },
  });
}

export function useRelatedProducts(productId: string, limit = 4) {
  return useQuery({
    queryKey: ['product', productId, 'related'],
    queryFn: async () => {
      const response = await productApi.getRelated(productId, limit);
      return extractData<Product[]>(response);
    },
    enabled: !!productId,
  });
}

export function useProductsByCategory(
  categorySlug: string,
  params?: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: ['products', 'category', categorySlug, params],
    queryFn: async () => {
      const response = await productApi.getByCategory(categorySlug, params);
      return extractData<{
        items: Product[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(response);
    },
    enabled: !!categorySlug,
  });
}

// ============================================================
// CATEGORY HOOKS
// ============================================================
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoryApi.list();
      return extractData<import('@/client/types').Category[]>(response);
    },
  });
}

// ============================================================
// ORDER HOOKS
// ============================================================
export function useOrders(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const response = await orderApi.list(params);
      return extractData<{
        items: Order[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(response);
    },
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
    mutationFn: async (data: CreateOrderRequest) => {
      const response = await orderApi.create(data);
      return extractData<Order>(response);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`Đặt hàng thành công! Mã đơn: ${data.orderNo}`);
      return data;
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || 'Đặt hàng thất bại');
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await orderApi.cancel(orderId);
      return extractData<Order>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Đơn hàng đã được hủy');
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || 'Hủy đơn thất bại');
    },
  });
}

// ============================================================
// REVIEW HOOKS
// ============================================================
export function useProductReviews(
  productId: string,
  params?: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: ['reviews', productId, params],
    queryFn: async () => {
      const response = await reviewApi.listByProduct(productId, params);
      return extractData<{
        items: Review[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(response);
    },
    enabled: !!productId,
  });
}

export function useCreateReview(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { rating: number; comment?: string; imageUrls?: string[] }) => {
      const response = await reviewApi.create(productId, data);
      return extractData<Review>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      toast.success('Cảm ơn bạn đã đánh giá!');
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || 'Gửi đánh giá thất bại');
    },
  });
}
