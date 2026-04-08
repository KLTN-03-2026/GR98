import type { RouteObject } from 'react-router-dom';

// Client layouts
import ClientLayout from '@/client/layouts/client-layout';

// Client pages
import HomePage from '@/client/pages/home.page';
import ProductsPage from '@/client/pages/products.page';
import ProductDetailPage from '@/client/pages/product-detail.page';
import CartPage from '@/client/pages/cart.page';
import CheckoutPage from '@/client/pages/checkout.page';
import OrdersPage from '@/client/pages/orders.page';
import ProfilePage from '@/client/pages/profile.page';

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
const clientLayoutRoute: RouteObject = {
  path: '/',
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
  ],
};

export const clientRoutes: RouteObject[] = [clientLayoutRoute];
