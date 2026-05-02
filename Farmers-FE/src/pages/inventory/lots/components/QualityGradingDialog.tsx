import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ShieldCheck, AlertCircle, Save, X } from 'lucide-react';
import type { InventoryLot, QualityGrade } from '../api/types';
import { useUpdateLot } from '../api/hooks';
import { toast } from 'sonner';

interface QualityGradingDialogProps {
  lot: InventoryLot;
  isOpen: boolean;
  onClose: () => void;
}

export function QualityGradingDialog({ lot, isOpen, onClose }: QualityGradingDialogProps) {
  const [selectedGrade, setSelectedGrade] = React.useState<QualityGrade>(lot.qualityGrade);
  const [reason, setReason] = React.useState('');
  const updateLot = useUpdateLot();

  const handleSave = async () => {
    if (selectedGrade === lot.qualityGrade) {
      toast.error('Vui lòng chọn phẩm cấp khác với phẩm cấp hiện tại');
      return;
    }
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do thay đổi phẩm cấp');
      return;
    }

    try {
      await updateLot.mutateAsync({
        id: lot.id,
        data: {
          qualityGrade: selectedGrade,
          reason: reason.trim(),
        },
      });
      toast.success('Cập nhật phẩm cấp thành công');
      onClose();
    } catch (error) {
      toast.error('Cập nhật thất bại, vui lòng thử lại');
    }
  };

  const grades: QualityGrade[] = lot.status === 'RECEIVED' 
    ? ['A', 'B', 'C'] 
    : ['A', 'B', 'C', 'REJECT'];

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 bg-slate-900 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <ShieldCheck className="size-6 text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">Cập nhật phẩm cấp</DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                Mã lô: #{lot.id.slice(-6).toUpperCase()} • {lot.product.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Current vs New Comparison */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-center space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hiện tại</p>
              <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 font-bold">
                Loại {lot.qualityGrade}
              </Badge>
            </div>
            <div className="h-px flex-1 mx-4 bg-slate-200 relative">
              <div className="absolute inset-0 flex items-center justify-center -top-3">
                <div className="size-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  <Save className="size-3 text-slate-400" />
                </div>
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Phẩm cấp mới</p>
              <Badge className={cn(
                "font-bold shadow-sm",
                selectedGrade === 'A' ? "bg-emerald-500" :
                selectedGrade === 'B' ? "bg-blue-500" :
                selectedGrade === 'C' ? "bg-amber-500" :
                "bg-rose-500"
              )}>
                {selectedGrade === 'REJECT' ? 'REJECT' : `Loại ${selectedGrade}`}
              </Badge>
            </div>
          </div>

          {/* Grade Selection */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chọn phẩm cấp mới</Label>
            <div className="grid grid-cols-4 gap-2">
              {grades.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGrade(g)}
                  className={cn(
                    "relative h-12 rounded-xl border-2 transition-all flex items-center justify-center font-bold text-sm",
                    selectedGrade === g 
                      ? "border-slate-900 bg-slate-900 text-white ring-4 ring-slate-100" 
                      : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              Lý do thay đổi <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              placeholder="Ví dụ: Kết quả kiểm định chất lượng định kỳ ngày 02/05..."
              className="min-h-[100px] rounded-xl border-slate-200 focus:border-slate-900 focus:ring-slate-900 transition-all resize-none"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
              <AlertCircle className="size-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-[10px] text-amber-700 leading-normal italic">
                Lưu ý: Thay đổi phẩm cấp sẽ được ghi lại trong nhật ký biến động của lô hàng để phục vụ truy xuất nguồn gốc.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t flex gap-3 sm:gap-0">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-100"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateLot.isPending || selectedGrade === lot.qualityGrade}
            className="flex-1 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-200 transition-all active:scale-95"
          >
            {updateLot.isPending ? 'Đang cập nhật...' : 'Xác nhận thay đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
