import type { RouteObject } from 'react-router-dom';
import RootLayout from '@/layouts/RootLayout';
import DashboardLayout from '@/layouts/dashboard.layout';
import AdminAuthLayout from '@/layouts/admin-auth.layout';
import SupervisorAuthLayout from '@/layouts/supervisor-auth.layout';
import UsersManagementPage from '@/pages/users';
import LoginPage from '@/pages/auth/login.page';
import RegisterPage from '@/pages/auth/register.page';
import ForgotPasswordPage from '@/pages/auth/forgot-password.page';
import ResetPasswordPage from '@/pages/auth/reset-password.page';
import OverviewPage from '@/pages/overview';
import ZonesPage from '@/pages/zones';
import FarmersPage from '@/pages/farmers';
import PlotsPage from '@/pages/plots';
import ContractsPage from '@/pages/contracts';
import DailyReportsPage from '@/pages/daily-reports';
import ProductsPage from '@/pages/products';
import CategoriesPage from '@/pages/categories';
import OrdersPage from '@/pages/orders';
import ReviewsPage from '@/pages/reviews';
import ComponentsPage from '@/pages/components';
import PriceBoardsPage from '@/pages/price-boards';
import RouteErrorPage from '@/pages/errors/route-error.page';
import NotFoundPage from '@/pages/errors/not-found.page';
import { clientRoutes } from '@/client/router/client-routes';
import { GuestRoute, ProtectedRoute, RoleRoute } from '@/router/guards';

/**
 * Route Structure by Role:
 *
 * /auth/login      → LoginPage (standalone, no header/footer)  — Guest only
 * /auth/register   → RegisterPage (standalone, no header/footer) — Guest only
 *
 * /admin/login     → AdminAuthLayout → LoginPage  — Guest only
 * /admin/*         → DashboardLayout (Admin sidebar + navbar)  — ADMIN only
 *
 * /supervisor/login → SupervisorAuthLayout → LoginPage — Guest only
 * /supervisor/*     → DashboardLayout (Supervisor sidebar + navbar) — SUPERVISOR only
 *
 * /*                → ClientLayout (navbar + footer)
 *   /cart, /checkout, /orders, /profile → ProtectedRoute (CLIENT only)
 */

// ============================================================
// ROOT LAYOUT — chỉ chứa auth routes + client routes
// ============================================================
const rootLayout: RouteObject = {
  path: '/',
  element: <RootLayout />,
  errorElement: <RouteErrorPage />,
  children: [
    // ============================================================
    // CLIENT ROUTES — E-Commerce (navbar + footer)
    // ============================================================
    ...clientRoutes,

    // ============================================================
    // AUTH ROUTES — Standalone, không Header/Footer
    // ============================================================
    {
      path: 'auth/login',
      element: (
        <GuestRoute>
          <LoginPage />
        </GuestRoute>
      ),
    },
    {
      path: 'auth/register',
      element: (
        <GuestRoute>
          <RegisterPage />
        </GuestRoute>
      ),
    },
    {
      path: 'auth/forgot-password',
      element: (
        <GuestRoute>
          <ForgotPasswordPage />
        </GuestRoute>
      ),
    },
    {
      path: 'auth/reset-password',
      element: (
        <GuestRoute>
          <ResetPasswordPage />
        </GuestRoute>
      ),
    },
  ],
};

// ============================================================
// ADMIN AUTH — Layout riêng (không Header/Footer)
// ============================================================
const adminAuthLayout: RouteObject = {
  path: 'admin',
  element: <AdminAuthLayout />,
  errorElement: <RouteErrorPage />,
  children: [
    {
      path: 'login',
      element: (
        <GuestRoute>
          <LoginPage />
        </GuestRoute>
      ),
    },
    {
      path: 'register',
      element: (
        <GuestRoute>
          <RegisterPage />
        </GuestRoute>
      ),
    },
  ],
};

// ============================================================
// SUPERVISOR AUTH — Layout riêng (không Header/Footer)
// ============================================================
const supervisorAuthLayout: RouteObject = {
  path: 'supervisor',
  element: <SupervisorAuthLayout />,
  errorElement: <RouteErrorPage />,
  children: [
    {
      path: 'login',
      element: (
        <GuestRoute>
          <LoginPage />
        </GuestRoute>
      ),
    },
  ],
};

// ============================================================
// ADMIN DASHBOARD — ADMIN only
// ============================================================
const adminDashboard: RouteObject = {
  path: 'dashboard',
  element: (
    <ProtectedRoute>
      <RoleRoute allowedRoles={['ADMIN']}>
        <DashboardLayout />
      </RoleRoute>
    </ProtectedRoute>
  ),
  errorElement: <RouteErrorPage />,
  children: [
    {
      index: true,
      element: <UsersManagementPage />,
    },
    {
      path: 'overview',
      element: <OverviewPage />,
    },
    {
      path: 'users',
      element: <UsersManagementPage />,
    },
    {
      path: 'zones',
      element: <ZonesPage />,
    },
    {
      path: 'farmers',
      element: <FarmersPage />,
    },
    {
      path: 'plots',
      element: <PlotsPage />,
    },
    {
      path: 'contracts',
      element: <ContractsPage />,
    },
    {
      path: 'products',
      element: <ProductsPage />,
    },
    {
      path: 'categories',
      element: <CategoriesPage />,
    },
    {
      path: 'orders',
      element: <OrdersPage />,
    },
    {
      path: 'reviews',
      element: <ReviewsPage />,
    },
    {
      path: 'price-boards',
      element: <PriceBoardsPage />,
    },
    {
      path: 'components',
      element: <ComponentsPage />,
    },
  ],
};

// ============================================================
// SUPERVISOR DASHBOARD — SUPERVISOR only
// ============================================================
const supervisorDashboard: RouteObject = {
  path: 'supervisor',
  element: (
    <ProtectedRoute>
      <RoleRoute allowedRoles={['SUPERVISOR']}>
        <DashboardLayout />
      </RoleRoute>
    </ProtectedRoute>
  ),
  errorElement: <RouteErrorPage />,
  children: [
    {
      index: true,
      element: <OverviewPage />,
    },
    {
      path: 'overview',
      element: <OverviewPage />,
    },
    {
      path: 'plots',
      element: <PlotsPage />,
    },
    {
      path: 'price-boards',
      element: <PriceBoardsPage />,
    },
    {
      path: 'contracts',
      element: <ContractsPage />,
    },
    {
      path: 'daily-reports',
      element: <DailyReportsPage />,
    },
  ],
};

// ============================================================
// EXPORT
// ============================================================
export const routes: RouteObject[] = [
  rootLayout,
  adminAuthLayout,
  supervisorAuthLayout,
  adminDashboard,
  supervisorDashboard,
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

export default routes;
