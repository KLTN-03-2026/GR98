import { useNavigate, Link } from 'react-router-dom';
import { Mail, User, LogOut, Camera, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 text-neutral-600 hover:text-neutral-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-semibold text-neutral-900">Hồ sơ</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
          <div className="p-6 text-center border-b border-neutral-100">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900">{user?.fullName}</h2>
            <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
              {user?.role}
            </span>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-xl">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Mail className="w-5 h-5 text-neutral-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Email</p>
                <p className="font-medium text-neutral-900">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-xl">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <User className="w-5 h-5 text-neutral-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Vai trò</p>
                <p className="font-medium text-neutral-900">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full mt-6 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-4 px-6 rounded-2xl transition flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Đăng xuất
        </button>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex justify-around">
          <Link
            to="/"
            className="flex flex-col items-center gap-1 text-neutral-400"
          >
            <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 8c-8 0-14 6-14 14s6 14 14 14c2 0 4-.4 6-1-4-2-7-6-8-11 1-2 2-4 4-5-2 1-3 3-3 5 0 6 5 10 11 10s11-4 11-10c0-2-1-4-3-5 2 1 3 3 4 5-1 5-4 9-8 11 2 .6 4 1 6 1 8 0 14-6 14-14S32 8 24 8z" fill="currentColor" opacity="0.9"/>
                <ellipse cx="24" cy="22" rx="3" ry="8" fill="currentColor"/>
                <path d="M24 14c-3 0-6 2-6 6 0 1 0 2 .5 3 1.5 3 5.5 5 5.5 5s4-2 5.5-5c.5-1 .5-2 .5-3 0-4-3-6-6-6z" fill="currentColor"/>
              </svg>
            </div>
            <span className="text-xs">Trang chủ</span>
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
            className="flex flex-col items-center gap-1 text-primary"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Hồ sơ</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}