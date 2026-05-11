import { Mail, User, LogOut, CircleUserRound } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import PwaPageHeader from '../components/PwaPageHeader';
import PwaTabMenu from '../components/PwaTabMenu';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const roleLabel = user?.role === 'SHIPPER' ? 'Nhân viên giao hàng' : 'Giám sát viên';

  return (
    <div className="min-h-screen bg-[#f6f8f5] pb-24">
      <PwaPageHeader
        title="Tài khoản"
        subtitle={roleLabel}
        icon={CircleUserRound}
      />

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
          <div className="p-6 text-center border-b border-neutral-100">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900">{user?.fullName}</h2>
            <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
              {roleLabel}
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
                <p className="font-medium text-neutral-900">{roleLabel}</p>
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

      <PwaTabMenu />
    </div>
  );
}
