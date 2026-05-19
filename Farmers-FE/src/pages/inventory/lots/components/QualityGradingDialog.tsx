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
import { ShieldCheck, AlertCircle, Save } from 'lucide-react';
import type { InventoryLot, QualityGrade } from '../api/types';
import { useUpdateLot } from '../api/hooks';
import {
  getGradeLabel,
  normalizeGrade,
} from '@/pages/inventory/price-boards/components/grade-badge';
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

  // Tự động ghi giá trị cập nhật vào note (dùng label tiếng Việt thay vì A/B/C)
  React.useEffect(() => {
    if (selectedGrade !== lot.qualityGrade) {
      const fromLabel = getGradeLabel(lot.qualityGrade);
      const toLabel = getGradeLabel(selectedGrade);
      const prefix = `[CẬP NHẬT PHẨM CẤP] Từ ${fromLabel} -> ${toLabel}. Lý do: `;
      setReason(prev => {
        const userText = prev.replace(/^\[CẬP NHẬT PHẨM CẤP\] Từ .*? -> .*?\. Lý do: /, '');
        return prefix + userText;
      });
    } else {
      setReason(prev => prev.replace(/^\[CẬP NHẬT PHẨM CẤP\] Từ .*? -> .*?\. Lý do: /, ''));
    }
  }, [selectedGrade, lot.qualityGrade]);

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

  // Unified grade system — PREMIUM / STANDARD / ECONOMY (+ REJECT khi chưa nhận kho)
  const grades: QualityGrade[] = (lot.status === 'RECEIVED' || lot.status === 'ARRIVED')
    ? ['PREMIUM', 'STANDARD', 'ECONOMY']
    : ['PREMIUM', 'STANDARD', 'ECONOMY', 'REJECT'];

  // Product status: DRAFT = sync grade theo Lot khi save; còn lại = snapshot frozen.
  // Nếu BE chưa trả status → assume PUBLISHED (an toàn — không tự nhận sync).
  const productStatus = lot.product?.status ?? 'PUBLISHED';
  const willSyncProduct = productStatus === 'DRAFT';

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
                {getGradeLabel(lot.qualityGrade)}
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
                normalizeGrade(selectedGrade) === 'PREMIUM'  ? "bg-emerald-500" :
                normalizeGrade(selectedGrade) === 'STANDARD' ? "bg-blue-500" :
                normalizeGrade(selectedGrade) === 'ECONOMY'  ? "bg-amber-500" :
                "bg-rose-500"
              )}>
                {getGradeLabel(selectedGrade)}
              </Badge>
            </div>
          </div>

          {/* Grade Selection */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chọn phẩm cấp mới</Label>
            <div className={cn("grid gap-2", grades.length === 4 ? "grid-cols-4" : "grid-cols-3")}>
              {grades.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGrade(g)}
                  className={cn(
                    "relative h-12 rounded-xl border-2 transition-all flex items-center justify-center font-bold text-xs px-1",
                    selectedGrade === g
                      ? "border-slate-900 bg-slate-900 text-white ring-4 ring-slate-100"
                      : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                  )}
                >
                  {getGradeLabel(g)}
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
                Lưu ý: Thay đổi phẩm cấp sẽ được ghi lại trong nhật ký biến động của lô hàng để phục vụ truy xuất nguồn gốc. Hệ thống đã tự động điền giá trị thay đổi vào phần ghi chú.
              </p>
            </div>
          </div>

          {/* Banner thông báo sync vs frozen */}
          {willSyncProduct ? (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <ShieldCheck className="size-4 text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-[11px] text-emerald-800 leading-normal">
                Sản phẩm liên kết đang ở trạng thái <strong>Nháp</strong> — phẩm cấp sản phẩm sẽ tự động đồng bộ theo lô sau khi lưu.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <AlertCircle className="size-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-[11px] text-blue-800 leading-normal">
                Sản phẩm liên kết <strong>đã đăng bán / đóng gói</strong> — phẩm cấp sản phẩm sẽ <strong>giữ nguyên</strong> để tránh sai lệch nhãn hàng hoá. Chỉ phẩm cấp <strong>lô hàng</strong> được cập nhật để theo dõi nội bộ.
              </p>
            </div>
          )}

          {selectedGrade === lot.qualityGrade && (
            <div className="text-center p-2 rounded-lg bg-rose-50 border border-rose-100">
              <p className="text-xs font-semibold text-rose-600">
                ⚠️ Vui lòng chọn một phẩm cấp khác với phẩm cấp hiện tại để cập nhật.
              </p>
            </div>
          )}
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
