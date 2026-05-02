import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useConfirmReceipt } from '../api/hooks';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { InventoryLot } from '../api/types';
import { cn } from '@/lib/utils';

interface ConfirmReceiptDialogProps {
  lot: InventoryLot;
  isOpen: boolean;
  onClose: () => void;
}

interface FormValues {
  actualWeight: number;
  note: string;
}

export function ConfirmReceiptDialog({ lot, isOpen, onClose }: ConfirmReceiptDialogProps) {
  const confirmMutation = useConfirmReceipt();

  const form = useForm<FormValues>({
    defaultValues: {
      actualWeight: lot.quantityKg,
      note: '',
    },
  });

  const enteredWeight = form.watch('actualWeight');
  const deviation = lot.quantityKg > 0 ? (enteredWeight - lot.quantityKg) : 0;
  const deviationPercent = lot.quantityKg > 0 ? (Math.abs(deviation) / lot.quantityKg) * 100 : 0;

  useEffect(() => {
    if (isOpen) {
      form.reset({
        actualWeight: lot.quantityKg,
        note: '',
      });
    }
  }, [isOpen, lot.quantityKg, form]);

  const onSubmit = (values: FormValues) => {
    confirmMutation.mutate({
      lotId: lot.id,
      actualWeight: values.actualWeight,
      note: values.note,
    }, {
      onSuccess: () => {
        toast.success('Xác nhận nhập kho thành công');
        onClose();
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Có lỗi xảy ra khi xác nhận');
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <CheckCircle2 className="size-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Xác nhận nhập kho</span>
          </div>
          <DialogTitle className="text-xl font-bold">Hoàn tất quy trình nhập hàng</DialogTitle>
        </DialogHeader>

        <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 mb-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground font-medium">Khối lượng dự kiến:</span>
            <span className="font-bold text-slate-900">{lot.quantityKg.toLocaleString('vi-VN')} kg</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="actualWeight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Khối lượng thực nhập (kg)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="h-12 text-xl font-bold pr-12 focus:ring-emerald-500 border-emerald-100"
                        autoFocus
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                        KG
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                  
                  {deviation !== 0 && (
                    <div className={cn(
                      "flex items-center gap-2 p-2 rounded-lg text-xs mt-2",
                      deviationPercent > 5 ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    )}>
                      {deviationPercent > 5 ? <AlertTriangle className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
                      <span>
                        Chênh lệch: {deviation > 0 ? '+' : ''}{deviation.toFixed(1)} kg 
                        ({deviationPercent.toFixed(1)}%) {deviationPercent > 5 && '— Vui lòng nhập lý do giải trình'}
                      </span>
                    </div>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">
                    Ghi chú nhập kho
                    {deviationPercent > 5 && <span className="text-rose-500 ml-1">*</span>}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Ghi chú về tình trạng hàng hóa, lý do chênh lệch (nếu có)..."
                      className="min-h-[100px] resize-none"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={confirmMutation.isPending || (deviationPercent > 5 && !form.watch('note').trim())}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 rounded-xl"
              >
                {confirmMutation.isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
                Xác nhận nhập kho
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
