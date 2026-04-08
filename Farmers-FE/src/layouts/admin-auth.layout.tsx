import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * AdminAuthLayout — Layout tối giản cho trang Login/Register của Admin
 * KHÔNG dùng Header, Footer, Sidebar, Navbar của ClientLayout
 * Chỉ là container trắng/gradient với Outlet ở giữa
 */
export default function AdminAuthLayout() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center p-4">
      {/* Decorative background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-700/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-5xl"
      >
        <Outlet />
      </motion.div>
    </div>
  );
}
