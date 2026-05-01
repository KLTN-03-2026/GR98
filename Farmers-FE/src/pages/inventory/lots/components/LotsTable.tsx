import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  MapPin, 
  Package, 
  History,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InventoryLot } from '../api/types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface LotsTableProps {
  lots: InventoryLot[];
  isLoading: boolean;
  onViewDetail: (lot: InventoryLot) => void;
}

export function LotsTable({ lots, isLoading, onViewDetail }: LotsTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="size-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Đang tải dữ liệu lô hàng...</p>
      </div>
    );
  }

  if (lots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/30">
        <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
          <Package className="size-8" />
        </div>
        <div className="text-center">
          <p className="text-lg font-black text-slate-900">Không có lô hàng nào</p>
          <p className="text-sm text-slate-400 font-medium">Hiện chưa có lô hàng nào thuộc quyền quản lý của bạn.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="w-[120px] text-[10px] font-black uppercase text-slate-400 tracking-widest pl-8 h-14">Mã Lô</TableHead>
            <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest h-14">Sản phẩm & SKU</TableHead>
            <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest h-14">Phẩm cấp</TableHead>
            <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest h-14">Số lượng (kg)</TableHead>
            <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest h-14">Kho chứa</TableHead>
            <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest h-14">Ngày nhập</TableHead>
            <TableHead className="w-[100px] h-14 text-right pr-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lots.map((lot) => (
            <TableRow 
              key={lot.id} 
              className="group cursor-pointer hover:bg-slate-50/50 transition-colors border-slate-50"
              onClick={() => onViewDetail(lot)}
            >
              <TableCell className="pl-8 py-5">
                <span className="font-mono font-black text-slate-900 text-xs">
                  {lot.id.slice(-6).toUpperCase()}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-slate-900 text-sm">{lot.product.name}</span>
                  <span className="text-[10px] font-black text-slate-400 tracking-tight">{lot.product.sku}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn(
                  "rounded-full px-3 py-0.5 border-none font-black text-[10px] uppercase tracking-wider",
                  lot.qualityGrade === 'A' ? "bg-emerald-50 text-emerald-600" :
                  lot.qualityGrade === 'B' ? "bg-blue-50 text-blue-600" :
                  "bg-amber-50 text-amber-600"
                )}>
                  Loại {lot.qualityGrade}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-base font-black text-slate-900 tabular-nums">
                  {lot.quantityKg.toLocaleString('vi-VN')}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin className="size-3.5 text-slate-300" />
                  <span className="text-xs font-bold">{lot.warehouse.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-xs font-bold text-slate-500">
                  {format(new Date(lot.createdAt), 'dd/MM/yyyy', { locale: vi })}
                </span>
              </TableCell>
              <TableCell className="text-right pr-8">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-xl hover:bg-slate-900 hover:text-white transition-all active:scale-90"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetail(lot);
                  }}
                >
                  <Eye className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
