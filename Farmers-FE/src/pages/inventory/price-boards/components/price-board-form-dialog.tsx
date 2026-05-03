import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Coins, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PRICE_BOARD_GRADES } from './grade-badge';
import type { PriceBoardResponse } from '../api';

interface PriceBoardFormDrawerProps {
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

export function PriceBoardFormDrawer({
  mode,
  initial,
  open: controlledOpen,
  onOpenChange,
  onSubmit,
  isLoading,
}: PriceBoardFormDrawerProps) {
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="sm:max-w-[480px] p-0 flex flex-col font-manrope">
        <SheetHeader className="p-6 border-b border-slate-100 flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-primary/12 bg-primary/8 text-primary shadow-sm">
                <Coins className="size-5" />
            </div>
            <div>
                <SheetTitle className="text-xl font-bold tracking-tight">
                    {isEdit ? 'Cập nhật bảng giá' : 'Tạo bảng giá mới'}
                </SheetTitle>
                <SheetDescription className="text-xs font-medium text-muted-foreground mt-0.5">
                    {isEdit 
                        ? `Chỉnh sửa thông số bảng giá cho "${initial?.cropType}"` 
                        : 'Thiết lập bảng giá mua/bán cho loại nông sản mới.'}
                </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6">
            <form id="price-board-form" onSubmit={handleSubmit} className="space-y-8">
              {/* Thông tin cơ bản */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">1</div>
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Thông tin nông sản</Label>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cropType" className="text-xs font-semibold text-slate-700 ml-1">Tên loại nông sản</Label>
                    <Input
                      id="cropType"
                      placeholder="Ví dụ: Cam Sành, Sầu riêng..."
                      value={form.cropType}
                      onChange={(e) => setForm({ ...form, cropType: e.target.value })}
                      required
                      disabled={isLoading}
                      className="h-11 rounded-xl border-slate-200 focus-visible:ring-primary/10 focus-visible:border-primary font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade" className="text-xs font-semibold text-slate-700 ml-1">Phẩm cấp áp dụng</Label>
                    <Select
                      value={form.grade}
                      onValueChange={(v) => setForm({ ...form, grade: v })}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="grade" className="h-11 rounded-xl border-slate-200 bg-white font-bold text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100">
                        {PRICE_BOARD_GRADES.map((g) => (
                          <SelectItem key={g.value} value={g.value} className="text-xs font-bold uppercase">{g.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Thông tin giá */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">2</div>
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cấu hình giá (VNĐ/kg)</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyPrice" className="text-xs font-semibold text-slate-700 ml-1">Giá mua dự kiến</Label>
                    <div className="relative">
                        <Input
                            id="buyPrice"
                            type="number"
                            value={form.buyPrice}
                            onChange={(e) => setForm({ ...form, buyPrice: e.target.value })}
                            required
                            disabled={isLoading}
                            className="h-11 rounded-xl border-slate-200 pr-10 font-bold tabular-nums text-emerald-600 focus-visible:ring-emerald-500/10 focus-visible:border-emerald-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">đ</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sellPrice" className="text-xs font-semibold text-slate-700 ml-1">Giá bán niêm yết</Label>
                    <div className="relative">
                        <Input
                            id="sellPrice"
                            type="number"
                            value={form.sellPrice}
                            onChange={(e) => setForm({ ...form, sellPrice: e.target.value })}
                            required
                            disabled={isLoading}
                            className="h-11 rounded-xl border-slate-200 pr-10 font-bold tabular-nums text-primary focus-visible:ring-primary/10 focus-visible:border-primary"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">đ</span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground italic ml-1">
                    * Giá bán ra nên lớn hơn giá mua vào để đảm bảo biên lợi nhuận vận hành.
                </p>
              </div>

              {/* Hiệu lực */}
              <div className="space-y-5 pb-8">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">3</div>
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Thời gian áp dụng</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="effectiveDate" className="text-xs font-semibold text-slate-700 ml-1">Ngày bắt đầu hiệu lực</Label>
                  <div className="relative">
                    <Input
                      id="effectiveDate"
                      type="date"
                      value={form.effectiveDate}
                      onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                      className="h-11 rounded-xl border-slate-200 pl-10 font-bold"
                      required
                      disabled={isLoading}
                    />
                    <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </form>
          </div>
        </ScrollArea>

        <SheetFooter className="p-6 border-t border-slate-100 bg-slate-50/50 gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setOpen(false)} 
            disabled={isLoading}
            className="rounded-xl h-11 flex-1 border-slate-200 font-semibold"
          >
            Hủy bỏ
          </Button>
          <Button 
            type="submit"
            form="price-board-form"
            disabled={isLoading}
            className="rounded-xl h-11 flex-[2] shadow-lg shadow-primary/20 font-bold"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="size-4 animate-spin" />
                Đang lưu...
              </div>
            ) : (isEdit ? 'Lưu thay đổi' : 'Xác nhận tạo')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
