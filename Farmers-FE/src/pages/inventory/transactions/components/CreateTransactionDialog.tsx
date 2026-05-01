import React, { useMemo } from 'react';
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
import { 
  useCreateTransaction, 
  useGetTransactionWarehouses, 
  useGetTransactionLots 
} from '../api/hooks';
import { toast } from 'sonner';
import { 
  Loader2, 
  TrendingUp, 
  ArrowRightLeft, 
  Settings2,
  Plus,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

import type { TransactionType } from '../api/types';

interface CreateTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormValues {
  type: TransactionType;
  warehouseId: string;
  inventoryLotId: string;
  quantityKg: number;
  note: string;
  targetWarehouseId: string;
}

export default function CreateTransactionDialog({ isOpen, onClose }: CreateTransactionDialogProps) {
  const { data: warehouses } = useGetTransactionWarehouses();
  const createMutation = useCreateTransaction();

  const form = useForm<FormValues>({
    defaultValues: {
      type: 'inbound',
      warehouseId: '',
      inventoryLotId: '',
      quantityKg: 0,
      note: '',
      targetWarehouseId: '',
    },
  });

  const selectedType = useWatch({ control: form.control, name: 'type' });
  const selectedWarehouseId = useWatch({ control: form.control, name: 'warehouseId' });
  const selectedLotId = useWatch({ control: form.control, name: 'inventoryLotId' });

  const { data: lots, isLoading: isLoadingLots } = useGetTransactionLots(selectedWarehouseId);
  const currentLot = useMemo(() => lots?.find(l => l.id === selectedLotId), [lots, selectedLotId]);

  const onSubmit = (values: any) => {
    if (!currentLot) {
      toast.error('Vui lòng chọn lô hàng để thực hiện giao dịch');
      return;
    }

    if (selectedType === 'outbound' && !values.targetWarehouseId) {
      toast.error('Vui lòng chọn kho nhận để thực hiện điều chuyển');
      return;
    }

    const payload = {
      ...values,
      productId: currentLot.productId,
      quantityKg: parseFloat(values.quantityKg),
      // Mọi giao dịch xuất kho từ trang này đều được coi là Điều chuyển
      isTransfer: selectedType === 'outbound',
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Ghi nhận giao dịch thành công. Kho hàng đã được cập nhật.');
        form.reset();
        onClose();
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.error?.message || error?.message || 'Có lỗi xảy ra khi ghi nhận giao dịch';
        toast.error('Lỗi hệ thống: ' + errorMessage);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] rounded-[32px] border-none shadow-2xl font-manrope">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">
            {selectedType === 'outbound' ? 'Điều chuyển hàng hóa' : 'Giao dịch kho hàng'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* 1. Chọn loại giao dịch */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl">
                  {[
                    { id: 'inbound', label: 'Nhập kho', icon: TrendingUp, color: 'text-emerald-600' },
                    { id: 'outbound', label: 'Điều chuyển', icon: ArrowRightLeft, color: 'text-blue-600' },
                    { id: 'adjustment', label: 'Điều chỉnh', icon: Settings2, color: 'text-amber-600' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => field.onChange(t.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                        field.value === t.id ? "bg-white shadow-md " + t.color : "text-slate-400 hover:bg-white/40"
                      )}
                    >
                      <t.icon className="size-4" />
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kho xuất hàng</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl h-12 border-slate-200 font-bold text-xs">
                          <SelectValue placeholder="Chọn kho" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        {warehouses?.map(w => (
                          <SelectItem key={w.id} value={w.id} className="text-xs font-bold">{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {selectedType === 'outbound' && (
                <FormField
                  control={form.control}
                  name="targetWarehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-blue-500 tracking-widest ml-1">Kho nhận hàng</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl h-12 border-blue-100 bg-blue-50/30 font-bold text-xs">
                            <SelectValue placeholder="Chọn kho nhận" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          {warehouses?.filter(w => w.id !== selectedWarehouseId).map(w => (
                            <SelectItem key={w.id} value={w.id} className="text-xs font-bold text-blue-600">{w.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="inventoryLotId"
                render={({ field }) => (
                  <FormItem className={cn(selectedType !== 'outbound' && "col-span-2")}>
                    <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Lô hàng định danh</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedWarehouseId || isLoadingLots}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-xl h-12 border-slate-200 font-bold text-xs">
                          <SelectValue placeholder="Chọn lô hàng..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        {lots?.map(l => (
                          <SelectItem key={l.id} value={l.id} className="text-xs">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold">Lô {l.id.slice(-6).toUpperCase()}</span>
                              <span className="text-[10px] text-muted-foreground">{l.product.name} (Sẵn có: {l.quantityKg}kg)</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="quantityKg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex justify-between px-1">
                    Số lượng thực hiện
                    {currentLot && (
                      <span className="text-emerald-600 font-black">SỐ DƯ LÔ TẠI KHO: {currentLot.quantityKg}kg</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <div className="relative flex items-center bg-white rounded-3xl p-2 border-2 border-slate-100 shadow-sm focus-within:border-slate-900 transition-all">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="rounded-2xl size-10 bg-slate-50 hover:bg-slate-100"
                        onClick={() => field.onChange(Math.max(0, field.value - 1))}
                      >
                        <Minus className="size-4" />
                      </Button>
                      <Input
                        type="number"
                        {...field}
                        className="border-none shadow-none bg-transparent text-center text-4xl font-black focus-visible:ring-0 tabular-nums h-14"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="rounded-2xl size-10 bg-slate-50 hover:bg-slate-100"
                        onClick={() => field.onChange(field.value + 1)}
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px] font-bold" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Ghi chú & Lý do</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Nhập lý do thực hiện giao dịch..."
                      className="rounded-2xl min-h-[100px] border-slate-200 bg-slate-50/30 focus:bg-white transition-all text-xs font-medium"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={onClose} className="rounded-2xl font-bold text-slate-500 hover:bg-slate-100">
                Hủy bỏ
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="rounded-2xl bg-slate-900 px-10 h-12 font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-all"
              >
                {createMutation.isPending ? <Loader2 className="animate-spin size-4" /> : 'Xác nhận giao dịch'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
