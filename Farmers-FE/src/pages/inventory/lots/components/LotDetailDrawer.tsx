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
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InventoryLot } from '../api/types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetLotById, useGetLotTimeline } from '../api/hooks';
import { WeightAdjustmentDialog } from './WeightAdjustmentDialog';
import { QualityGradingDialog } from './QualityGradingDialog';
import { ExpiryUpdateDialog } from './ExpiryUpdateDialog';
import { ConfirmReceiptDialog } from './ConfirmReceiptDialog';
import { Button } from '@/components/ui/button';
import { Edit2, Scale, RefreshCw, CheckCircle2 } from 'lucide-react';

interface LotDetailDrawerProps {
  lot: InventoryLot | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LotDetailDrawer({ lot: initialLot, isOpen, onClose }: LotDetailDrawerProps) {
  const { data: currentLot, isLoading: isLoadingLot } = useGetLotById(initialLot?.id || '');
  const { data: timeline, isLoading: isLoadingTimeline } = useGetLotTimeline(initialLot?.id || '');
  
  const [isAdjustingWeight, setIsAdjustingWeight] = React.useState(false);
  const [isUpdatingGrade, setIsUpdatingGrade] = React.useState(false);
  const [isUpdatingExpiry, setIsUpdatingExpiry] = React.useState(false);
  const [isConfirmingReceipt, setIsConfirmingReceipt] = React.useState(false);

  const lot = currentLot || initialLot;
  const isUpcoming = lot?.status === 'SCHEDULED';
  const isReceived = lot?.status === 'RECEIVED';



  if (!lot) return null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(val) => !val && onClose()}>
        <SheetContent className="sm:max-w-[550px] flex flex-col gap-0 p-0 font-manrope">
          <SheetHeader className="relative overflow-hidden border-b px-6 py-8 sm:px-8 bg-linear-to-b from-primary/[0.07] via-background to-background dark:from-primary/15">
            <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                    <Package className="size-6" />
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-1 rounded-full border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary shadow-xs">
                      #{lot.id.slice(-6).toUpperCase()}
                    </Badge>
                    <SheetTitle className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      {lot.product.name}
                    </SheetTitle>
                  </div>
                </div>
                <Badge className={cn(
                  "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm border",
                  lot.status === 'SCHEDULED' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                  lot.status === 'ARRIVED' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                  lot.status === 'RECEIVED' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                  "bg-slate-500/10 text-slate-600 border-slate-500/20"
                )}>
                  {lot.status === 'SCHEDULED' ? 'Dự kiến' :
                   lot.status === 'ARRIVED' ? 'Chờ nhập' :
                   lot.status === 'RECEIVED' ? 'Trong kho' : lot.status}
                </Badge>
              </div>
              <SheetDescription className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5">
                   <Settings2 className="size-3.5 text-primary" />
                   <span className="text-foreground/80">{lot.product.sku}</span>
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span>Cập nhật: {format(new Date(lot.updatedAt), 'HH:mm - dd/MM/yyyy', { locale: vi })}</span>
                {isLoadingLot && <RefreshCw className="size-3 animate-spin text-primary ml-auto" />}
              </SheetDescription>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1. Quick Stats Card */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-xl">
                <div className="pointer-events-none absolute -right-4 -top-4 size-16 rounded-full bg-white/5 blur-2xl" />
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Trọng lượng thực tế</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-black tabular-nums tracking-tight text-white">
                    {lot.quantityKg.toLocaleString('vi-VN')}
                  </span>
                  <span className="text-sm font-bold text-slate-500 italic">kg</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="text-[10px] font-medium text-slate-500">Ban đầu:</span>
                  <span className="text-xs font-bold text-slate-400">
                    {(lot.initialWeight ?? lot.quantityKg).toLocaleString('vi-VN')} kg
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Phẩm cấp</p>
                  {!isUpcoming && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-7 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      onClick={() => setIsUpdatingGrade(true)}
                    >
                      <Edit2 className="size-3.5" />
                    </Button>
                  )}
                </div>
                <div className="mt-3">
                   <Badge className={cn(
                    "h-8 rounded-xl px-4 border-none font-black text-sm shadow-xs",
                    lot.qualityGrade === 'A' ? "bg-emerald-500 text-white shadow-emerald-200" :
                    lot.qualityGrade === 'B' ? "bg-blue-500 text-white shadow-blue-200" :
                    lot.qualityGrade === 'C' ? "bg-amber-500 text-white shadow-amber-200" :
                    "bg-rose-500 text-white shadow-rose-200"
                  )}>
                    {lot.qualityGrade === 'REJECT' ? 'REJECT' : `LOẠI ${lot.qualityGrade}`}
                  </Badge>
                </div>
              </div>
            </div>

            {/* 2. Info Sections */}
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="info">Thông tin cơ bản</TabsTrigger>
                <TabsTrigger value="timeline">Nhật ký biến động</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-4 space-y-4">
                <div className="rounded-2xl border border-primary/10 bg-card p-5 space-y-5 shadow-xs bg-gradient-to-br from-card to-primary/[0.02]">
                  <div className="flex items-start gap-4">
                    <div className="size-10 shrink-0 rounded-xl bg-primary/10 border border-primary/10 flex items-center justify-center text-primary shadow-xs">
                      <FileText className="size-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Nguồn gốc (Hợp đồng)</p>
                      {lot.contract ? (
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-foreground">{lot.contract.contractNo}</span>
                            <Badge variant="secondary" className="rounded-md bg-primary/10 text-primary border-none text-[10px] font-bold px-2 py-0">{lot.contract?.plot?.plotCode}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="font-medium text-foreground">{lot.contract.farmer?.fullName}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span>{lot.contract.plot?.zone?.name}</span>
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Không có thông tin hợp đồng</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-5 border-t border-primary/5 flex items-start gap-4">
                    <div className="size-10 shrink-0 rounded-xl bg-primary/10 border border-primary/10 flex items-center justify-center text-primary shadow-xs">
                      <MapPin className="size-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Kho lưu trữ</p>
                      <p className="text-sm font-bold text-foreground">{lot.warehouse.name}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{lot.warehouse.locationAddress || '—'}</p>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-primary/5 flex items-start gap-4">
                    <div className="size-10 shrink-0 rounded-xl bg-primary/10 border border-primary/10 flex items-center justify-center text-primary shadow-xs">
                      <Calendar className="size-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Dòng thời gian</p>
                      <div className="grid grid-cols-2 gap-6 pt-2">
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ngày thu hoạch</p>
                          <p className="text-sm font-bold text-foreground">{lot.harvestDate ? format(new Date(lot.harvestDate), 'dd/MM/yyyy') : '—'}</p>
                        </div>
                        <div className="group relative">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hạn sử dụng</p>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-rose-600">
                              {lot.expiryDate ? format(new Date(lot.expiryDate), 'dd/MM/yyyy') : '—'}
                            </p>
                            
                            {!isUpcoming && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-primary/5 text-primary"
                                onClick={() => setIsUpdatingExpiry(true)}
                              >
                                <Edit2 className="size-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="mt-4">
                <div className="rounded-2xl border bg-white overflow-hidden shadow-xs">
                  <Table>
                    <TableHeader className="bg-primary/5">
                      <TableRow className="hover:bg-transparent border-b border-primary/10">
                        <TableHead className="h-10 text-[10px] uppercase font-black text-primary tracking-wider">Biến động</TableHead>
                        <TableHead className="h-10 text-[10px] uppercase font-black text-primary tracking-wider text-right">Khối lượng</TableHead>
                        <TableHead className="h-10 text-[10px] uppercase font-black text-primary tracking-wider text-right">Thời gian</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingTimeline ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={3}><Skeleton className="h-10 w-full rounded-lg" /></TableCell>
                          </TableRow>
                        ))
                      ) : timeline?.length ? (
                        timeline.map((tx) => (
                          <TableRow key={tx.id} className="text-xs hover:bg-slate-50/50 transition-colors border-b last:border-0">
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2.5">
                                <div className={cn(
                                  "flex size-7 items-center justify-center rounded-lg shadow-xs",
                                  tx.type === 'INBOUND' ? "bg-emerald-50 text-emerald-600" :
                                  tx.type === 'OUTBOUND' ? "bg-rose-50 text-rose-600" :
                                  "bg-blue-50 text-blue-600"
                                )}>
                                  {tx.type === 'INBOUND' ? <ArrowDownLeft className="size-3.5" /> :
                                   tx.type === 'OUTBOUND' ? <ArrowUpRight className="size-3.5" /> :
                                   <ArrowRightLeft className="size-3.5" />}
                                </div>
                                <span className="font-bold text-slate-900">
                                  {tx.action === 'RECEIPT' ? 'Nhập kho' :
                                   tx.action === 'SALE' ? 'Xuất kho' :
                                   tx.action === 'INTERNAL_TRANSFER' ? 'Điều chuyển' :
                                   tx.action === 'REJECTION' ? 'Từ chối' :
                                   tx.action === 'GRADE_UPDATE' ? 'Đổi phẩm cấp' :
                                   tx.action === 'WEIGHT_ADJUST' ? 'Hiệu chỉnh' :
                                   tx.action === 'EXPIRY_UPDATE' ? 'Đổi hạn dùng' : 'Điều chỉnh'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className={cn(
                              "text-right font-black tabular-nums py-3",
                              tx.type === 'OUTBOUND' ? "text-rose-600" : "text-emerald-600"
                            )}>
                              {tx.type === 'OUTBOUND' ? '-' : '+'}{tx.quantityKg.toLocaleString('vi-VN')} kg
                            </TableCell>
                            <TableCell className="text-right text-slate-500 font-medium py-3">
                              {format(new Date(tx.createdAt), 'dd/MM/yy')}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <RefreshCw className="size-5 opacity-20" />
                              <p className="text-xs">Chưa có lịch sử biến động</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="p-6 border-t bg-slate-50/50 space-y-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
            {!isReceived && (
              <Button 
                className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-xl shadow-slate-200 transition-all active:scale-95 text-sm uppercase tracking-wider"
                onClick={() => setIsConfirmingReceipt(true)}
              >
                <CheckCircle2 className="size-5 mr-2" />
                Xác nhận nhập kho thực tế
              </Button>
            )}

            {isReceived && (
              <Button 
                className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-xl shadow-slate-200 transition-all active:scale-95 text-sm uppercase tracking-wider"
                onClick={() => setIsAdjustingWeight(true)}
              >
                <Scale className="size-5 mr-2" />
                Hiệu chỉnh tồn kho
              </Button>
            )}
            
            {isUpcoming && (
              <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                <div className="size-5 rounded-full bg-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                   <Settings2 className="size-3 text-amber-700" />
                </div>
                <p className="text-xs text-amber-800 leading-relaxed font-bold">
                  Đây là lô hàng dự kiến (Scheduled). <br/>
                  <span className="font-medium text-amber-700/80 italic">Vui lòng xác nhận nhập kho khi hàng đã về đến vị trí thực tế.</span>
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Render Dialogs ở đây để đảm bảo z-index cao hơn Drawer */}
      <QualityGradingDialog 
        lot={lot}
        isOpen={isUpdatingGrade}
        onClose={() => setIsUpdatingGrade(false)}
      />

      <ExpiryUpdateDialog 
        lot={lot}
        isOpen={isUpdatingExpiry}
        onClose={() => setIsUpdatingExpiry(false)}
      />

      <WeightAdjustmentDialog 
        lot={lot}
        isOpen={isAdjustingWeight}
        onClose={() => setIsAdjustingWeight(false)}
      />

      <ConfirmReceiptDialog
        lot={lot}
        isOpen={isConfirmingReceipt}
        onClose={() => setIsConfirmingReceipt(false)}
      />
    </>
  );
}
