import type { RouteObject } from 'react-router-dom';

// Client layouts
import ClientLayout from '@/client/layouts/client-layout';

// Client pages
import HomePage from '@/client/pages/home.page';
import ProductsPage from '@/client/pages/products.page';
import ProductDetailPage from '@/client/pages/product-detail.page';
import TraceabilityPage from '@/client/pages/traceability.page';
import TraceabilityDetailPage from '@/client/pages/traceability-detail.page';
import CartPage from '@/client/pages/cart.page';
import CheckoutPage from '@/client/pages/checkout.page';
import OrdersPage from '@/client/pages/orders.page';
import ProfilePage from '@/client/pages/profile.page';
import PaymentSimulatePage from '@/client/pages/payment-simulate.page';
import PaymentResultPage from '@/client/pages/payment-result.page';

// Route guards
import { ProtectedRoute } from '@/router/guards';

/**
 * Client E-Commerce Routes
 *
 * Public (mọi user):
 *   / → HomePage
 *   /products → ProductsPage
 *   /products/:slug → ProductDetailPage
 *   /categories/:slug → ProductsPage
 *
 * Protected (cần đăng nhập):
 *   /cart → CartPage
 *   /checkout → CheckoutPage
 *   /orders → OrdersPage
 *   /profile → ProfilePage
 *
 * Tất cả wrapped trong ClientLayout (navbar + footer)
 */
/** Pathless layout dưới RootLayout (`path: '/'`) — tránh lồng `path: '/'` hai lần (RR6 có thể không match `/` đúng). */
const clientLayoutRoute: RouteObject = {
  element: <ClientLayout />,
  children: [
    // Public routes
    {
      index: true,
      element: <HomePage />,
    },
    {
      path: 'products',
      element: <ProductsPage />,
    },
    {
      path: 'products/:slug',
      element: <ProductDetailPage />,
    },
    {
      path: 'categories/:slug',
      element: <ProductsPage />,
    },
    {
      path: 'traceability',
      element: <TraceabilityPage />,
    },
    {
      path: 'traceability/:slug',
      element: <TraceabilityDetailPage />,
    },

    // Protected routes — cần đăng nhập
    {
      path: 'cart',
      element: (
        <ProtectedRoute>
          <CartPage />
        </ProtectedRoute>
      ),
    },
    {
      path: 'checkout',
      element: (
        <ProtectedRoute>
          <CheckoutPage />
        </ProtectedRoute>
      ),
    },
    {
      path: 'orders',
      element: (
        <ProtectedRoute>
          <OrdersPage />
        </ProtectedRoute>
      ),
    },
    {
      path: 'profile',
      element: (
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      ),
    },
    {
      path: 'payment/simulate',
      element: (
        <ProtectedRoute>
          <PaymentSimulatePage />
        </ProtectedRoute>
      ),
    },
    {
      path: 'payment/result',
      element: (
        <ProtectedRoute>
          <PaymentResultPage />
        </ProtectedRoute>
      ),
    },
  ],
};

export const clientRoutes: RouteObject[] = [clientLayoutRoute];
