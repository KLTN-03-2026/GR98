import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AppLogo } from '@/components/global/app-logo';
import marketingBg from '@/assets/mẫu cà phê.jpg';

/* ── Palette tokens (from index.css base palette) ── */
const accent = 'var(--primary)';        // #7BAE3C — Farmers green
const ink = 'var(--foreground)';        // #1F2937
const muted = 'var(--muted-foreground)';

export interface AuthMarketingPanelProps {
  className?: string;
}

export function AuthMarketingPanel({ className }: AuthMarketingPanelProps) {
  const year = new Date().getFullYear();

  return (
    <div
      className={cn(
        'relative flex w-full flex-col overflow-hidden lg:w-1/2',
        'h-[clamp(260px,40vh,400px)] shrink-0 lg:h-full lg:min-h-0 lg:shrink',
        className,
      )}
    >
      {/* Photo background */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${marketingBg})` }}
      />
      {/* Scrim — giữ chữ đọc được trên ảnh chi tiết */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-white/1 via-white/45 to-white/40"
      />
      {/* Accent wash */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom right, color-mix(in oklab, var(--primary) 12%, transparent), transparent, color-mix(in oklab, var(--secondary) 10%, transparent))',
        }}
      />

      {/* Ambient radial blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute -right-24 -top-16 h-56 w-56 rounded-full opacity-40 blur-3xl"
          style={{ background: 'color-mix(in oklab, var(--primary) 20%, transparent)' }}
        />
        <div
          className="absolute -left-24 bottom-0 h-48 w-48 rounded-full opacity-30 blur-3xl"
          style={{ background: 'color-mix(in oklab, var(--secondary) 15%, transparent)' }}
        />
      </div>

      {/* Logo — top left */}
      <motion.header
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45 }}
        className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6 lg:left-8 lg:top-8"
      >
        <AppLogo
          height={200}
          className="max-h-14 w-auto sm:max-h-24 lg:max-h-[200px]"
        />
      </motion.header>

      <div className="relative z-10 flex h-full min-h-0 flex-1 flex-col">
        {/* Main content — centered, chừa chỗ logo */}
        <div className="flex w-full flex-1 flex-col items-center justify-center px-4 pb-4 pt-24 text-center sm:px-6 sm:pt-28 lg:px-12 lg:pb-8 lg:pt-32 lg:py-14">
          <div className="w-full max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              <h2
                className="text-2xl font-black leading-[1.15] tracking-tight drop-shadow-[0_1px_12px_rgba(255,255,255,0.9)] sm:text-3xl sm:leading-[1.1] sm:tracking-tight md:text-[2.1rem]"
                style={{ color: ink }}
              >
                <span
                  className="text-[1.15em] sm:text-[1.25em]"
                  style={{ color: accent }}
                >
                  Nâng Cao Nông Sản Việt
                </span>
              </h2>
            </motion.div>
          </div>
        </div>

        {/* Footer — sát đáy panel */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="relative z-10 mt-auto w-full px-4 pb-5 pt-2 text-center sm:px-6 sm:pb-6 lg:px-12 lg:pb-8"
        >
          <p className="mx-auto max-w-lg text-[0.65rem] leading-relaxed text-balance sm:text-xs">
            <span style={{ color: muted }}>
              © {year}{' '}
              <span className="font-semibold" style={{ color: ink }}>
                Vietnam Farmer
              </span>{' '}
              — Bản quyền thuộc về nền tảng Vietnam Farmer.
            </span>
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
