import { useQuery } from '@tanstack/react-query';
import { extractData } from '@/client/lib/api-client';
import { useAuthStore } from '@/client/store';
import { authApi } from './auth-api';
import type { MeResponse } from './types';

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
