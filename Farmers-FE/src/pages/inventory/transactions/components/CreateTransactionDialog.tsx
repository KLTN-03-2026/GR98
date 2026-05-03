import React, { useMemo, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  useCreateTransaction,
  useGetTransactionWarehouses,
  useGetTransactionLots,
} from '../api/hooks';
import { toast } from 'sonner';
import {
  Loader2,
  Settings2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormValues {
  warehouseId: string;
  inventoryLotId: string;
  quantityKg: number;
  note: string;
}

export default function CreateTransactionDialog({ isOpen, onClose }: CreateTransactionDialogProps) {
  const { data: warehouses } = useGetTransactionWarehouses();
  const createMutation = useCreateTransaction();

  const form = useForm<FormValues>({
    defaultValues: {
      warehouseId: '',
      inventoryLotId: '',
      quantityKg: 0,
      note: '',
    },
  });

  const selectedWarehouseId = useWatch({ control: form.control, name: 'warehouseId' });
  const selectedLotId = useWatch({ control: form.control, name: 'inventoryLotId' });
  const enteredQty = useWatch({ control: form.control, name: 'quantityKg' });

  const { data: lots, isLoading: isLoadingLots } = useGetTransactionLots(selectedWarehouseId);
  const currentLot = useMemo(() => lots?.find((l: any) => l.id === selectedLotId), [lots, selectedLotId]);

  const adjustmentInfo = useMemo(() => {
    if (!currentLot) return null;
    const currentBalance = currentLot.quantityKg || 0;
    const delta = (enteredQty || 0) - currentBalance;
    const deviation = currentBalance > 0 ? Math.abs(delta) / currentBalance : 0;
    return { currentBalance, delta, deviation };
  }, [currentLot, enteredQty]);

  // Auto-generate note based on weight changes
  useEffect(() => {
    if (adjustmentInfo && adjustmentInfo.delta !== 0) {
      const prefix = `[ĐIỀU CHỈNH KHỐI LƯỢNG] Từ ${adjustmentInfo.currentBalance.toLocaleString('vi-VN')} kg -> ${enteredQty.toLocaleString('vi-VN')} kg.`;
      const currentNote = form.getValues('note') || '';
      
      // Clean up old prefix to prevent duplication
      const cleanedNote = currentNote.replace(/\[ĐIỀU CHỈNH KHỐI LƯỢNG\] Từ [\d.,]+ kg -> [\d.,]+ kg\.\s*/g, '').trim();
      
      // If user typed something, keep it after the prefix
      if (cleanedNote) {
        form.setValue('note', `${prefix} Lý do: ${cleanedNote.replace(/^Lý do:\s*/, '')}`, { shouldValidate: true });
      } else {
        form.setValue('note', prefix, { shouldValidate: true });
      }
    }
  }, [adjustmentInfo?.delta, enteredQty, form]);

  const onSubmit = (values: FormValues) => {
    if (!currentLot) {
      toast.error('Vui lòng chọn lô hàng');
      return;
    }

    if (adjustmentInfo?.delta === 0) {
      toast.error('Khối lượng mới phải khác khối lượng hiện tại');
      return;
    }

    if (adjustmentInfo && adjustmentInfo.deviation > 0.05) {
      const hasReason = values.note && values.note.includes('Lý do:');
      if (!hasReason || values.note.split('Lý do:')[1].trim().length < 5) {
        toast.error('Khối lượng lệch > 5%. Vui lòng nhập chi tiết lý do giải trình sau phần "Lý do:".');
        return;
      }
    }

    const payload: any = {
      warehouseId: values.warehouseId,
      inventoryLotId: values.inventoryLotId,
      productId: currentLot.productId,
      quantityKg: parseFloat(String(values.quantityKg)),
      note: values.note,
      type: 'ADJUSTMENT',
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Điều chỉnh tồn kho thành công');
        form.reset();
        onClose();
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.error?.message || error?.message || 'Có lỗi xảy ra';
        toast.error(errorMessage);
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Settings2 className="size-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Nghiệp vụ kho</span>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Điều chỉnh tồn kho
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Kho thực hiện */}
            <FormField
              control={form.control}
              name="warehouseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Kho thực hiện</FormLabel>
                  <Select onValueChange={(val) => {
                    field.onChange(val);
                    form.setValue('inventoryLotId', '');
                  }} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Chọn kho..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {warehouses?.map((w: any) => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* Lô hàng */}
            <FormField
              control={form.control}
              name="inventoryLotId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Lô hàng định danh</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedWarehouseId || isLoadingLots}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder={isLoadingLots ? "Đang tải..." : "Chọn lô hàng..."} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lots?.map((l: any) => (
                        <SelectItem key={l.id} value={l.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Lô {l.id.slice(-6).toUpperCase()}</span>
                            <span className="text-xs text-muted-foreground">
                              {l.product?.name} — {l.quantityKg}kg
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* Số lượng */}
            <FormField
              control={form.control}
              name="quantityKg"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium">Số lượng thực tế (kg)</FormLabel>
                    {currentLot && (
                      <Badge variant="outline" className="text-xs font-medium">
                        Tồn hệ thống: {currentLot.quantityKg}kg
                      </Badge>
                    )}
                  </div>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      className="h-12 text-2xl font-bold tabular-nums"
                    />
                  </FormControl>
                  <FormMessage />

                  {/* Hiển thị chênh lệch */}
                  {adjustmentInfo && currentLot && (
                    <div className={cn(
                      "mt-2 p-3 rounded-lg text-sm",
                      adjustmentInfo.delta === 0
                        ? "bg-muted text-muted-foreground"
                        : adjustmentInfo.deviation > 0.05
                          ? "bg-destructive/10 text-destructive border border-destructive/20"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    )}>
                      {adjustmentInfo.delta === 0 ? (
                        <span>Không có chênh lệch so với hệ thống</span>
                      ) : (
                        <div className="flex items-start gap-2">
                          {adjustmentInfo.deviation > 0.05 && <AlertTriangle className="size-4 shrink-0 mt-0.5" />}
                          <div>
                            <div className="font-medium">
                              Chênh lệch: {adjustmentInfo.delta > 0 ? '+' : ''}{adjustmentInfo.delta.toFixed(1)}kg
                              ({(adjustmentInfo.deviation * 100).toFixed(1)}%)
                            </div>
                            {adjustmentInfo.deviation > 0.05 && (
                              <div className="text-xs mt-1 font-semibold italic">Lệch &gt; 5% — Bắt buộc giải trình lý do</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </FormItem>
              )}
            />

            {/* Ghi chú */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Lý do điều chỉnh
                    {adjustmentInfo && adjustmentInfo.deviation > 0.05 && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Ví dụ: Hao hụt lưu kho, kiểm kho thực tế lệch, lỗi nhập liệu..."
                      className="min-h-[100px] text-sm"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="min-w-[140px] rounded-xl"
              >
                {createMutation.isPending ? (
                  <Loader2 className="animate-spin size-4 mr-2" />
                ) : null}
                Xác nhận điều chỉnh
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
