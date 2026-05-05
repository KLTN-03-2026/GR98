import React, { useMemo, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
import {
  useCreateTransaction,
  useGetTransactionWarehouses,
  useGetTransactionLots,
} from '../api/hooks';
import { toast } from 'sonner';
import {
  Scale,
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
  quantityKg: string;
  note: string;
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn("px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider", className)}>
      {children}
    </span>
  );
}

export default function CreateTransactionDialog({ isOpen, onClose }: CreateTransactionDialogProps) {
  const { data: warehouses } = useGetTransactionWarehouses();
  const createMutation = useCreateTransaction();

  const form = useForm<FormValues>({
    defaultValues: {
      warehouseId: '',
      inventoryLotId: '',
      quantityKg: '',
      note: '',
    },
  });

  const selectedWarehouseId = useWatch({ control: form.control, name: 'warehouseId' });
  const selectedLotId = useWatch({ control: form.control, name: 'inventoryLotId' });
  const newWeightStr = useWatch({ control: form.control, name: 'quantityKg' });
  const justification = useWatch({ control: form.control, name: 'note' });

  const { data: lots, isLoading: isLoadingLots } = useGetTransactionLots(selectedWarehouseId);
  const currentLot = useMemo(() => lots?.find((l: any) => l.id === selectedLotId), [lots, selectedLotId]);

  const currentWeight = currentLot?.quantityKg || 0;
  
  const { deviation, isLargeDeviation, delta } = useMemo(() => {
    if (!newWeightStr || isNaN(parseFloat(newWeightStr))) {
      return { deviation: 0, isLargeDeviation: false, delta: 0 };
    }
    const val = parseFloat(newWeightStr);
    const diff = val - currentWeight;
    const dev = currentWeight > 0 ? Math.abs(diff) / currentWeight : 0;
    return {
      deviation: dev * 100,
      isLargeDeviation: dev > 0.05,
      delta: diff
    };
  }, [newWeightStr, currentWeight]);

  const userJustification = justification.replace(/^\[ĐIỀU CHỈNH KHỐI LƯỢNG\] Từ .*? kg -> .*? kg\. Lý do: /, '').trim();

  // Tự động ghi giá trị cập nhật vào note
  useEffect(() => {
    if (newWeightStr && !isNaN(parseFloat(newWeightStr)) && delta !== 0 && currentLot) {
      const prefix = `[ĐIỀU CHỈNH KHỐI LƯỢNG] Từ ${currentWeight.toLocaleString('vi-VN')} kg -> ${parseFloat(newWeightStr).toLocaleString('vi-VN')} kg. Lý do: `;
      const currentNote = form.getValues('note');
      const userText = currentNote.replace(/^\[ĐIỀU CHỈNH KHỐI LƯỢNG\] Từ .*? kg -> .*? kg\. Lý do: /, '');
      form.setValue('note', prefix + userText, { shouldValidate: true });
    } else {
      const currentNote = form.getValues('note');
      form.setValue('note', currentNote.replace(/^\[ĐIỀU CHỈNH KHỐI LƯỢNG\] Từ .*? kg -> .*? kg\. Lý do: /, ''), { shouldValidate: true });
    }
  }, [newWeightStr, currentWeight, delta, currentLot, form]);

  const onSubmit = (values: FormValues) => {
    if (!currentLot) {
      toast.error('Vui lòng chọn lô hàng');
      return;
    }

    if (delta === 0) {
      toast.error('Khối lượng mới phải khác khối lượng hiện tại');
      return;
    }

    if (isLargeDeviation && !userJustification) {
      toast.error('Khối lượng lệch > 5%. Vui lòng nhập lý do giải trình.');
      return;
    }

    const payload: any = {
      warehouseId: values.warehouseId,
      inventoryLotId: values.inventoryLotId,
      productId: currentLot.productId,
      quantityKg: parseFloat(values.quantityKg),
      note: values.note,
      type: 'ADJUSTMENT',
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Điều chỉnh khối lượng thành công');
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
              {currentLot ? (
                <>Cập nhật số liệu thực tế cho lô <span className="text-emerald-400 font-mono">#{currentLot.id.slice(-6).toUpperCase()}</span> — {currentLot.product?.name}</>
              ) : (
                "Cập nhật số liệu thực tế cho các lô hàng trong kho"
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6 bg-white">
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-slate-700">Kho thực hiện</FormLabel>
                    <Select onValueChange={(val) => {
                      field.onChange(val);
                      form.setValue('inventoryLotId', '');
                    }} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-xl border-slate-200">
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

              <FormField
                control={form.control}
                name="inventoryLotId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-slate-700">Lô hàng</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedWarehouseId || isLoadingLots}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-xl border-slate-200">
                          <SelectValue placeholder={isLoadingLots ? "Đang tải..." : "Chọn lô hàng..."} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lots?.map((l: any) => (
                          <SelectItem key={l.id} value={l.id}>
                            Lô {l.id.slice(-6).toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            {currentLot && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <FormLabel className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Hiện tại</FormLabel>
                  <p className="text-xl font-black text-slate-900 mt-1">{currentWeight.toLocaleString('vi-VN')} <span className="text-xs font-medium text-slate-400">kg</span></p>
                </div>
                <div className={cn(
                  "p-4 rounded-2xl border transition-all duration-300",
                  isLargeDeviation ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100"
                )}>
                  <FormLabel className={cn(
                    "text-[10px] uppercase tracking-widest font-bold",
                    isLargeDeviation ? "text-rose-400" : "text-emerald-400"
                  )}>Biến động</FormLabel>
                  <p className={cn(
                    "text-xl font-black mt-1",
                    isLargeDeviation ? "text-rose-600" : "text-emerald-600"
                  )}>
                    {delta > 0 ? '+' : ''}{delta.toLocaleString('vi-VN')} <span className="text-xs font-medium opacity-70">kg</span>
                  </p>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="quantityKg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-slate-700">Khối lượng thực tế mới (kg)</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        disabled={!currentLot}
                        placeholder={currentLot ? "Nhập số cân thực tế..." : "Vui lòng chọn lô hàng trước"}
                        className="h-12 rounded-xl border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500 pl-4 text-lg font-bold"
                      />
                    </FormControl>
                    {newWeightStr && !isNaN(parseFloat(newWeightStr)) && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Badge className={cn(
                          "font-bold",
                          isLargeDeviation ? "bg-rose-100 text-rose-700 border-rose-200" : "bg-emerald-100 text-emerald-700 border-emerald-200"
                        )}>
                          {deviation.toFixed(1)}%
                        </Badge>
                      </div>
                    )}
                  </div>
                </FormItem>
              )}
            />

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

            {newWeightStr && !isNaN(parseFloat(newWeightStr)) && delta === 0 && currentLot && (
              <div className="text-center p-2 rounded-lg bg-rose-50 border border-rose-100">
                <p className="text-xs font-semibold text-rose-600">
                  ⚠️ Khối lượng mới đang bằng với khối lượng hiện tại.
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-slate-700">
                    Lý do giải trình {isLargeDeviation && <span className="text-rose-500">*</span>}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      disabled={!currentLot}
                      placeholder="Nhập lý do (ví dụ: hao hụt tự nhiên, sai lệch cân, hàng hỏng...)"
                      className="rounded-xl border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[100px] resize-none"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <div className="flex w-full gap-3">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12 rounded-xl font-bold text-slate-600">
                  Hủy bỏ
                </Button>
                <Button 
                  type="submit" 
                  disabled={!currentLot || !newWeightStr || delta === 0 || createMutation.isPending || (isLargeDeviation && !userJustification)}
                  className="flex-[2] h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xl shadow-slate-200 transition-all active:scale-95"
                >
                  {createMutation.isPending ? 'Đang lưu...' : 'Xác nhận cập nhật'}
                </Button>
              </div>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
