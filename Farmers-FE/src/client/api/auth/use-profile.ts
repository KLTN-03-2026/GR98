import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/client/store';
import { authApi } from './auth-api';

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
