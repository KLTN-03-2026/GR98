import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatBarProps {
  totalStock: number;
  pendingOrders: number;
  expiringLots: number;
  stagnantLots: number;
}

export function StatBar({
  totalStock,
  pendingOrders,
  expiringLots,
  stagnantLots,
}: StatBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-6 px-6 py-3 bg-white/50 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/50">
          <TrendingUp className="size-4" />
        </div>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
          Tổng lưu trữ: <span className="text-slate-900 font-manrope font-bold">{(totalStock / 1000).toFixed(1)} tấn</span>
        </span>
      </div>
      
      <div className="h-4 w-px bg-slate-200 hidden sm:block" />
      
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 group cursor-help">
          <div className="size-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)] group-hover:scale-125 transition-transform" />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
            {pendingOrders} đơn chờ xử lý
          </span>
        </div>
        
        <div className="flex items-center gap-2 group cursor-help">
          <div className="size-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(248,113,113,0.5)] group-hover:scale-125 transition-transform" />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
            {expiringLots} lô sắp hết hạn
          </span>
        </div>

        <div className="flex items-center gap-2 group cursor-help">
          <div className="size-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.5)] group-hover:scale-125 transition-transform" />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
            {stagnantLots} lô tồn đọng
          </span>
        </div>
      </div>
    </div>
  );
}
