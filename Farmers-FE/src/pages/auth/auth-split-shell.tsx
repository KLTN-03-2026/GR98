import { cn } from '@/lib/utils';
import { AuthMarketingPanel } from '@/pages/auth/auth-marketing-panel';

export interface AuthSplitShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Vỏ chia đôi Login/Register: mobile xếp dọc (marketing + form cuộn được),
 * desktop hai cột full viewport.
 */
export function AuthSplitShell({ children, className }: AuthSplitShellProps) {
  return (
    <div
      className={cn(
        'flex min-h-[100dvh] w-full flex-col bg-background',
        'lg:h-[100dvh] lg:flex-row lg:items-stretch lg:overflow-hidden',
        className,
      )}
    >
      <AuthMarketingPanel />

      <div
        className={cn(
          'flex min-h-0 w-full flex-1 flex-col bg-background',
          'lg:w-1/2 lg:max-w-[50%] lg:overflow-hidden',
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:overflow-hidden">
          <div
            className={cn(
              'flex flex-1 flex-col justify-center px-4 py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]',
              'sm:px-6 sm:py-10',
              'lg:px-12 lg:py-12 lg:pb-12',
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
