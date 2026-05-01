import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  MapPin, 
  User, 
  FileText, 
  Calendar,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InventoryLot } from '../api/types';
import { useGetLotTimeline } from '../api/hooks';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface LotDetailDrawerProps {
  lot: InventoryLot | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LotDetailDrawer({ lot, isOpen, onClose }: LotDetailDrawerProps) {
  const { data: timeline, isLoading: isLoadingTimeline } = useGetLotTimeline(lot?.id || '');

  if (!lot) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[500px] border-none shadow-2xl p-0 overflow-y-auto font-manrope">
        {/* Header Section */}
        <div className="bg-slate-900 p-8 text-white">
          <div className="flex justify-between items-start mb-6">
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-none rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-widest">
              CHI TIẾT LÔ HÀNG
            </Badge>
          </div>
          <h2 className="text-3xl font-black tracking-tight mb-2 uppercase">
            #{lot.id.slice(-6).toUpperCase()}
          </h2>
          <p className="text-slate-400 font-bold text-sm flex items-center gap-2">
            <Package className="size-4" />
            {lot.product.name} ({lot.product.sku})
          </p>
        </div>

        <div className="p-8 space-y-10">
          {/* 1. Nguồn gốc & Traceability */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileText className="size-4" />
              </div>
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Truy xuất nguồn gốc</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-6 bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Nông dân</p>
                <div className="flex flex-col">
                  <span className="font-black text-slate-900 text-sm">{lot.contract?.farmer.fullName || 'N/A'}</span>
                  <span className="text-xs text-slate-500 font-bold">{lot.contract?.farmer.phone}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Mã thửa đất</p>
                <div className="flex flex-col">
                  <span className="font-black text-slate-900 text-sm">{lot.contract?.plot.plotCode || 'N/A'}</span>
                  <span className="text-xs text-slate-500 font-bold">{lot.contract?.plot.zone.name}</span>
                </div>
              </div>
              <div className="col-span-2 space-y-1 pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Mã Hợp đồng</p>
                <span className="font-black text-slate-900 text-sm">{lot.contract?.contractNo || 'Không có hợp đồng'}</span>
              </div>
            </div>
          </section>

          {/* 2. Đặc tính & Kho */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <MapPin className="size-4" />
              </div>
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Trạng thái kho</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-900 rounded-3xl p-6 text-white col-span-2 flex justify-between items-center shadow-lg shadow-slate-200">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Số lượng hiện có</p>
                  <span className="text-4xl font-black tabular-nums">{lot.quantityKg.toLocaleString('vi-VN')} <small className="text-sm">kg</small></span>
                </div>
                <Badge className={cn(
                  "rounded-2xl px-4 py-2 border-none font-black text-xs uppercase",
                  lot.qualityGrade === 'A' ? "bg-emerald-500 text-white" :
                  lot.qualityGrade === 'B' ? "bg-blue-500 text-white" :
                  "bg-amber-500 text-white"
                )}>
                  Loại {lot.qualityGrade}
                </Badge>
              </div>
              
              <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <Calendar className="size-4" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Ngày thu hoạch</p>
                  <p className="text-xs font-black text-slate-900">{lot.harvestDate ? format(new Date(lot.harvestDate), 'dd/MM/yyyy') : 'N/A'}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Vị trí kho</p>
                  <p className="text-xs font-black text-slate-900">{lot.warehouse.name}</p>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Nhật ký biến động (Timeline) */}
          <section className="pb-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="size-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <History className="size-4" />
              </div>
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nhật ký biến động</h3>
            </div>

            {isLoadingTimeline ? (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="size-1 bg-slate-200 rounded-full h-10 w-1" />
                <div className="h-4 bg-slate-100 rounded w-full" />
              </div>
            ) : (
              <div className="space-y-8 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                {timeline?.map((tx, idx) => (
                  <div key={tx.id} className="relative pl-10">
                    <div className={cn(
                      "absolute left-0 top-1 size-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm transition-transform hover:scale-110",
                      tx.type === 'receive' || tx.type === 'inbound' ? "bg-emerald-500 text-white" :
                      tx.type === 'outbound' ? "bg-rose-500 text-white" :
                      tx.type === 'transfer' ? "bg-blue-500 text-white" :
                      "bg-amber-500 text-white"
                    )}>
                      {tx.type === 'receive' || tx.type === 'inbound' ? <ArrowDownLeft className="size-3.5" /> :
                       tx.type === 'outbound' ? <ArrowUpRight className="size-3.5" /> :
                       tx.type === 'transfer' ? <ArrowRightLeft className="size-3.5" /> :
                       <Settings2 className="size-3.5" />}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-black text-slate-900 uppercase">
                          {tx.type === 'receive' ? 'Nhận hàng thu hoạch' :
                           tx.type === 'inbound' ? 'Nhập kho bổ sung' :
                           tx.type === 'outbound' ? 'Xuất hàng' :
                           tx.type === 'transfer' ? 'Điều chuyển kho' : 'Điều chỉnh số liệu'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                          {format(new Date(tx.createdAt), 'HH:mm - dd/MM/yyyy')}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className={cn(
                          "font-black text-sm tabular-nums",
                          tx.type === 'outbound' ? "text-rose-600" : "text-emerald-600"
                        )}>
                          {tx.type === 'outbound' ? '-' : '+'}{tx.quantityKg.toLocaleString('vi-VN')} kg
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">tại {tx.warehouse.name}</span>
                      </div>
                      {tx.note && (
                        <p className="mt-2 text-[11px] text-slate-500 font-medium bg-slate-50 p-2 rounded-xl border border-slate-100">
                          "{tx.note}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
