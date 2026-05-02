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
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, AlertCircle, Save, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { InventoryLot } from '../api/types';
import { useUpdateLot } from '../api/hooks';
import { toast } from 'sonner';

interface ExpiryUpdateDialogProps {
  lot: InventoryLot;
  isOpen: boolean;
  onClose: () => void;
}

export function ExpiryUpdateDialog({ lot, isOpen, onClose }: ExpiryUpdateDialogProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    lot.expiryDate ? new Date(lot.expiryDate) : undefined
  );
  const [reason, setReason] = React.useState('');
  const updateLot = useUpdateLot();

  const handleSave = async () => {
    if (!date) {
      toast.error('Vui lòng chọn ngày hết hạn');
      return;
    }
    
    // Kiểm tra logic cơ bản ở FE
    if (lot.harvestDate && date < new Date(lot.harvestDate)) {
      toast.error('Ngày hết hạn không thể trước ngày thu hoạch');
      return;
    }

    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do thay đổi hạn dùng');
      return;
    }

    try {
      await updateLot.mutateAsync({
        id: lot.id,
        data: {
          expiryDate: date.toISOString(),
          reason: reason.trim(),
        },
      });
      toast.success('Cập nhật hạn dùng thành công');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl z-[1301]">
        <DialogHeader className="p-6 bg-slate-900 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <CalendarIcon className="size-6 text-rose-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">Cập nhật hạn dùng</DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                Mã lô: #{lot.id.slice(-6).toUpperCase()} • {lot.product.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Timeline Comparison */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hiện tại</p>
              <p className="text-sm font-bold text-slate-600">
                {lot.expiryDate ? format(new Date(lot.expiryDate), 'dd/MM/yyyy') : 'Chưa có'}
              </p>
            </div>
            <ArrowRight className="size-4 text-slate-300" />
            <div className="space-y-1 text-right">
              <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Hạn dùng mới</p>
              <p className="text-sm font-bold text-rose-600">
                {date ? format(date, 'dd/MM/yyyy') : 'Chọn ngày...'}
              </p>
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chọn ngày hết hạn mới</Label>
            <Popover modal={false}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 rounded-xl justify-start text-left font-bold border-slate-200",
                    !date && "text-muted-foreground font-normal"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-rose-500" />
                  {date ? format(date, 'dd MMMM, yyyy', { locale: vi }) : <span>Chọn ngày hết hạn...</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[1400]" align="start">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(d) => lot.harvestDate ? d < new Date(lot.harvestDate) : false}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Reason Input */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              Lý do thay đổi <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              placeholder="Ví dụ: Kết quả kiểm định lại cho thấy sản phẩm còn tươi tốt..."
              className="min-h-[100px] rounded-xl border-slate-200 focus:border-slate-900 focus:ring-slate-900 transition-all resize-none"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
              <AlertCircle className="size-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-[10px] text-amber-700 leading-normal italic">
                Lưu ý: Ngày hết hạn ảnh hưởng đến tính an toàn và khả năng xuất kho. Mọi thay đổi sẽ được lưu nhật ký.
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
            disabled={updateLot.isPending}
            className="flex-[2] h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-200 transition-all active:scale-95"
          >
            {updateLot.isPending ? 'Đang lưu...' : 'Xác nhận cập nhật'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
