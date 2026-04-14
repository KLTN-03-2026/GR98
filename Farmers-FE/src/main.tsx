import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { router } from './router'
import { PreloaderProvider } from './contexts/PreloaderContext'
import { Toaster } from "@/components/custom/sonner"

import { ThemeProvider } from '@/providers/theme-provider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
const AppWithRouter = () => (
  <ThemeProvider defaultTheme="light" storageKey="farmers_app_theme">
    <PreloaderProvider>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" />
    </PreloaderProvider>
  </ThemeProvider>
);

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <AppWithRouter />
  </QueryClientProvider>
)
