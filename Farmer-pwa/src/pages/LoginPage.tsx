import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, X } from 'lucide-react';
import { canAccessPwa, clearAuthStorage, getRoleHomePath, login } from '../services/auth';
import { useAuthStore } from '../stores/authStore';

const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Vui lòng nhập email hoặc số điện thoại'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginForm = z.infer<typeof loginSchema>;

function getLoginErrorMessage(error: unknown) {
  const apiError = error as { response?: { data?: { message?: string } } };
  return apiError.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
}

function toLoginPayload(data: LoginForm) {
  const identifier = data.identifier.trim();
  return {
    ...(identifier.includes('@') ? { email: identifier } : { phone: identifier }),
    password: data.password,
  };
}

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');
    setToastMessage('');
    try {
      const response = await login(toLoginPayload(data));
      if (!canAccessPwa(response.user.role)) {
        clearAuthStorage();
        setUser(null);
        setToastMessage('Chỉ có người giám sát và shipper mới được vào app.');
        return;
      }

      setUser(response.user, response.user.supervisorProfile || null);
      navigate(getRoleHomePath(response.user.role), { replace: true });
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 to-primary/10 flex items-center justify-center p-4">
      {toastMessage && (
        <div className="fixed left-4 right-4 top-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-red-100 bg-white p-4 text-sm font-medium text-red-700 shadow-lg">
          <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
          <p className="min-w-0 flex-1">{toastMessage}</p>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="shrink-0 rounded-full p-1 text-red-400 transition hover:bg-red-50 hover:text-red-700"
            aria-label="Đóng thông báo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-neutral-200">
          <div className="text-center mb-8">
            <div className="w-24 h-24 flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <img src="/logo.png" alt="AGRI Supervisors" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">AGRI Supervisors</h1>
            <p className="text-neutral-500 mt-2">Đăng nhập để tiếp tục</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Email hoặc số điện thoại
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  {...register('identifier')}
                  type="text"
                  inputMode="email"
                  autoComplete="username"
                  placeholder="Nhập email hoặc số điện thoại"
                  className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white text-neutral-900 placeholder:text-neutral-400"
                />
              </div>
              {errors.identifier && (
                <p className="text-red-500 text-sm mt-1">{errors.identifier.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  {...register('password')}
                  type="password"
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white text-neutral-900 placeholder:text-neutral-400"
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
