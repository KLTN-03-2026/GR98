import type { LucideIcon } from 'lucide-react';
import { LogOut, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface PwaPageHeaderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone?: 'light' | 'dark';
  onRefresh?: () => void;
  isRefreshing?: boolean;
  showLogout?: boolean;
}

export default function PwaPageHeader({
  title,
  subtitle,
  icon: Icon,
  tone = 'light',
  onRefresh,
  isRefreshing = false,
  showLogout = false,
}: PwaPageHeaderProps) {
  const logout = useAuthStore((state) => state.logout);
  const isDark = tone === 'dark';

  return (
    <header
      className={`sticky top-0 z-20 border-b shadow-sm ${
        isDark
          ? 'border-secondary/30 bg-secondary text-white shadow-secondary/10'
          : 'border-neutral-200 bg-white text-neutral-900'
      }`}
    >
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              isDark ? 'bg-white/14 text-white' : 'bg-primary/10 text-primary'
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold leading-tight">{title}</h1>
            <p className={`truncate text-sm ${isDark ? 'text-white/75' : 'text-neutral-500'}`}>
              {subtitle}
            </p>
          </div>
        </div>

        {(onRefresh || showLogout) && (
          <div className="flex shrink-0 items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className={`flex h-10 w-10 items-center justify-center rounded-2xl transition ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/20'
                    : 'bg-neutral-100 text-neutral-500 hover:bg-primary/10 hover:text-primary'
                }`}
                aria-label="Làm mới"
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
            {showLogout && (
              <button
                type="button"
                onClick={logout}
                className={`flex h-10 w-10 items-center justify-center rounded-2xl transition ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/20'
                    : 'bg-neutral-100 text-neutral-500 hover:bg-red-50 hover:text-red-500'
                }`}
                aria-label="Đăng xuất"
              >
                <LogOut className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
