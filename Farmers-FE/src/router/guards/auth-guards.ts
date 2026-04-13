import type { UserRole } from '@/client/types';

/**
 * Route guard utilities cho React Router v6.
 * Các hàm helper để kiểm tra auth state và role.
 */

/**
 * Lấy redirect path dựa trên role của user.
 */
export function getRoleHomePage(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return '/dashboard';
    case 'SUPERVISOR':
      return '/supervisor';
    case 'INVENTORY':
      return '/inventory';
    case 'CLIENT':
    default:
      return '/';
  }
}

/**
 * Kiểm tra xem user có role phù hợp để truy cập dashboard admin không.
 */
export function canAccessAdmin(role: UserRole | undefined): boolean {
  return role === 'ADMIN';
}

/**
 * Kiểm tra xem user có role phù hợp để truy cập dashboard supervisor không.
 */
export function canAccessSupervisor(role: UserRole | undefined): boolean {
  return role === 'SUPERVISOR';
}

/**
 * Kiểm tra xem user đã đăng nhập chưa.
 */
export function isAuthenticated(
  isAuthenticated: boolean,
  hasAccessToken: boolean,
): boolean {
  return isAuthenticated || hasAccessToken;
}
