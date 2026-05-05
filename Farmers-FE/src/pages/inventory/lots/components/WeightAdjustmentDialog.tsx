import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Scale } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { InventoryLot } from '../api/types';
import { useCreateTransaction } from '../api/hooks';
import { toast } from 'sonner';

interface WeightAdjustmentDialogProps {
  lot: InventoryLot | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WeightAdjustmentDialog({ lot, isOpen, onClose }: WeightAdjustmentDialogProps) {
  const [newWeight, setNewWeight] = useState<string>('');
  const [justification, setJustification] = useState<string>('');
  
  const createTransaction = useCreateTransaction();

  const currentWeight = lot?.quantityKg || 0;
  
  const { deviation, isLargeDeviation, delta } = useMemo(() => {
    if (!newWeight || isNaN(parseFloat(newWeight))) {
      return { deviation: 0, isLargeDeviation: false, delta: 0 };
    }
    const val = parseFloat(newWeight);
    const diff = val - currentWeight;
    const dev = Math.abs(diff) / (currentWeight || 1);
    return {
      deviation: dev * 100,
      isLargeDeviation: dev > 0.05,
      delta: diff
    };
  }, [newWeight, currentWeight]);

  // Extract user's actual justification without the auto prefix
  const userJustification = justification.replace(/^\[ĐIỀU CHỈNH KHỐI LƯỢNG\] Từ .*? kg -> .*? kg\. Lý do: /, '').trim();

  // Tự động ghi giá trị cập nhật vào note
  React.useEffect(() => {
    if (newWeight && !isNaN(parseFloat(newWeight)) && delta !== 0) {
      const prefix = `[ĐIỀU CHỈNH KHỐI LƯỢNG] Từ ${currentWeight.toLocaleString('vi-VN')} kg -> ${parseFloat(newWeight).toLocaleString('vi-VN')} kg. Lý do: `;
      setJustification(prev => {
        const userText = prev.replace(/^\[ĐIỀU CHỈNH KHỐI LƯỢNG\] Từ .*? kg -> .*? kg\. Lý do: /, '');
        return prefix + userText;
      });
    } else {
      setJustification(prev => prev.replace(/^\[ĐIỀU CHỈNH KHỐI LƯỢNG\] Từ .*? kg -> .*? kg\. Lý do: /, ''));
    }
  }, [newWeight, currentWeight, delta]);

  const handleSubmit = async () => {
    if (!lot || !newWeight) return;
    
    if (delta === 0) {
      toast.error('Khối lượng mới phải khác khối lượng hiện tại');
      return;
    }
    
    if (isLargeDeviation && !userJustification) {
      toast.error('Vui lòng nhập lý do giải trình cho độ lệch lớn (>5%)');
      return;
    }

    try {
      await createTransaction.mutateAsync({
        warehouseId: lot.warehouseId,
        productId: lot.productId,
        inventoryLotId: lot.id,
        type: 'ADJUSTMENT',
        quantityKg: parseFloat(newWeight),
        note: justification,
      });
      toast.success('Điều chỉnh khối lượng thành công');
      onClose();
      setNewWeight('');
      setJustification('');
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi điều chỉnh khối lượng');
    }
  };

  if (!lot) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                <Scale className="size-5 text-emerald-400" />
              </div>
              <DialogTitle className="text-xl font-bold">Điều chỉnh khối lượng</DialogTitle>
            </div>
            <DialogDescription className="text-slate-400 text-sm">
              Cập nhật số liệu thực tế cho lô hàng <span className="text-emerald-400 font-mono">#{lot.id.slice(-6).toUpperCase()}</span> — {lot.product?.name}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 bg-white">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <Label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Hiện tại</Label>
              <p className="text-xl font-black text-slate-900 mt-1">{currentWeight.toLocaleString('vi-VN')} <span className="text-xs font-medium text-slate-400">kg</span></p>
            </div>
            <div className={cn(
              "p-4 rounded-2xl border transition-all duration-300",
              isLargeDeviation ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100"
            )}>
              <Label className={cn(
                "text-[10px] uppercase tracking-widest font-bold",
                isLargeDeviation ? "text-rose-400" : "text-emerald-400"
              )}>Biến động</Label>
              <p className={cn(
                "text-xl font-black mt-1",
                isLargeDeviation ? "text-rose-600" : "text-emerald-600"
              )}>
                {delta > 0 ? '+' : ''}{delta.toLocaleString('vi-VN')} <span className="text-xs font-medium opacity-70">kg</span>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newWeight" className="text-sm font-bold text-slate-700">Khối lượng thực tế mới (kg)</Label>
              <div className="relative">
                <Input
                  id="newWeight"
                  type="number"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="Nhập số cân thực tế..."
                  className="h-12 rounded-xl border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500 pl-4 text-lg font-bold"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                   <Badge className={cn(
                     "font-bold",
                     isLargeDeviation ? "bg-rose-100 text-rose-700 border-rose-200" : "bg-emerald-100 text-emerald-700 border-emerald-200"
                   )}>
                     {deviation.toFixed(1)}%
                   </Badge>
                </div>
              </div>
            </div>

            {isLargeDeviation && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 animate-in zoom-in-95 duration-300">
                <div className="flex gap-3">
                  <AlertTriangle className="size-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-rose-700">Cảnh báo độ lệch lớn</p>
                    <p className="text-xs text-rose-600 leading-relaxed">
                      Khối lượng thay đổi vượt quá 5%. Hệ thống yêu cầu giải trình lý do cho biến động này.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {newWeight && !isNaN(parseFloat(newWeight)) && delta === 0 && (
              <div className="text-center p-2 rounded-lg bg-rose-50 border border-rose-100">
                <p className="text-xs font-semibold text-rose-600">
                  ⚠️ Khối lượng mới đang bằng với khối lượng hiện tại. Vui lòng nhập số khác.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="justification" className="text-sm font-bold text-slate-700">
                Lý do giải trình {isLargeDeviation && <span className="text-rose-500">*</span>}
              </Label>
              <Textarea
                id="justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Nhập lý do (ví dụ: hao hụt tự nhiên, sai lệch cân, hàng hỏng...)"
                className="rounded-xl border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[100px] resize-none"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-0 bg-white">
          <div className="flex w-full gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 h-12 rounded-xl font-bold text-slate-600">
              Hủy bỏ
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!newWeight || delta === 0 || createTransaction.isPending || (isLargeDeviation && !userJustification)}
              className="flex-[2] h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xl shadow-slate-200 transition-all active:scale-95"
            >
              {createTransaction.isPending ? 'Đang lưu...' : 'Xác nhận cập nhật'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn("px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider", className)}>
      {children}
    </span>
  );
}
