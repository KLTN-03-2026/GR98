import { Link } from 'react-router-dom';
import { Camera, MessageCircle, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function HomePage() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 8c-8 0-14 6-14 14s6 14 14 14c2 0 4-.4 6-1-4-2-7-6-8-11 1-2 2-4 4-5-2 1-3 3-3 5 0 6 5 10 11 10s11-4 11-10c0-2-1-4-3-5 2 1 3 3 4 5-1 5-4 9-8 11 2 .6 4 1 6 1 8 0 14-6 14-14S32 8 24 8z" fill="currentColor" opacity="0.9"/>
                <ellipse cx="24" cy="22" rx="3" ry="8" fill="currentColor"/>
                <path d="M24 14c-3 0-6 2-6 6 0 1 0 2 .5 3 1.5 3 5.5 5 5.5 5s4-2 5.5-5c.5-1 .5-2 .5-3 0-4-3-6-6-6z" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h1 className="font-semibold text-neutral-900">Vietnam Farmer</h1>
              <p className="text-sm text-neutral-500">Xin chào, {user?.fullName}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-neutral-400 hover:text-red-500 transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Chọn tính năng</h2>

        <div className="space-y-4">
          <Link
            to="/ai-vision"
            className="block bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 hover:shadow-md hover:border-primary/20 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition">
                <Camera className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900">AI Vision</h3>
                <p className="text-sm text-neutral-500">Chẩn đoán bệnh trên lá cây</p>
              </div>
            </div>
          </Link>

          <Link
            to="/chatbot"
            className="block bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 hover:shadow-md hover:border-secondary/20 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center group-hover:bg-secondary/20 transition">
                <MessageCircle className="w-7 h-7 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900">RAG Chatbot</h3>
                <p className="text-sm text-neutral-500">Trợ lý kỹ thuật canh tác</p>
              </div>
            </div>
          </Link>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex justify-around">
          <Link
            to="/"
            className="flex flex-col items-center gap-1 text-primary"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 8c-8 0-14 6-14 14s6 14 14 14c2 0 4-.4 6-1-4-2-7-6-8-11 1-2 2-4 4-5-2 1-3 3-3 5 0 6 5 10 11 10s11-4 11-10c0-2-1-4-3-5 2 1 3 3 4 5-1 5-4 9-8 11 2 .6 4 1 6 1 8 0 14-6 14-14S32 8 24 8z" fill="currentColor" opacity="0.9"/>
                <ellipse cx="24" cy="22" rx="3" ry="8" fill="currentColor"/>
                <path d="M24 14c-3 0-6 2-6 6 0 1 0 2 .5 3 1.5 3 5.5 5 5.5 5s4-2 5.5-5c.5-1 .5-2 .5-3 0-4-3-6-6-6z" fill="currentColor"/>
              </svg>
            </div>
            <span className="text-xs font-medium">Trang chủ</span>
          </Link>
          <Link
            to="/ai-vision"
            className="flex flex-col items-center gap-1 text-neutral-400"
          >
            <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-xs">AI Vision</span>
          </Link>
          <Link
            to="/chatbot"
            className="flex flex-col items-center gap-1 text-neutral-400"
          >
            <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-xs">Chatbot</span>
          </Link>
          <Link
            to="/profile"
            className="flex flex-col items-center gap-1 text-neutral-400"
          >
            <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <span className="text-xs">Hồ sơ</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}