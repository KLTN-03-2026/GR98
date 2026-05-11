import { Link } from 'react-router-dom';
import { LayoutDashboard, MessageSquareText, ScanSearch } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import PwaPageHeader from '../components/PwaPageHeader';
import PwaTabMenu from '../components/PwaTabMenu';

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#f6f8f5]">
      <PwaPageHeader
        title="Bảng giám sát"
        subtitle={`Xin chào, ${user?.fullName ?? 'Giám sát viên'}`}
        icon={LayoutDashboard}
        showLogout
      />

      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        <h2 className="text-lg font-bold text-neutral-900 mb-4">Công cụ làm việc</h2>

        <div className="space-y-4">
          <Link
            to="/ai-vision"
            className="block bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 hover:shadow-md hover:border-primary/20 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition">
                <ScanSearch className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900">Quét bệnh cây</h3>
                <p className="text-sm text-neutral-500">Chẩn đoán bệnh trên lá cây</p>
              </div>
            </div>
          </Link>

          <Link
            to="/chatbot"
            className="block bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 hover:shadow-md hover:border-secondary/20 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center group-hover:bg-secondary/20 transition">
                <MessageSquareText className="w-7 h-7 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900">Trợ lý canh tác</h3>
                <p className="text-sm text-neutral-500">Trợ lý kỹ thuật canh tác</p>
              </div>
            </div>
          </Link>
        </div>
      </main>

      <PwaTabMenu />
    </div>
  );
}
