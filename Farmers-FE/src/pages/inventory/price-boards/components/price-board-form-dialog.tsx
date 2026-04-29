import { useState, useEffect } from 'react';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PRICE_BOARD_GRADES } from './grade-badge';
import type { PriceBoardResponse } from '../api';

interface PriceBoardFormDialogProps {
  mode: 'create' | 'edit';
  initial?: PriceBoardResponse;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

const EMPTY_FORM = {
  cropType: '',
  grade: 'A',
  buyPrice: '',
  sellPrice: '',
  effectiveDate: new Date().toISOString().split('T')[0],
};

export function PriceBoardFormDialog({
  mode,
  initial,
  open: controlledOpen,
  onOpenChange,
  onSubmit,
  isLoading,
}: PriceBoardFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const isEdit = mode === 'edit';

  useEffect(() => {
    if (open) {
      if (isEdit && initial) {
        setForm({
          cropType: initial.cropType,
          grade: initial.grade,
          buyPrice: initial.buyPrice.toString(),
          sellPrice: initial.sellPrice.toString(),
          effectiveDate: initial.effectiveDate.split('T')[0],
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [open, isEdit, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const buyPrice = parseFloat(form.buyPrice);
    const sellPrice = parseFloat(form.sellPrice);

    if (isNaN(buyPrice) || buyPrice <= 0) return toast.error('Giá mua vào phải > 0');
    if (isNaN(sellPrice) || sellPrice <= 0) return toast.error('Giá bán ra phải > 0');
    if (buyPrice >= sellPrice) return toast.error('Giá bán ra phải lớn hơn giá mua vào');

    await onSubmit({
      cropType: form.cropType.trim(),
      grade: form.grade,
      buyPrice,
      sellPrice,
      effectiveDate: form.effectiveDate,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-none shadow-2xl rounded-[2rem] bg-white font-manrope">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <DialogHeader className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight line-clamp-1">
              {isEdit ? 'Cập nhật bảng giá' : 'Tạo bảng giá mới'}
            </DialogTitle>
            <DialogDescription className="text-[11px] font-medium text-slate-400 mt-1 line-clamp-2">
              {isEdit 
                ? `Chỉnh sửa thông số bảng giá cho "${initial?.cropType}"` 
                : 'Thông tin bảng giá này sẽ được áp dụng cho quy trình nhập kho và bán hàng.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 px-8 py-8">
            <div className="grid gap-2">
              <Label htmlFor="cropType" className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">Loại nông sản</Label>
              <Input
                id="cropType"
                placeholder="Ví dụ: Cam Sành, Sầu riêng..."
                value={form.cropType}
                onChange={(e) => setForm({ ...form, cropType: e.target.value })}
                required
                disabled={isLoading}
                className="h-10 rounded-xl border-slate-200 focus-visible:ring-emerald-500/10 focus-visible:border-emerald-500 font-bold"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="grade" className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">Phẩm cấp</Label>
              <Select
                value={form.grade}
                onValueChange={(v) => setForm({ ...form, grade: v })}
                disabled={isLoading}
              >
                <SelectTrigger id="grade" className="h-10 rounded-xl border-slate-200 bg-white font-bold text-xs overflow-hidden">
                  <div className="truncate">
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                  {PRICE_BOARD_GRADES.map((g) => (
                    <SelectItem key={g.value} value={g.value} className="text-xs font-bold uppercase">{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="buyPrice" className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">Giá mua vào (VNĐ/kg)</Label>
                <Input
                  id="buyPrice"
                  type="number"
                  value={form.buyPrice}
                  onChange={(e) => setForm({ ...form, buyPrice: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-10 rounded-xl border-slate-200 focus-visible:ring-emerald-500/10 focus-visible:border-emerald-500 font-bold tabular-nums"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sellPrice" className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">Giá bán ra (VNĐ/kg)</Label>
                <Input
                  id="sellPrice"
                  type="number"
                  value={form.sellPrice}
                  onChange={(e) => setForm({ ...form, sellPrice: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-10 rounded-xl border-slate-200 focus-visible:ring-emerald-500/10 focus-visible:border-emerald-500 font-bold tabular-nums"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="effectiveDate" className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">Ngày hiệu lực</Label>
              <div className="relative">
                <Input
                  id="effectiveDate"
                  type="date"
                  value={form.effectiveDate}
                  onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                  className="h-10 rounded-xl border-slate-200 pl-10 focus-visible:ring-emerald-500/10 focus-visible:border-emerald-500 font-bold"
                  required
                  disabled={isLoading}
                />
                <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-300" />
              </div>
            </div>
          </div>

          <DialogFooter className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setOpen(false)} 
              disabled={isLoading}
              className="rounded-full h-10 px-8 font-bold text-slate-400 hover:bg-slate-100 uppercase tracking-wider text-[10px]"
            >
              Hủy bỏ
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="rounded-full h-10 px-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xl shadow-emerald-500/20 transition-all text-sm"
            >
              {isLoading ? 'Đang xử lý...' : (isEdit ? 'LƯU THAY ĐỔI' : 'TẠO BẢNG GIÁ')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
