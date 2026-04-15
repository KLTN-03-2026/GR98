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
      <DialogTrigger asChild>
        {!isEdit && (
          <Button className="h-10 px-4 font-semibold">
            <Plus className="size-4 mr-2" />
            Thêm bảng giá
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? 'Cập nhật bảng giá' : 'Tạo bảng giá mới'}
            </DialogTitle>
            <DialogDescription>
              {isEdit 
                ? `Chỉnh sửa thông số bảng giá cho "${initial?.cropType}"` 
                : 'Thông tin bảng giá này sẽ được áp dụng cho quy trình nhập kho và bán hàng.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-6">
            <div className="grid gap-2">
              <Label htmlFor="cropType">Loại nông sản</Label>
              <Input
                id="cropType"
                placeholder="Ví dụ: Cam Sành, Sầu riêng..."
                value={form.cropType}
                onChange={(e) => setForm({ ...form, cropType: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="grade">Phẩm cấp</Label>
              <Select
                value={form.grade}
                onValueChange={(v) => setForm({ ...form, grade: v })}
                disabled={isLoading}
              >
                <SelectTrigger id="grade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_BOARD_GRADES.map((g) => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="buyPrice">Giá mua vào (VNĐ/kg)</Label>
                <Input
                  id="buyPrice"
                  type="number"
                  value={form.buyPrice}
                  onChange={(e) => setForm({ ...form, buyPrice: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sellPrice">Giá bán ra (VNĐ/kg)</Label>
                <Input
                  id="sellPrice"
                  type="number"
                  value={form.sellPrice}
                  onChange={(e) => setForm({ ...form, sellPrice: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="effectiveDate">Ngày hiệu lực</Label>
              <div className="relative">
                <Input
                  id="effectiveDate"
                  type="date"
                  value={form.effectiveDate}
                  onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                  className="pl-9"
                  required
                  disabled={isLoading}
                />
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : (isEdit ? 'Lưu thay đổi' : 'Tạo bảng giá')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
