import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractData } from '@/client/lib/api-client';
import { useAuthStore } from '@/client/store';
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from '@/lib/cookie-utils';
import type {
  AuthUser,
  LoginRequest,
} from '@/client/types';
import { authApi } from './auth-api';
import type { AuthUserResponse, MeResponse } from './types';

export function useLogin() {
  const { login } = useAuthStore();
  const queryClient = useQueryClient();
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
          inventoryProfile: null,
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
      
      queryClient.clear(); // Clear cache for the new user
      login(authUser, accessToken);
      toast.success('Đăng nhập thành công!');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Đăng nhập thất bại');
    },
  });
}
