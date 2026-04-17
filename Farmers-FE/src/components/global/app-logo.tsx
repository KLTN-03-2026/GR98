import { cn } from '@/lib/utils';

// Vite resolve @/assets
import logoSrc from '@/assets/Logo Agri-Intergration.png';

export interface AppLogoProps {
  /** Tailwind class name cho container */
  className?: string;
  /** alt text cho img */
  alt?: string;
}

/** Logo Agri-Integration — dùng thống nhất cho mọi role (client, admin, supervisor, auth). */
export function AppLogo({ className, alt = 'Vietnam Farmer' }: AppLogoProps) {
  return (
    <img
      src={logoSrc}
      alt={alt}
      className={cn('object-contain', className)}
      style={{ width: '140px', maxHeight: '80px' }}
    />
  );
}
