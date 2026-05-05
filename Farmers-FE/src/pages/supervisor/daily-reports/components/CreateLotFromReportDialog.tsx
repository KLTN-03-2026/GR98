import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { lotApi } from '@/pages/inventory/lots/api/api';
import type { DailyReportResponse } from '@/pages/admin/daily-reports/api/types';
import { Loader2, Warehouse, Weight, BadgeCheck } from 'lucide-react';
import { extractData } from '@/client/lib/api-client';
import type { InventoryLot } from '@/pages/inventory/lots/api/types';

interface CreateLotFromReportDialogProps {
  report: DailyReportResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateLotFromReportDialog: React.FC<CreateLotFromReportDialogProps> = ({
  report,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [actualWeight, setActualWeight] = useState('');
  const [note, setNote] = useState('');
  const [remainingBalance, setRemainingBalance] = useState<number | null>(null);

  // Get active contract from report - Memoize to prevent effect loops
  const activeContract = React.useMemo(() => report?.plot?.contracts?.[0], [report]);

  useEffect(() => {
    console.log('Dialog Effect - Open:', open, 'Report:', report?.id, 'Contract:', activeContract?.id);
    if (open) {
      loadWarehouses();
      if (activeContract) {
        loadRemainingBalance();
      }
      if (report?.yieldEstimateKg) {
        setActualWeight(report.yieldEstimateKg.toString());
      }
    } else {
      setWarehouseId('');
      setNote('');
      setRemainingBalance(null);
    }
  }, [open, activeContract, report]);

  const loadWarehouses = async () => {
    try {
      const res = await lotApi.getWarehouses();
      setWarehouses(extractData(res));
    } catch (error) {
      console.error('Failed to load warehouses', error);
    }
  };

  const loadRemainingBalance = async () => {
    if (!activeContract) return;
    try {
      // Sum up existing lots for this contract
      const res = await lotApi.getLots({ contractId: activeContract.id });
      const lots = extractData<InventoryLot[]>(res);
      const totalIssued = lots.reduce((sum, lot) => sum + (lot.status !== 'REJECTED' ? lot.quantityKg : 0), 0);
      const remaining = (report?.yieldEstimateKg || 0) - totalIssued;
      setRemainingBalance(remaining > 0 ? remaining : 0);
      
      // Auto-set weight to remaining if it's less than original estimate
      if (remaining < (report?.yieldEstimateKg || 0)) {
         setActualWeight(remaining.toFixed(2));
      }
    } catch (error) {
      console.error('Failed to load balance', error);
    }
  };

  const handleSubmit = async () => {
    if (!report || !activeContract) return;
    if (!warehouseId) {
      toast.error('Vui lòng chọn kho hàng');
      return;
    }
    const weight = Number(actualWeight);
    if (isNaN(weight) || weight <= 0) {
      toast.error('Số lượng không hợp lệ');
      return;
    }

    if (remainingBalance !== null && weight > remainingBalance + 0.1) {
      toast.error(`Số lượng vượt quá sản lượng còn lại (${remainingBalance.toFixed(2)}kg)`);
      return;
    }

    setLoading(true);
    try {
      await lotApi.receiveHarvest({
        dailyReportId: report.id,
        contractId: activeContract.id,
        warehouseId,
        actualWeight: weight,
        qualityGrade: activeContract.grade,
        note: note.trim() || 'Xuất lô hàng từ báo cáo thu hoạch',
      });
      toast.success('Đã tạo lô hàng thành công');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể tạo lô hàng');
    } finally {
      setLoading(false);
    }
  };

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 gap-0 border-none shadow-2xl">
        {!activeContract ? (
          <div className="py-12 text-center space-y-4 px-6">
             <div className="mx-auto size-12 rounded-full bg-slate-100 flex items-center justify-center">
                <Warehouse className="h-6 w-6 text-slate-400" />
             </div>
             <div className="space-y-1">
               <p className="font-semibold text-slate-900">Thiếu thông tin hợp đồng</p>
               <p className="text-sm text-slate-500 leading-relaxed">
                 Lô đất này không có hợp đồng đang hoạt động.<br/>
                 Vui lòng kiểm tra lại trước khi tạo lô hàng.
               </p>
             </div>
             <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Đóng</Button>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-orange-600 to-orange-500 p-6 text-white">
              <DialogHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Warehouse className="h-4 w-4 text-white" />
                  </div>
                  <DialogTitle className="text-xl font-bold">Xuất lô hàng nhập kho</DialogTitle>
                </div>
                <DialogDescription className="text-orange-50 text-sm opacity-90 truncate">
                  Lô đất: {report.plot.plotCode} — {report.plot.farmer?.fullName || 'Nông dân'}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-5 bg-white">
              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase mb-1">
                    <Weight className="h-3 w-3" /> Tổng thu hoạch
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {(report.yieldEstimateKg ?? 0).toLocaleString()} <span className="text-xs font-normal opacity-60">kg</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 uppercase mb-1">
                    <BadgeCheck className="h-3 w-3" /> Còn lại khả dụng
                  </div>
                  <div className="text-lg font-bold text-emerald-900">
                    {remainingBalance !== null ? remainingBalance.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '...'} <span className="text-xs font-normal opacity-60">kg</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pb-2 border-b border-slate-100">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thông tin sản phẩm</Label>
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5 max-w-[70%]">
                    <p className="font-bold text-slate-900 truncate">{activeContract.product.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">HĐ: {activeContract.contractNo}</p>
                  </div>
                  <div className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase">
                    Hạng {activeContract.grade}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="warehouse" className="text-sm font-bold text-slate-700">Chọn Kho hàng nhận</Label>
                <Select 
                  value={warehouseId || undefined} 
                  onValueChange={(val) => {
                    console.log('Select onValueChange:', val);
                    setWarehouseId(val);
                  }}
                  onOpenChange={(isOpen) => {
                    console.log('Select onOpenChange:', isOpen, 'Current warehouses:', warehouses.length);
                  }}
                >
                  <SelectTrigger id="warehouse" className="h-12 rounded-xl border-slate-200">
                    <SelectValue placeholder={warehouses.length > 0 ? "Chọn kho hàng..." : "Đang tải hoặc không có kho..."} />
                  </SelectTrigger>
                  <SelectContent className="max-w-[calc(var(--radix-select-trigger-width))]">
                    {warehouses.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground text-center italic">
                        Không tìm thấy kho hàng nào
                      </div>
                    ) : (
                      warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id} className="focus:bg-slate-50 py-2.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-slate-900">{w.name}</span>
                            {w.locationAddress && (
                              <span className="text-[10px] text-slate-400 truncate max-w-[280px]">
                                {w.locationAddress}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-sm font-bold text-slate-700">Khối lượng (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="Nhập số kg..."
                    value={actualWeight}
                    onChange={(e) => setActualWeight(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note" className="text-sm font-bold text-slate-700">Ghi chú vận chuyển</Label>
                  <Input
                    id="note"
                    placeholder="Biển số, tài xế..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>
              </div>

              {remainingBalance !== null && (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 italic">
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Sản lượng còn lại khả dụng: <strong>{remainingBalance.toLocaleString()} kg</strong></span>
                </div>
              )}
            </div>

            <DialogFooter className="p-6 pt-0 bg-white">
              <div className="flex w-full gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)} 
                  disabled={loading}
                  className="flex-1 h-12 rounded-xl font-bold text-slate-600"
                >
                  Hủy bỏ
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading || !warehouseId || Number(actualWeight) <= 0}
                  className="flex-[2] h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xl shadow-slate-200 transition-all active:scale-95"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Xác nhận tạo lô
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
