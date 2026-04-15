import { Navigate, type RouteObject } from 'react-router-dom';
import RootLayout from '@/layouts/RootLayout';
import DashboardLayout from '@/layouts/dashboard.layout';
import AdminAuthLayout from '@/layouts/admin-auth.layout';
import SupervisorAuthLayout from '@/layouts/supervisor-auth.layout';
import InventoryAuthLayout from '@/layouts/inventory-auth.layout';
import AdminAccountManagementPage from '@/pages/admin/account-management';
import AdminOverviewPage from '@/pages/admin/overview';
import AdminZonesPage from '@/pages/admin/zones';
import AdminPlotsPage from '@/pages/admin/plots';
import AdminContractsPage from '@/pages/admin/contracts';
import AdminDailyReportsPage from '@/pages/admin/daily-reports';
import AdminOrdersPage from '@/pages/admin/orders';
import AdminAssignmentsPage from '@/pages/admin/assignments';
import AdminClientsPage from '@/pages/admin/clients';
import AdminWarehousesPage from '@/pages/admin/warehouses';

import SupervisorOverviewPage from '@/pages/supervisor/overview';
import SupervisorFarmersPage from '@/pages/supervisor/farmers';
import SupervisorPlotsPage from '@/pages/supervisor/plots';
import SupervisorContractsPage from '@/pages/supervisor/contracts';
import SupervisorAIAnalysisPage from '@/pages/supervisor/ai-analysis';
import SupervisorDailyReportsPage from '@/pages/supervisor/daily-reports';

import InventoryOrdersPage from '@/pages/inventory/orders';
import InventoryProductsPage from '@/pages/inventory/products';
import InventoryCategoriesPage from '@/pages/inventory/categories';
import InventoryPriceBoardsPage from '@/pages/inventory/price-boards';
import InventoryOverviewPage from '@/pages/inventory/overview';
import InventoryWarehousesPage from '@/pages/inventory/warehouses';
import WarehouseDetailPage from '@/pages/inventory/warehouses/details';
import InventoryLotsPage from '@/pages/inventory/lots';
import InventoryTransactionsPage from '@/pages/inventory/transactions';
import InventorySupplyDemandPage from '@/pages/inventory/supply-demand';
import InventoryLogisticsPage from '@/pages/inventory/logistics';

import LoginPage from '@/pages/auth/login.page';
import RegisterPage from '@/pages/auth/register.page';
import ForgotPasswordPage from '@/pages/auth/forgot-password.page';
import ResetPasswordPage from '@/pages/auth/reset-password.page';

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

// Supervisor and Inventory are grouped at the bottom

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
      element: <AdminAccountManagementPage />,
    },
    {
      path: 'overview',
      element: <AdminOverviewPage />,
    },
    {
      path: 'users',
      element: <AdminAccountManagementPage />,
    },
    {
      path: 'supervisors',
      element: <Navigate to="/dashboard/users?tab=supervisors" replace />,
    },
    {
      path: 'inventory-staff',
      element: <Navigate to="/dashboard/users?tab=inventory-staff" replace />,
    },
    {
      path: 'zones',
      element: <AdminZonesPage />,
    },
    {
      path: 'farmers',
      element: <Navigate to="/dashboard/users?tab=farmers" replace />,
    },
    {
      path: 'plots',
      element: <AdminPlotsPage />,
    },
    {
      path: 'contracts',
      element: <AdminContractsPage />,
    },
    {
      path: 'assignments',
      element: <AdminAssignmentsPage />,
    },
    {
      path: 'daily-reports',
      element: <AdminDailyReportsPage />,
    },
    {
      path: 'clients',
      element: <AdminClientsPage />,
    },
    {
      path: 'warehouses',
      element: <AdminWarehousesPage />,
    },
    {
      path: 'orders',
      element: <AdminOrdersPage />,
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
      element: <SupervisorOverviewPage />,
    },
    {
      path: 'overview',
      element: <SupervisorOverviewPage />,
    },
    {
      path: 'farmers',
      element: <SupervisorFarmersPage />,
    },
    {
      path: 'plots',
      element: <SupervisorPlotsPage />,
    },
    {
      path: 'contracts',
      element: <SupervisorContractsPage />,
    },
    {
      path: 'daily-reports',
      element: <SupervisorDailyReportsPage />,
    },
    {
      path: 'ai-analysis',
      element: <SupervisorAIAnalysisPage />,
    },
  ],
};

// ============================================================
// INVENTORY AUTH — Layout riêng (không Header/Footer)
// ============================================================
const inventoryAuthLayout: RouteObject = {
  path: 'inventory',
  element: <InventoryAuthLayout />,
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
// INVENTORY DASHBOARD — INVENTORY only
// ============================================================
const inventoryDashboard: RouteObject = {
  path: 'inventory',
  element: (
    <ProtectedRoute>
      <RoleRoute allowedRoles={['INVENTORY']}>
        <DashboardLayout />
      </RoleRoute>
    </ProtectedRoute>
  ),
  errorElement: <RouteErrorPage />,
  children: [
    {
      index: true,
      element: <InventoryOverviewPage />,
    },
    {
      path: 'overview',
      element: <InventoryOverviewPage />,
    },
    {
      path: 'warehouses',
      element: <InventoryWarehousesPage />,
    },
    {
      path: 'warehouses/:id',
      element: <WarehouseDetailPage />,
    },
    {
      path: 'lots',
      element: <InventoryLotsPage />,
    },
    {
      path: 'transactions',
      element: <InventoryTransactionsPage />,
    },
    {
      path: 'supply-demand',
      element: <InventorySupplyDemandPage />,
    },
    {
      path: 'logistics',
      element: <InventoryLogisticsPage />,
    },
    {
      path: 'products',
      element: <InventoryProductsPage />,
    },
    {
      path: 'categories',
      element: <InventoryCategoriesPage />,
    },
    {
      path: 'orders',
      element: <InventoryOrdersPage />,
    },
    {
      path: 'price-boards',
      element: <InventoryPriceBoardsPage />,
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
  inventoryAuthLayout,
  adminDashboard,
  supervisorDashboard,
  inventoryDashboard,
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

export default routes;

