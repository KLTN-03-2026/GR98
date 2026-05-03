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
import { useUpdateLot, useGetLotById, useGetLotTimeline, useConfirmReceipt } from '../api/hooks';
import { WeightAdjustmentDialog } from './WeightAdjustmentDialog';
import { QualityGradingDialog } from './QualityGradingDialog';
import { ExpiryUpdateDialog } from './ExpiryUpdateDialog';
import { ConfirmReceiptDialog } from './ConfirmReceiptDialog';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
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
  const updateLot = useUpdateLot();
  
  const [isAdjustingWeight, setIsAdjustingWeight] = React.useState(false);
  const [isUpdatingGrade, setIsUpdatingGrade] = React.useState(false);
  const [isUpdatingExpiry, setIsUpdatingExpiry] = React.useState(false);
  const [isConfirmingReceipt, setIsConfirmingReceipt] = React.useState(false);

  const lot = currentLot || initialLot;
  const isUpcoming = lot?.status === 'SCHEDULED';
  const isArrived = lot?.status === 'ARRIVED';
  const isReceived = lot?.status === 'RECEIVED';



  if (!lot) return null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(val) => !val && onClose()}>
        <SheetContent className="sm:max-w-[550px] flex flex-col gap-0 p-0">
          <SheetHeader className="p-6 border-b bg-slate-50/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex size-8 items-center justify-center rounded-lg border bg-white shadow-sm">
                <Package className="size-4 text-primary" />
              </div>
              <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider">
                Chi tiết lô hàng
              </Badge>
              <Badge className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                lot.status === 'SCHEDULED' ? "bg-blue-100 text-blue-700 border-blue-200" :
                lot.status === 'ARRIVED' ? "bg-amber-100 text-amber-700 border-amber-200" :
                lot.status === 'RECEIVED' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                "bg-slate-100 text-slate-700 border-slate-200"
              )}>
                {lot.status === 'SCHEDULED' ? 'Đơn hàng dự kiến' :
                 lot.status === 'ARRIVED' ? 'Chờ nhập kho' :
                 lot.status === 'RECEIVED' ? 'Đã nhập kho' : lot.status}
              </Badge>
              {isLoadingLot && <RefreshCw className="size-3 animate-spin text-muted-foreground" />}
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
              <div className="rounded-xl border p-4 bg-slate-900 text-white shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Khối lượng hiện tại</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tabular-nums">{lot.quantityKg.toLocaleString('vi-VN')}</span>
                    <span className="text-xs text-slate-400 font-medium">kg</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-[10px] font-medium text-slate-500">Ban đầu:</span>
                  <span className="text-xs font-bold text-slate-300">{(lot.initialWeight ?? lot.quantityKg).toLocaleString('vi-VN')} kg</span>
                </div>
              </div>
              <div className="rounded-xl border p-4 bg-white shadow-sm relative group">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Phẩm cấp</p>
                <div className="flex items-center justify-between">
                  <Badge className={cn(
                    "rounded-lg px-2.5 py-0.5 border-none font-bold text-xs",
                    lot.qualityGrade === 'A' ? "bg-emerald-500 text-white" :
                    lot.qualityGrade === 'B' ? "bg-blue-500 text-white" :
                    lot.qualityGrade === 'C' ? "bg-amber-500 text-white" :
                    "bg-rose-500 text-white"
                  )}>
                    {lot.qualityGrade === 'REJECT' ? 'REJECT' : `Loại ${lot.qualityGrade}`}
                  </Badge>
                  
                  {!isUpcoming && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 rounded-md hover:bg-slate-100 transition-colors"
                      onClick={() => setIsUpdatingGrade(true)}
                    >
                      <Edit2 className="size-3 text-slate-400" />
                    </Button>
                  )}
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
                            <Badge variant="secondary" className="text-[10px]">{lot.contract?.plot?.plotCode}</Badge>
                          </div>
                          <p className="text-sm text-slate-600">
                            {lot.contract.farmer?.fullName} • {lot.contract.plot?.zone?.name}
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
                        <div className="group relative">
                          <p className="text-[10px] text-muted-foreground uppercase">Hết hạn</p>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-rose-600">
                              {lot.expiryDate ? format(new Date(lot.expiryDate), 'dd/MM/yyyy') : '—'}
                            </p>
                            
                            {!isUpcoming && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
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
                                {tx.type === 'INBOUND' ? <ArrowDownLeft className="size-3 text-emerald-500" /> :
                                 tx.type === 'OUTBOUND' ? <ArrowUpRight className="size-3 text-rose-500" /> :
                                 tx.action === 'INTERNAL_TRANSFER' ? <ArrowRightLeft className="size-3 text-blue-500" /> :
                                 <Settings2 className="size-3 text-amber-500" />}
                                <span className="font-medium">
                                  {tx.action === 'RECEIPT' ? 'Nhập kho' :
                                   tx.action === 'SALE' ? 'Xuất kho' :
                                   tx.action === 'INTERNAL_TRANSFER' ? 'Điều chuyển' :
                                   tx.action === 'REJECTION' ? 'Từ chối' :
                                   tx.action === 'GRADE_UPDATE' ? 'Đổi phẩm cấp' :
                                   tx.action === 'WEIGHT_ADJUST' ? 'Đổi trọng lượng' :
                                   tx.action === 'EXPIRY_UPDATE' ? 'Đổi hạn dùng' : 'Điều chỉnh'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className={cn(
                              "text-right font-semibold tabular-nums",
                              tx.type === 'OUTBOUND' ? "text-rose-600" : "text-emerald-600"
                            )}>
                              {tx.type === 'OUTBOUND' ? '-' : '+'}{tx.quantityKg.toLocaleString('vi-VN')}
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

          <div className="p-4 border-t bg-slate-50/50 space-y-3">
            {!isReceived && (
              <Button 
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95"
                onClick={() => setIsConfirmingReceipt(true)}
              >
                <CheckCircle2 className="size-4 mr-2" />
                Xác nhận nhập kho thực tế
              </Button>
            )}

            {isReceived && (
              <Button 
                className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-200 transition-all active:scale-95"
                onClick={() => setIsAdjustingWeight(true)}
              >
                <Scale className="size-4 mr-2" />
                Điều chỉnh khối lượng tồn kho
              </Button>
            )}
            
            {isUpcoming && (
              <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 flex items-start gap-2">
                <Settings2 className="size-3.5 text-amber-600 mt-0.5" />
                <p className="text-[11px] text-amber-700 leading-tight font-medium">
                  Đây là lô hàng dự kiến (Scheduled). Bạn có thể xác nhận nhập kho ngay nếu hàng đã về thực tế.
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
