import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/client/store';
import { getAccessTokenFromCookie } from '@/lib/cookie-utils';
import { getRoleHomePage } from './auth-guards';

/**
 * GuestRoute — Chặn user đã đăng nhập truy cập trang login/register.
 * Nếu đã login → redirect về trang phù hợp với role.
 */
export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated: storeAuth, user } = useAuthStore();
  const cookieToken = getAccessTokenFromCookie();
  const isLoggedIn = storeAuth || !!cookieToken;
  const location = useLocation();

  if (isLoggedIn) {
    const redirectTo = user?.role ? getRoleHomePage(user.role) : '/';
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }

  return <>{children}</>;
}

/**
 * ProtectedRoute — Chặn user CHƯA đăng nhập truy cập trang protected.
 * Nếu chưa login → redirect về /auth/login.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated: storeAuth } = useAuthStore();
  const cookieToken = getAccessTokenFromCookie();
  const isLoggedIn = storeAuth || !!cookieToken;
  const location = useLocation();

  if (!isLoggedIn) {
    return (
      <Navigate
        to="/auth/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return <>{children}</>;
}

/**
 * RoleRoute — Chặn user không có role phù hợp truy cập route.
 * Nếu role không khớp → redirect về trang phù hợp với role của họ.
 */
export function RoleRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: Array<'ADMIN' | 'SUPERVISOR' | 'CLIENT'>;
}) {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const redirectTo = getRoleHomePage(user.role);
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
