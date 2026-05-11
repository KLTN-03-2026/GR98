import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import AIVisionPage from './pages/AIVisionPage';
import ChatbotPage from './pages/ChatbotPage';
import ProfilePage from './pages/ProfilePage';
import ShipperPage from './pages/ShipperPage';
import { getRoleHomePath, type UserRole } from './services/auth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  
  if (isAuthenticated) {
    return <Navigate to={getRoleHomePath(user?.role)} replace />;
  }
  
  return <>{children}</>;
}

function RoleRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleHomePath(user.role)} replace />;
  }

  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <RoleRoute allowedRoles={['SUPERVISOR']}>
          <HomePage />
        </RoleRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/ai-vision',
    element: (
      <ProtectedRoute>
        <RoleRoute allowedRoles={['SUPERVISOR']}>
          <AIVisionPage />
        </RoleRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/chatbot',
    element: (
      <ProtectedRoute>
        <RoleRoute allowedRoles={['SUPERVISOR']}>
          <ChatbotPage />
        </RoleRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <RoleRoute allowedRoles={['SUPERVISOR', 'SHIPPER']}>
          <ProfilePage />
        </RoleRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/shipper',
    element: (
      <ProtectedRoute>
        <RoleRoute allowedRoles={['SHIPPER']}>
          <ShipperPage />
        </RoleRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
