import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  AuthUser,
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
  type AuthUserResponse,
  type CreateShippingAddressPayload,
  type MeResponse,
  orderApi,
  priceBoardApi,
  type PriceBoardResponse,
  productApi,
  profileApi,
  reviewApi,
  type ShippingAddressApi,
  warehouseApi,
  type InventoryStatsResponse,
  type WarehouseResponse,
  type PaginatedWarehousesResponse,
  inventoryLotApi,
  type InventoryLotResponse,
  type PaginatedInventoryLotsResponse,
  warehouseTransactionApi,
  type WarehouseTransactionResponse,
  type PaginatedTransactionsResponse,
  type TodayTransactionStatsResponse,
} from '@/client/lib/api-client';
import { useAuthStore } from '@/client/store';
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from '@/lib/cookie-utils';

// ============================================================
// AUTH HOOKS
// ============================================================

/** GET /auth/me — đồng bộ navbar + trang profile */
export function useMe() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await authApi.getMe();
      return extractData<MeResponse>(res);
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

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

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      await authApi.changePassword(data);
    },
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không đổi được mật khẩu');
    },
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { fullName?: string; phone?: string }) => {
      await authApi.updateMe(data);
    },
    onSuccess: () => {
      toast.success('Cập nhật hồ sơ thành công!');
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không cập nhật được hồ sơ');
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();
  return useMutation({
    mutationFn: async () => {
      await authApi.deleteAccount();
    },
    onSuccess: () => {
      toast.success('Tài khoản đã được xóa.');
      queryClient.clear();
      logout();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không xóa được tài khoản');
    },
  });
}

export function useLogin() {
  const { login } = useAuthStore();
  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const loginResponse = await authApi.login(data);
      const { accessToken, refreshToken, user } = extractData<{
        accessToken: string;
        refreshToken: string;
        user: AuthUserResponse;
      }>(loginResponse);

      setAccessTokenCookie(accessToken);
      if (refreshToken) {
        setRefreshTokenCookie(refreshToken);
      }

      let me: MeResponse;
      try {
        const meResponse = await authApi.getMe();
        me = extractData<MeResponse>(meResponse);
      } catch {
        me = {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          avatar: null,
          role: user.role,
          createdAt: new Date().toISOString(),
          adminProfile: null,
          supervisorProfile: null,
          clientProfile: null,
        };
      }

      return { accessToken, refreshToken, me, loginUser: user };
    },
    onSuccess: ({ accessToken, me, loginUser }) => {
      const authUser: AuthUser = {
        id: me.id,
        email: me.email,
        fullName: me.fullName,
        phone: me.phone ?? undefined,
        role: me.role,
        status: 'ACTIVE',
        accessToken,
        avatarUrl: me.avatar ?? undefined,
        adminId: loginUser.adminId ?? undefined,
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Call logout API if needed
    },
    onSettled: () => {
      queryClient.removeQueries({ queryKey: ['me'] });
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
export function useCategories(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['categories', params],
    queryFn: async () => {
      const response = await categoryApi.list(params);
      return extractData<import('@/client/lib/api-client').PaginatedCategoriesResponse>(response);
    },
  });
}

export function useCategoryById(id: string) {
  return useQuery({
    queryKey: ['category', id],
    queryFn: async () => {
      const response = await categoryApi.getById(id);
      return extractData<import('@/client/lib/api-client').CategoryResponse>(response);
    },
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: import('@/client/lib/api-client').CreateCategoryPayload) => {
      const response = await categoryApi.create(data);
      return extractData<import('@/client/lib/api-client').CategoryResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Đã tạo danh mục mới');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không tạo được danh mục');
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<import('@/client/lib/api-client').CreateCategoryPayload>;
    }) => {
      const response = await categoryApi.update(id, data);
      return extractData<import('@/client/lib/api-client').CategoryResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Đã cập nhật danh mục');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không cập nhật được danh mục');
    },
  });
}

export function useReorderCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orders: Array<{ id: string; sortOrder: number }>) => {
      await categoryApi.reorder(orders);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Đã cập nhật thứ tự');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không cập nhật được thứ tự');
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await categoryApi.delete(id);
      return extractData<{ id: string; deletedAt: string }>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Đã xóa danh mục');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không xóa được danh mục');
    },
  });
}

// ============================================================
// ORDER HOOKS
// ============================================================
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
    mutationFn: async (data: import('@/client/lib/api-client').CreateOrderPayload) => {
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
      data: import('@/client/lib/api-client').UpdateOrderPayload;
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

// ============================================================
// PRICE BOARD HOOKS
// ============================================================
export function usePriceBoards(filters: {
  page?: number;
  limit?: number;
  cropType?: string;
  grade?: string;
  isActive?: string;
}) {
  return useQuery({
    queryKey: ['priceBoards', filters],
    queryFn: async () => {
      const response = await priceBoardApi.list(filters);
      return extractData<{
        data: PriceBoardResponse[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(response);
    },
    placeholderData: (prev) => prev,
  });
}

export function usePriceBoard(id: string) {
  return useQuery({
    queryKey: ['priceBoard', id],
    queryFn: async () => {
      const response = await priceBoardApi.getById(id);
      return extractData<PriceBoardResponse>(response);
    },
    enabled: !!id,
  });
}

export function useCreatePriceBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Parameters<typeof priceBoardApi.create>[0]) => {
      const response = await priceBoardApi.create(data);
      return extractData<PriceBoardResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceBoards'] });
      toast.success('Đã tạo bảng giá mới');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không tạo được bảng giá');
    },
  });
}

export function useUpdatePriceBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof priceBoardApi.update>[1];
    }) => {
      const response = await priceBoardApi.update(id, data);
      return extractData<PriceBoardResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceBoards'] });
      toast.success('Đã cập nhật bảng giá');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không cập nhật được bảng giá');
    },
  });
}

export function useTogglePriceBoardActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await priceBoardApi.toggleActive(id);
      return extractData<PriceBoardResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceBoards'] });
      toast.success('Đã cập nhật trạng thái bảng giá');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không cập nhật được trạng thái');
    },
  });
}

export function useDeletePriceBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await priceBoardApi.delete(id);
      return extractData<{ id: string; deletedAt: string }>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceBoards'] });
      toast.success('Đã xóa bảng giá');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không xóa được bảng giá');
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

// ============================================================
// INVENTORY HOOKS
// ============================================================
export function useInventoryStats() {
  return useQuery({
    queryKey: ['inventory', 'stats'],
    queryFn: async () => {
      const response = await warehouseApi.getStats();
      return extractData<InventoryStatsResponse>(response);
    },
  });
}

export function useWarehouses(filters?: {
  page?: number;
  limit?: number;
  isActive?: string;
  managedBy?: string;
}) {
  return useQuery({
    queryKey: ['warehouses', filters],
    queryFn: async () => {
      const response = await warehouseApi.list(filters);
      return extractData<PaginatedWarehousesResponse>(response);
    },
    placeholderData: (prev) => prev,
  });
}

export function useWarehouse(id: string) {
  return useQuery({
    queryKey: ['warehouse', id],
    queryFn: async () => {
      const response = await warehouseApi.getById(id);
      return extractData<WarehouseResponse>(response);
    },
    enabled: !!id,
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Parameters<typeof warehouseApi.create>[0]) => {
      const response = await warehouseApi.create(data);
      return extractData<WarehouseResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Đã tạo kho hàng mới');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không tạo được kho hàng');
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof warehouseApi.update>[1];
    }) => {
      const response = await warehouseApi.update(id, data);
      return extractData<WarehouseResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Đã cập nhật kho hàng');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không cập nhật được kho hàng');
    },
  });
}

export function useInventoryLots(filters?: {
  page?: number;
  limit?: number;
  warehouseId?: string;
  productId?: string;
  qualityGrade?: string;
  alert?: 'low-stock' | 'expiring';
}) {
  return useQuery({
    queryKey: ['inventoryLots', filters],
    queryFn: async () => {
      const response = await inventoryLotApi.list(filters);
      return extractData<PaginatedInventoryLotsResponse>(response);
    },
    placeholderData: (prev) => prev,
  });
}

export function useInventoryLot(id: string) {
  return useQuery({
    queryKey: ['inventoryLot', id],
    queryFn: async () => {
      const response = await inventoryLotApi.getById(id);
      return extractData<InventoryLotResponse>(response);
    },
    enabled: !!id,
  });
}

export function useCreateInventoryLot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Parameters<typeof inventoryLotApi.create>[0]) => {
      const response = await inventoryLotApi.create(data);
      return extractData<InventoryLotResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryLots'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'stats'] });
      toast.success('Đã nhập kho thành công');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Nhập kho thất bại');
    },
  });
}

export function useLowStockAlerts() {
  return useQuery({
    queryKey: ['inventoryLots', 'low-stock'],
    queryFn: async () => {
      const response = await inventoryLotApi.list({ alert: 'low-stock', limit: 10 });
      return extractData<PaginatedInventoryLotsResponse>(response);
    },
  });
}

export function useExpiringAlerts() {
  return useQuery({
    queryKey: ['inventoryLots', 'expiring'],
    queryFn: async () => {
      const response = await inventoryLotApi.list({ alert: 'expiring', limit: 10 });
      return extractData<PaginatedInventoryLotsResponse>(response);
    },
  });
}

export function useWarehouseTransactions(filters?: {
  page?: number;
  limit?: number;
  warehouseId?: string;
  productId?: string;
  type?: 'inbound' | 'outbound' | 'adjustment';
  date?: 'today' | 'week' | 'month';
}) {
  return useQuery({
    queryKey: ['warehouseTransactions', filters],
    queryFn: async () => {
      const response = await warehouseTransactionApi.list(filters);
      return extractData<PaginatedTransactionsResponse>(response);
    },
    placeholderData: (prev) => prev,
  });
}

export function useRecentTransactions() {
  return useQuery({
    queryKey: ['warehouseTransactions', 'recent'],
    queryFn: async () => {
      const response = await warehouseTransactionApi.getRecent();
      return extractData<WarehouseTransactionResponse[]>(response);
    },
  });
}

export function useTodayTransactionStats() {
  return useQuery({
    queryKey: ['warehouseTransactions', 'today-stats'],
    queryFn: async () => {
      const response = await warehouseTransactionApi.getTodayStats();
      return extractData<TodayTransactionStatsResponse>(response);
    },
  });
}

export function useCreateWarehouseTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Parameters<typeof warehouseTransactionApi.create>[0]) => {
      const response = await warehouseTransactionApi.create(data);
      return extractData<WarehouseTransactionResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouseTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryLots'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'stats'] });
      toast.success('Đã ghi nhận giao dịch');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Giao dịch thất bại');
    },
  });
}
