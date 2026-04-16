import { Link } from 'react-router-dom';
import { Camera, MessageCircle, User, LogOut, Leaf } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function HomePage() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Agri Supervisor</h1>
              <p className="text-sm text-gray-500">Xin chào, {user?.fullName}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-500 hover:text-red-500 transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Chọn tính năng</h2>

        <div className="space-y-4">
          <Link
            to="/ai-vision"
            className="block bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition">
                <Camera className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">AI Vision</h3>
                <p className="text-sm text-gray-500">Chẩn đoán bệnh trên lá sầu riêng</p>
              </div>
            </div>
          </Link>

          <Link
            to="/chatbot"
            className="block bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-500/20 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 transition">
                <MessageCircle className="w-7 h-7 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">RAG Chatbot</h3>
                <p className="text-sm text-gray-500">Trợ lý kỹ thuật canh tác</p>
              </div>
            </div>
          </Link>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex justify-around">
          <Link
            to="/"
            className="flex flex-col items-center gap-1 text-primary"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Trang chủ</span>
          </Link>
          <Link
            to="/ai-vision"
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-xs">AI Vision</span>
          </Link>
          <Link
            to="/chatbot"
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-xs">Chatbot</span>
          </Link>
          <Link
            to="/profile"
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <span className="text-xs">Hồ sơ</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
