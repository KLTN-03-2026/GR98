import { Outlet } from 'react-router-dom';
import ClientNavbar from '@/client/components/client-navbar';
import ClientFooter from '@/client/components/client-footer';
import { ThemeProvider } from '@/providers/theme-provider';

export default function ClientLayout() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="farmers_client_theme">
      <div className="min-h-screen flex flex-col bg-background">
        <ClientNavbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <ClientFooter />
      </div>
    </ThemeProvider>
  );
}
