import React, { useMemo, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { useGetWarehouses } from '../../warehouses/api';
import { useGetProducts, useGetLots } from '../../lots/api';
import { useCreateTransaction } from '../api';
import { toast } from 'sonner';
import { Loader2, ArrowLeftRight, TrendingUp, TrendingDown, Settings2, Plus, Minus } from 'lucide-react';
import type { CreateTransactionInput } from '../api/types';
import { cn } from '@/lib/utils';

interface CreateTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateTransactionDialog({ isOpen, onClose }: CreateTransactionDialogProps) {
  // Fetch data
  const { data: warehouses } = useGetWarehouses();
  const { data: allProducts } = useGetProducts();
  const createTransactionMutation = useCreateTransaction();

  const form = useForm<CreateTransactionInput>({
    defaultValues: {
      warehouseId: '',
      productId: '',
      inventoryLotId: '',
      type: 'inbound',
      quantityKg: 0,
      note: '',
      sourceLotId: '',
    },
  });

  const selectedWarehouseId = useWatch({ control: form.control, name: 'warehouseId' });
  const selectedProductId = useWatch({ control: form.control, name: 'productId' });
  const selectedType = useWatch({ control: form.control, name: 'type' });
  const selectedTargetLotId = useWatch({ control: form.control, name: 'inventoryLotId' });

  // Fetch all lots in the selected warehouse to know what products are available
  const { data: warehouseLots, isLoading: isLoadingWarehouseLots } = useGetLots({
    warehouseId: selectedWarehouseId || undefined,
  });

  // Calculate available products and their total quantity in this warehouse
  const productsInWarehouse = useMemo(() => {
    if (!warehouseLots) return [];
    const productMap = new Map<string, number>();
    warehouseLots.forEach(lot => {
      const current = productMap.get(lot.productId) || 0;
      productMap.set(lot.productId, current + lot.quantityKg);
    });
    return Array.from(productMap.entries()).map(([id, total]) => ({ id, total }));
  }, [warehouseLots]);

  // Determine which products to show in the dropdown
  // Target lots are just the warehouse lots
  const targetLots = warehouseLots || [];

  // Auto-focus quantity field
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'inventoryLotId' && value.inventoryLotId) {
        setTimeout(() => {
          const input = document.querySelector('input[name="quantityKg"]') as HTMLInputElement;
          input?.focus();
          input?.select();
        }, 100);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (values: CreateTransactionInput) => {
    try {
      const payload = {
        ...values,
        quantityKg: parseFloat(values.quantityKg as any),
      };

      await createTransactionMutation.mutateAsync(payload);
      toast.success('Ghi nhận giao dịch thành công');
      form.reset();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi ghi nhận giao dịch');
    }
  };

  const currentLot = warehouseLots?.find(l => l.id === selectedTargetLotId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] rounded-[32px] border-none bg-white shadow-2xl p-0 overflow-hidden font-manrope">
        <div className="px-8 py-6 border-b bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex size-12 items-center justify-center rounded-2xl border transition-colors duration-500",
              selectedType === 'inbound' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
              selectedType === 'outbound' ? "bg-rose-50 border-rose-100 text-rose-600" :
              "bg-blue-50 border-blue-100 text-blue-600"
            )}>
              {selectedType === 'inbound' ? <TrendingUp className="size-6" /> :
               selectedType === 'outbound' ? <TrendingDown className="size-6" /> :
               <Settings2 className="size-6" />}
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">Ghi nhận giao dịch kho</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Thực hiện nhập, xuất hoặc điều chỉnh tồn kho cho sản phẩm.
              </DialogDescription>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full max-h-[85vh]">
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 scrollbar-thin scrollbar-thumb-emerald-100">
              
              {/* TRANSACTION TYPE SELECTOR */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <div className="grid grid-cols-3 gap-3 p-1 bg-slate-100 rounded-2xl">
                    {[
                      { id: 'inbound', label: 'Nhập kho', color: 'emerald', icon: TrendingUp },
                      { id: 'outbound', label: 'Xuất kho', color: 'rose', icon: TrendingDown },
                      { id: 'adjustment', label: 'Điều chỉnh', color: 'blue', icon: Settings2 },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          field.onChange(t.id);
                          form.setValue('productId', '');
                          form.setValue('inventoryLotId', '');
                          form.setValue('sourceLotId', '');
                          form.setValue('quantityKg', 0);
                        }}
                        className={cn(
                          "flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-300",
                          field.value === t.id 
                            ? `bg-white text-${t.color}-600 shadow-sm ring-1 ring-black/5` 
                            : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                        )}
                      >
                        <t.icon className="size-3.5" />
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
              />



              {/* DESTINATION SELECTION SECTION */}
              <div className="flex flex-col gap-6">
                <FormField
                  control={form.control}
                  name="warehouseId"
                  rules={{ required: 'Bắt buộc' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Kho hàng (Target)</FormLabel>
                      <Select onValueChange={(val) => {
                        field.onChange(val);
                        form.setValue('productId', '');
                        form.setValue('inventoryLotId', '');
                      }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl min-h-[3.5rem] h-auto py-3 border-slate-200 font-semibold text-sm bg-white hover:bg-slate-50 transition-colors w-full">
                            <SelectValue placeholder="Chọn kho" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl shadow-xl border-slate-100">
                          {warehouses?.map((w) => (
                            <SelectItem key={w.id} value={w.id} className="font-medium py-2.5 rounded-lg whitespace-normal">
                              {w.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inventoryLotId"
                  rules={{ required: 'Bắt buộc chọn lô hàng' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-500 font-bold text-[11px] uppercase tracking-wider flex justify-between">
                        Lô hàng (Destination)
                        {currentLot && (
                          <span className="text-emerald-600 bg-emerald-50 px-2 rounded-full font-black">Hiện tại: {currentLot.quantityKg} kg</span>
                        )}
                      </FormLabel>
                      <Select 
                        onValueChange={(val) => {
                          field.onChange(val);
                          const lot = warehouseLots?.find(l => l.id === val);
                          if (lot) {
                            form.setValue('productId', lot.productId);
                          }
                          form.trigger('quantityKg');
                        }} 
                        value={field.value || undefined}
                        disabled={!selectedWarehouseId || isLoadingWarehouseLots}
                      >
                        <FormControl>
                        <SelectTrigger className="rounded-xl border-slate-200 min-h-[3.5rem] h-auto py-3 font-semibold text-sm text-slate-900 bg-white hover:bg-slate-50 transition-all w-full">
                          <div className="w-full text-left">
                            <SelectValue placeholder="Chọn lô hàng..." />
                          </div>
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl shadow-2xl border-slate-100 max-h-[400px] w-[var(--radix-select-trigger-width)]">
                          {targetLots?.map((l) => (
                            <SelectItem key={l.id} value={l.id} className="rounded-lg py-3 mb-1 cursor-pointer">
                              <div className="flex flex-col gap-1 w-full whitespace-normal">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-slate-900">Lô {l.id.slice(-6).toUpperCase()}</span>
                                  <span className="text-[10px] text-slate-400 font-black uppercase shrink-0">{l.qualityGrade}</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-emerald-700 text-xs">{l.product?.name}</span>
                                  <span className="text-[11px] text-slate-500 italic">Tồn: {l.quantityKg.toLocaleString()}kg</span>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* PRODUCT DISPLAY */}
              <FormField
                control={form.control}
                name="productId"
                rules={{ required: 'Bắt buộc' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Sản phẩm của lô</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          disabled 
                          value={currentLot?.product?.name || ''} 
                          placeholder="Sản phẩm sẽ hiển thị tự động sau khi chọn lô hàng"
                          className="rounded-xl min-h-[3.5rem] h-auto py-3 border-slate-200 font-bold text-sm bg-slate-100 opacity-70 text-slate-900 whitespace-normal w-full"
                        />
                        <input type="hidden" {...field} value={field.value || ''} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* QUANTITY INPUT AREA */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="quantityKg"
                  rules={{ 
                    required: 'Nhập số lượng',
                    validate: (val) => {
                      const numVal = parseFloat(val as any);
                      if (selectedType === 'adjustment') {
                        if (currentLot && numVal < 0 && Math.abs(numVal) > currentLot.quantityKg) {
                          return `Không thể giảm quá tồn kho hiện tại (${currentLot.quantityKg}kg)`;
                        }
                        return true;
                      }
                      if (numVal <= 0) return 'Số lượng phải lớn hơn 0';
                      if (selectedType === 'inbound' || selectedType === 'outbound') {
                        if (currentLot && numVal > currentLot.quantityKg) {
                          return `Vượt quá số lượng trong lô (${currentLot.quantityKg}kg)`;
                        }
                      }
                      return true;
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-500 font-bold text-[11px] uppercase tracking-wider flex justify-between items-center">
                        <span>Số lượng thực hiện</span>
                        <div className="flex items-center gap-2">
                          {currentLot && (
                            <button 
                              type="button"
                              onClick={() => form.setValue('quantityKg', currentLot.quantityKg, { shouldValidate: true })}
                              className={cn(
                                "text-[10px] font-black px-2 py-0.5 rounded-md transition-colors",
                                selectedType === 'inbound' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" :
                                selectedType === 'outbound' ? "bg-rose-100 text-rose-700 hover:bg-rose-200" :
                                "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              )}
                            >
                              TỐI ĐA: {currentLot.quantityKg}kg
                            </button>
                          )}
                        </div>
                      </FormLabel>
                      <FormControl>
                        <div className={cn(
                          "relative flex items-center rounded-3xl p-1.5 transition-all duration-300",
                          selectedType === 'inbound' ? "bg-emerald-50/50 border-2 border-emerald-100 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10" :
                          selectedType === 'outbound' ? "bg-rose-50/50 border-2 border-rose-100 focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/10" :
                          "bg-blue-50/50 border-2 border-blue-100 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10"
                        )}>
                          <button
                            type="button"
                            onClick={() => {
                              const val = parseFloat(form.getValues('quantityKg') as any) || 0;
                              form.setValue('quantityKg', Math.max(0, val - 1), { shouldValidate: true });
                            }}
                            className="size-12 flex items-center justify-center rounded-2xl bg-white shadow-sm text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                          >
                            <Minus className="size-5" />
                          </button>
                          
                          <div className="flex-1 flex flex-col items-center">
                            <Input 
                              type="number" 
                              step="0.1" 
                              {...field}
                              onChange={(e) => {
                                const valStr = e.target.value;
                                let val = parseFloat(valStr);
                                if (!isNaN(val)) {
                                  if (val < 0) val = 0;
                                  else if ((selectedType === 'inbound' || selectedType === 'outbound') && currentLot && val > currentLot.quantityKg) val = currentLot.quantityKg;
                                  e.target.value = val.toString();
                                }
                                field.onChange(e);
                              }}
                              className="border-none shadow-none text-4xl font-black text-center h-16 focus-visible:ring-0 bg-transparent tabular-nums w-full"
                              placeholder="0.0"
                            />
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest -mt-1">
                              {allProducts?.find(p => p.id === selectedProductId)?.unit || 'KILOGRAMS'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const val = parseFloat(form.getValues('quantityKg') as any) || 0;
                              const max = currentLot?.quantityKg || 999999;
                              form.setValue('quantityKg', Math.min(max, val + 1), { shouldValidate: true });
                            }}
                            className="size-12 flex items-center justify-center rounded-2xl bg-white shadow-sm text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                          >
                            <Plus className="size-5" />
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* VISUAL PREDICTION BOX */}
                {selectedTargetLotId && parseFloat(form.getValues('quantityKg') as any) > 0 && (
                  <div className={cn(
                    "rounded-[24px] p-6 border-2 transition-all duration-500 animate-in zoom-in-95",
                    selectedType === 'inbound' ? "bg-emerald-50/50 border-emerald-200" : 
                    selectedType === 'outbound' ? "bg-rose-50/50 border-rose-200" : "bg-blue-50/50 border-blue-200"
                  )}>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dự báo tồn kho sau giao dịch</span>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase",
                        selectedType === 'inbound' ? "bg-emerald-600 text-white" : 
                        selectedType === 'outbound' ? "bg-rose-600 text-white" : "bg-blue-600 text-white"
                      )}>
                        {selectedType === 'inbound' ? 'Nhập kho từ lô' : 
                         selectedType === 'outbound' ? 'Xuất kho từ lô' : 'Điều chỉnh lô'}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Trước</span>
                        <span className="text-2xl font-black text-slate-400 tabular-nums">
                          {currentLot?.quantityKg.toLocaleString()} <span className="text-sm">kg</span>
                        </span>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <ArrowLeftRight className={cn(
                          "size-8",
                          selectedType === 'inbound' ? "text-emerald-500" : 
                          selectedType === 'outbound' ? "text-rose-500" : "text-blue-500"
                        )} />
                        <span className={cn(
                          "text-[11px] font-black mt-1",
                          selectedType === 'inbound' ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {selectedType === 'outbound' ? '-' : '+'}{parseFloat(form.getValues('quantityKg') as any).toLocaleString()} kg
                        </span>
                      </div>

                      <div className="flex flex-col items-end text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Sau</span>
                        <span className={cn(
                          "text-3xl font-black tabular-nums",
                          selectedType === 'inbound' ? "text-emerald-700" : 
                          selectedType === 'outbound' ? "text-rose-700" : "text-blue-700"
                        )}>
                          {(() => {
                            const current = currentLot?.quantityKg || 0;
                            const change = parseFloat(form.getValues('quantityKg') as any) || 0;
                            // Inbound and Outbound both subtract from the LOT
                            return (selectedType === 'inbound' || selectedType === 'outbound' ? (current - change) : (current + change)).toLocaleString();
                          })()} <span className="text-lg">kg</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Ghi chú & Lý do</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Nhập ghi chú chi tiết cho giao dịch này..."
                        className="rounded-2xl min-h-[100px] border-slate-200 bg-slate-50/30 focus:bg-white transition-all text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="p-6 border-t bg-slate-50/50 gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl h-11 px-8 font-semibold text-slate-600">
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={createTransactionMutation.isPending}
                className={cn(
                  "rounded-xl min-w-[180px] h-11 text-white font-bold text-sm shadow-sm transition-all active:scale-95",
                  selectedType === 'inbound' ? "bg-emerald-600 hover:bg-emerald-700" : 
                  selectedType === 'outbound' ? "bg-rose-600 hover:bg-rose-700" : 
                  "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {createTransactionMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Xác nhận giao dịch"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
