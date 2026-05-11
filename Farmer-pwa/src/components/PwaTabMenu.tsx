import { NavLink } from 'react-router-dom';
import {
  Grid2X2,
  MessageSquareText,
  ScanSearch,
  Truck,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface TabItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const supervisorTabs: TabItem[] = [
  { to: '/', label: 'Tổng quan', icon: Grid2X2, end: true },
  { to: '/ai-vision', label: 'Quét lá', icon: ScanSearch },
  { to: '/chatbot', label: 'Trợ lý', icon: MessageSquareText },
  { to: '/profile', label: 'Tài khoản', icon: UserRound },
];

const shipperTabs: TabItem[] = [
  { to: '/shipper', label: 'Đơn giao', icon: Truck, end: true },
  { to: '/profile', label: 'Tài khoản', icon: UserRound },
];

export default function PwaTabMenu() {
  const role = useAuthStore((state) => state.user?.role);
  const tabs = role === 'SHIPPER' ? shipperTabs : supervisorTabs;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
      <div
        className={`mx-auto grid max-w-lg gap-1 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 ${
          tabs.length === 2 ? 'grid-cols-2' : 'grid-cols-4'
        }`}
      >
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition ${
                  isActive
                    ? 'bg-primary/12 text-primary'
                    : 'text-neutral-400 hover:bg-neutral-100 hover:text-secondary'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-2xl transition ${
                      isActive ? 'bg-primary text-white shadow-sm' : 'bg-neutral-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
