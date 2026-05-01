import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  MapPin, 
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
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface LotDetailDrawerProps {
  lot: InventoryLot | null;
  isOpen: boolean;
  onClose: void | (() => void);
}

export function LotDetailDrawer({ lot, isOpen, onClose }: LotDetailDrawerProps) {
  const { data: timeline, isLoading: isLoadingTimeline } = useGetLotTimeline(lot?.id || '');

  if (!lot) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose as (open: boolean) => void}>
      <SheetContent className="sm:max-w-[550px] flex flex-col gap-0 p-0">
        <SheetHeader className="p-6 border-b bg-slate-50/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex size-8 items-center justify-center rounded-lg border bg-white shadow-sm">
              <Package className="size-4 text-primary" />
            </div>
            <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider">
              Chi tiết lô hàng
            </Badge>
          </div>
          <SheetTitle className="text-xl font-bold tracking-tight">
            #{lot.id.slice(-6).toUpperCase()} - {lot.product.name}
          </SheetTitle>
          <SheetDescription className="text-sm">
            {lot.product.sku} • Cập nhật lúc {format(new Date(lot.updatedAt), 'HH:mm - dd/MM/yyyy', { locale: vi })}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Quick Stats Card */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border p-4 bg-slate-900 text-white shadow-sm">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Tồn kho hiện tại</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold tabular-nums">{lot.quantityKg.toLocaleString('vi-VN')}</span>
                <span className="text-xs text-slate-400 font-medium">kg</span>
              </div>
            </div>
            <div className="rounded-xl border p-4 bg-white shadow-sm">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Phẩm cấp</p>
              <Badge className={cn(
                "rounded-lg px-2.5 py-0.5 border-none font-bold text-xs",
                lot.qualityGrade === 'A' ? "bg-emerald-500 text-white" :
                lot.qualityGrade === 'B' ? "bg-blue-500 text-white" :
                "bg-amber-500 text-white"
              )}>
                Loại {lot.qualityGrade}
              </Badge>
            </div>
          </div>

          {/* 2. Info Sections */}
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="info">Thông tin cơ bản</TabsTrigger>
              <TabsTrigger value="timeline">Nhật ký biến động</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4 space-y-4">
              <div className="rounded-xl border bg-white p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
                    <FileText className="size-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nguồn gốc (Hợp đồng)</p>
                    {lot.contract ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold">{lot.contract.contractNo}</span>
                          <Badge variant="secondary" className="text-[10px]">{lot.contract.plot.plotCode}</Badge>
                        </div>
                        <p className="text-sm text-slate-600">
                          {lot.contract.farmer.fullName} • {lot.contract.plot.zone.name}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">Không có thông tin hợp đồng</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
                    <MapPin className="size-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kho chứa</p>
                    <p className="text-sm font-semibold">{lot.warehouse.name}</p>
                    <p className="text-xs text-muted-foreground">{lot.warehouse.locationAddress || '—'}</p>
                  </div>
                </div>

                <div className="pt-4 border-t flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
                    <Calendar className="size-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Các mốc thời gian</p>
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Thu hoạch</p>
                        <p className="text-sm font-medium">{lot.harvestDate ? format(new Date(lot.harvestDate), 'dd/MM/yyyy') : '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Hết hạn</p>
                        <p className="text-sm font-medium text-rose-600">{lot.expiryDate ? format(new Date(lot.expiryDate), 'dd/MM/yyyy') : '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <div className="rounded-xl border bg-white overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-bold">Loại</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-right">SL (kg)</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-right">Thời gian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingTimeline ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={3}><Skeleton className="h-10 w-full" /></TableCell>
                        </TableRow>
                      ))
                    ) : timeline?.length ? (
                      timeline.map((tx) => (
                        <TableRow key={tx.id} className="text-xs">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {tx.type === 'receive' || tx.type === 'inbound' ? <ArrowDownLeft className="size-3 text-emerald-500" /> :
                               tx.type === 'outbound' ? <ArrowUpRight className="size-3 text-rose-500" /> :
                               tx.type === 'transfer' ? <ArrowRightLeft className="size-3 text-blue-500" /> :
                               <Settings2 className="size-3 text-amber-500" />}
                              <span className="font-medium">
                                {tx.type === 'receive' ? 'Thu hoạch' :
                                 tx.type === 'inbound' ? 'Nhập kho' :
                                 tx.type === 'outbound' ? 'Xuất kho' :
                                 tx.type === 'transfer' ? 'Điều chuyển' : 'Điều chỉnh'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className={cn(
                            "text-right font-semibold tabular-nums",
                            tx.type === 'outbound' ? "text-rose-600" : "text-emerald-600"
                          )}>
                            {tx.type === 'outbound' ? '-' : '+'}{tx.quantityKg.toLocaleString('vi-VN')}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {format(new Date(tx.createdAt), 'dd/MM/yy')}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                          Chưa có lịch sử biến động
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
