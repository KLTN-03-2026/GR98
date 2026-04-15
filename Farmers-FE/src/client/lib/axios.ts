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
  AUTH: 'ec_auth',
  USER: 'ec_user',
} as const;

const redirectToLoginIfNeeded = () => {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.location.pathname === '/auth/login') {
    return;
  }

  window.location.replace('/auth/login');
};

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
          localStorage.removeItem(STORAGE_KEYS.AUTH);
          localStorage.removeItem(STORAGE_KEYS.USER);
          redirectToLoginIfNeeded();
          return Promise.reject(error);
        }
      } else {
        // Không có refresh token → clear và redirect
        clearAllAuthCookies();
        localStorage.removeItem(STORAGE_KEYS.AUTH);
        localStorage.removeItem(STORAGE_KEYS.USER);
        redirectToLoginIfNeeded();
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

export default apiClient;
