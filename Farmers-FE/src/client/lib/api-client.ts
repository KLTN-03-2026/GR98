import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  type AxiosError,
} from 'axios';
import type { ApiError } from '@/client/types';
import {
  getAccessTokenFromCookie,
  getRefreshTokenFromCookie,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAllAuthCookies,
} from '@/lib/cookie-utils';

// ============================================================
// BASE URL - Update this to match your BE server
// ============================================================
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9933/api';

// ============================================================
// STORAGE KEYS — kept for localStorage fallback / non-sensitive data
// ============================================================
export const STORAGE_KEYS = {
  USER: 'ec_user',
} as const;

// ============================================================
// AXIOS INSTANCE
// ============================================================
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// REQUEST INTERCEPTOR - Attach auth token từ Cookie
// ============================================================
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Ưu tiên đọc từ Cookie (bảo mật hơn)
    const token = getAccessTokenFromCookie();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// ============================================================
// RESPONSE INTERCEPTOR - Handle errors & refresh token
// ============================================================
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<{ message?: string; code?: string; errors?: Record<string, string[]> }>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Thử refresh token từ Cookie
      const refreshToken = getRefreshTokenFromCookie();
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data as {
            accessToken: string;
            refreshToken?: string;
          };

          // Lưu token mới vào Cookie (bảo mật)
          setAccessTokenCookie(accessToken);
          if (newRefreshToken) {
            setRefreshTokenCookie(newRefreshToken);
          }

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return apiClient(originalRequest);
        } catch {
          // Refresh thất bại → xóa toàn bộ auth state
          clearAllAuthCookies();
          localStorage.removeItem(STORAGE_KEYS.USER);
          window.location.href = '/auth/login';
          return Promise.reject(error);
        }
      } else {
        // Không có refresh token → clear và redirect
        clearAllAuthCookies();
        localStorage.removeItem(STORAGE_KEYS.USER);
        window.location.href = '/auth/login';
      }
    }

    // NestJS default: { statusCode, message, error }
    // Custom filter: { success: false, error: { message, code } }
    const rawData = error.response?.data as Record<string, unknown> | undefined;
    const apiError: ApiError = {
      message:
        (rawData as { message?: string })?.message ||
        (rawData?.error as Record<string, unknown>)?.message as string ||
        error.message ||
        'Đã xảy ra lỗi không xác định',
      code: (rawData?.error as Record<string, unknown>)?.code as string,
      errors: error.response?.data?.errors,
    };

    return Promise.reject(apiError);
  },
);

// ============================================================
// GENERIC REQUEST METHODS
// ============================================================
export const apiGet = <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
  apiClient.get<T>(url, config);

export const apiPost = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<T>> => apiClient.post<T>(url, data, config);

export const apiPut = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<T>> => apiClient.put<T>(url, data, config);

export const apiPatch = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<T>> => apiClient.patch<T>(url, data, config);

export const apiDelete = <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
  apiClient.delete<T>(url, config);

// ============================================================
// AUTH API ENDPOINTS
// ============================================================

export const authApi = {
  // POST /auth/login → { accessToken, refreshToken, user }
  login: (data: { email?: string; phone?: string; password: string }) =>
    apiPost<{ accessToken: string; refreshToken: string; user: AuthUserResponse }>('/auth/login', data),

  // POST /auth/register → { accessToken, refreshToken, user }
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    defaultAddress?: string;
    province?: string;
  }) =>
    apiPost<{ accessToken: string; refreshToken: string; user: AuthUserResponse }>('/auth/register', data),

  // POST /auth/refresh → { accessToken, refreshToken }
  refresh: (refreshToken: string) =>
    apiPost<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }),

  // POST /auth/forgot-password → { message }
  forgotPassword: (email: string) =>
    apiPost<{ message: string }>('/auth/forgot-password', { email }),

  // POST /auth/reset-password → { message }
  resetPassword: (token: string, newPassword: string) =>
    apiPost<{ message: string }>('/auth/reset-password', { token, newPassword }),

  // GET /auth/me → MeResponse
  getMe: () =>
    apiGet<MeResponse>('/auth/me'),

  // PUT /auth/me → MeResponse
  updateMe: (data: { fullName?: string; phone?: string }) =>
    apiPut<MeResponse>('/auth/me', data),

  // POST /auth/logout → { success: boolean }
  logout: () =>
    apiPost<{ success: boolean }>('/auth/logout', {}),

  // POST /profile/change-password → { message }
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiPost<{ message: string }>('/profile/change-password', data),

  // DELETE /profile/me → { message }
  deleteAccount: () =>
    apiDelete<{ message: string }>('/profile/me'),
};

// ============================================================
// SHARED TYPES
// ============================================================

/** Payload `user` từ POST /auth/login và /auth/register */
export interface AuthUserResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: 'ADMIN' | 'SUPERVISOR' | 'CLIENT';
  profileId: string | null;
  adminId: string | null;
}

/** GET /auth/me — đầy đủ profile + địa chỉ (khớp AuthService.getMe) */
export interface MeResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatar: string | null;
  role: 'ADMIN' | 'SUPERVISOR' | 'CLIENT';
  createdAt: string;
  adminProfile: {
    id: string;
    businessName: string;
    province: string;
    taxCode: string | null;
    bankAccount: string | null;
  } | null;
  supervisorProfile: {
    id: string;
    employeeCode: string;
    adminId: string;
    zoneId: string | null;
  } | null;
  clientProfile: {
    id: string;
    province: string | null;
    createdAt: string;
    shippingAddresses: Array<{
      id: string;
      fullName: string;
      phone: string;
      addressLine: string;
      district: string | null;
      province: string;
      isDefault: boolean;
      createdAt: string;
      updatedAt: string;
    }>;
  } | null;
}

export type ShippingAddressApi = NonNullable<MeResponse['clientProfile']>['shippingAddresses'][number];

export type CreateShippingAddressPayload = {
  fullName: string;
  phone: string;
  addressLine: string;
  district?: string;
  province: string;
  isDefault?: boolean;
};

// ============================================================
// PROFILE API (địa chỉ giao hàng — /profile/*)
// ============================================================
export const profileApi = {
  createAddress: (data: CreateShippingAddressPayload) =>
    apiPost<ShippingAddressApi>('/profile/addresses', data),

  updateAddress: (id: string, data: Partial<CreateShippingAddressPayload>) =>
    apiPatch<ShippingAddressApi>(`/profile/addresses/${id}`, data),

  deleteAddress: (id: string) =>
    apiDelete<{ id: string; deletedAt: string }>(`/profile/addresses/${id}`),

  setDefaultAddress: (id: string) =>
    apiPatch<{ id: string; isDefault: boolean }>(`/profile/addresses/${id}/set-default`, {}),
};

// ============================================================
// PRODUCT API ENDPOINTS
// ============================================================
export const productApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    cropType?: string;
    grade?: string;
    minPrice?: number;
    maxPrice?: number;
    categoryId?: string;
    sortBy?: string;
  }) => apiGet<unknown>('/products', { params }),

  getBySlug: (slug: string) =>
    apiGet<unknown>(`/products/${slug}`),

  getFeatured: (limit = 8) =>
    apiGet<unknown>('/products/featured', { params: { limit } }),

  getByCategory: (categorySlug: string, params?: { page?: number; limit?: number }) =>
    apiGet<unknown>(`/products/category/${categorySlug}`, { params }),

  getRelated: (productId: string, limit = 4) =>
    apiGet<unknown>(`/products/${productId}/related`, { params: { limit } }),
};

// ============================================================
// CATEGORY API ENDPOINTS
// ============================================================
export const categoryApi = {
  list: () => apiGet<unknown>('/categories'),

  getBySlug: (slug: string) =>
    apiGet<unknown>(`/categories/${slug}`),
};

// ============================================================
// CART API ENDPOINTS
// ============================================================
export const cartApi = {
  get: () => apiGet<unknown>('/cart'),

  addItem: (data: { productId: string; quantityKg: number }) =>
    apiPost<unknown>('/cart/items', data),

  updateItem: (itemId: string, data: { quantityKg: number }) =>
    apiPatch<unknown>(`/cart/items/${itemId}`, data),

  removeItem: (itemId: string) =>
    apiDelete<unknown>(`/cart/items/${itemId}`),

  clear: () => apiDelete<unknown>('/cart'),
};

// ============================================================
// ORDER API ENDPOINTS
// ============================================================
export const orderApi = {
  list: (params?: { page?: number; limit?: number }) =>
    apiGet<unknown>('/orders', { params }),

  getById: (orderId: string) =>
    apiGet<unknown>(`/orders/${orderId}`),

  create: (data: unknown) =>
    apiPost<unknown>('/orders', data),

  cancel: (orderId: string) =>
    apiPatch<unknown>(`/orders/${orderId}/cancel`),
};

// ============================================================
// REVIEW API ENDPOINTS
// ============================================================
export const reviewApi = {
  listByProduct: (productId: string, params?: { page?: number; limit?: number }) =>
    apiGet<unknown>(`/products/${productId}/reviews`, { params }),

  create: (productId: string, data: { rating: number; comment?: string; imageUrls?: string[] }) =>
    apiPost<unknown>(`/products/${productId}/reviews`, data),
};

// ============================================================
// USER API ENDPOINTS
// ============================================================
export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatar: string | null;
  role: 'ADMIN' | 'SUPERVISOR' | 'CLIENT';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
  adminProfile?: { id: string; businessName: string; province: string } | null;
  supervisorProfile?: { id: string; employeeCode: string; adminId: string } | null;
  clientProfile?: { id: string; province: string | null; defaultAddress: string | null } | null;
}

export interface PaginatedUsersResponse {
  data: UserResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const userApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: 'ADMIN' | 'SUPERVISOR' | 'CLIENT';
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  }) => apiGet<PaginatedUsersResponse>('/users', { params }),

  getById: (id: string) =>
    apiGet<UserResponse>(`/users/${id}`),

  create: (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role: 'ADMIN' | 'SUPERVISOR' | 'CLIENT';
    avatar?: string;
    province?: string;
    businessName?: string;
    defaultAddress?: string;
  }) => apiPost<UserResponse>('/users', data),

  update: (
    id: string,
    data: Partial<{
      email: string;
      password: string;
      fullName: string;
      phone: string;
      role: 'ADMIN' | 'SUPERVISOR' | 'CLIENT';
      status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
      avatar: string;
      clearAvatar: boolean;
      province: string;
      businessName: string;
      defaultAddress: string;
    }>,
  ) => apiPatch<UserResponse>(`/users/${id}`, data),

  delete: (id: string) =>
    apiDelete<{ id: string; deletedAt: string }>(`/users/${id}`),
};

// ============================================================
// PRICE BOARD API ENDPOINTS
// ============================================================
export interface PriceBoardResponse {
  id: string;
  cropType: string;
  grade: 'A' | 'B' | 'C' | 'REJECT';
  buyPrice: number;
  sellPrice: number;
  effectiveDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  admin?: {
    id: string;
    businessName: string;
    province: string;
  };
}

export interface PaginatedPriceBoardsResponse {
  data: PriceBoardResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const priceBoardApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    cropType?: string;
    grade?: string;
    isActive?: string;
  }) => apiGet<PaginatedPriceBoardsResponse>('/price-boards', { params }),

  getById: (id: string) =>
    apiGet<PriceBoardResponse>(`/price-boards/${id}`),

  create: (data: {
    cropType: string;
    grade: PriceBoardResponse['grade'];
    buyPrice: number;
    sellPrice: number;
    effectiveDate?: string;
  }) => apiPost<PriceBoardResponse>('/price-boards', data),

  update: (
    id: string,
    data: Partial<{
      cropType: string;
      grade: PriceBoardResponse['grade'];
      buyPrice: number;
      sellPrice: number;
      effectiveDate: string;
      isActive: boolean;
    }>,
  ) => apiPatch<PriceBoardResponse>(`/price-boards/${id}`, data),

  toggleActive: (id: string) =>
    apiPatch<PriceBoardResponse>(`/price-boards/${id}/toggle-active`, {}),

  delete: (id: string) =>
    apiDelete<{ id: string; deletedAt: string }>(`/price-boards/${id}`),
};

// ============================================================
// HELPER: Extract data từ wrapped response
// BE interceptor wrap: { success: true, data: T }
// Axios unwrap HTTP: response.data = { success: true, data: T }
// → Lấy T: response.data.data
// ============================================================
export function extractData<T>(response: unknown): T {
  return (response as { data: { data: T } }).data.data;
}

export default apiClient;
