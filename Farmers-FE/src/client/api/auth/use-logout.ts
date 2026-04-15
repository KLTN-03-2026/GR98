import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/client/store';
import { authApi } from './auth-api';

export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await authApi.logout();
    },
    onSettled: () => {
      queryClient.clear();
      logout();
      localStorage.removeItem('ec_cart');
      toast.success('Đăng xuất thành công!');
    },
  });
}
