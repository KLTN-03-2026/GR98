import React from 'react';

export default function InventoryLotsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 font-manrope">
          Quản lý Lô hàng
        </h1>
        <p className="text-slate-500 font-medium">
          Hệ thống quản trị định danh và chất lượng nông sản (Giai đoạn 3).
        </p>
      </div>

      <div className="min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50/50">
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-4">
          <div className="size-12 rounded-full bg-slate-900 flex items-center justify-center text-white animate-pulse">
            <span className="font-black text-xl">3</span>
          </div>
          <p className="text-slate-900 font-black text-lg uppercase tracking-widest">Đang xây dựng giao diện mới</p>
          <p className="text-slate-400 text-sm font-medium text-center max-w-[280px]">
            Toàn bộ hệ thống quản lý lô hàng đang được nâng cấp lên tiêu chuẩn "Quiet Luxury".
          </p>
        </div>
      </div>
    </div>
  );
}
