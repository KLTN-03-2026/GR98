import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { router } from './router'
import { PreloaderProvider } from './contexts/PreloaderContext'
import { Toaster } from "@/components/custom/sonner"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
const AppWithRouter = () => (
  <PreloaderProvider>
    <RouterProvider router={router} />
    <Toaster position="top-right" />
  </PreloaderProvider>
);

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <AppWithRouter />
  </QueryClientProvider>
)
