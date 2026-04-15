import { apiGet, apiPost, apiPut, apiDelete } from '@/client/lib/api-client';
import type { AuthUserResponse, MeResponse } from './types';

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
