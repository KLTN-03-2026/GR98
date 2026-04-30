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
import { Loader2, ArrowLeftRight } from 'lucide-react';
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
    },
  });

  const selectedWarehouseId = useWatch({ control: form.control, name: 'warehouseId' });
  const selectedProductId = useWatch({ control: form.control, name: 'productId' });
  const selectedType = useWatch({ control: form.control, name: 'type' });

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
  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    
    // For Inbound: Show all products (can import new products to warehouse)
    if (selectedType === 'inbound') {
      return allProducts.map(p => {
        const inStock = productsInWarehouse.find(pw => pw.id === p.id);
        return { ...p, inStock: inStock?.total || 0 };
      });
    }

    // For Outbound/Adjustment: Only show products currently in this warehouse
    return allProducts
      .filter(p => productsInWarehouse.some(pw => pw.id === p.id))
      .map(p => {
        const inStock = productsInWarehouse.find(pw => pw.id === p.id);
        return { ...p, inStock: inStock?.total || 0 };
      });
  }, [allProducts, selectedType, productsInWarehouse]);

  // Fetch lots filtered by selected warehouse and product
  const { data: lots, isLoading: isLoadingLots } = useGetLots({
    warehouseId: selectedWarehouseId || undefined,
    productId: selectedProductId || undefined,
  });

  // Auto-focus quantity field when a lot is selected
  const quantityInputRef = React.useRef<HTMLInputElement>(null);
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
      await createTransactionMutation.mutateAsync({
        ...values,
        quantityKg: parseFloat(values.quantityKg as any),
      });
      toast.success('Ghi nhận giao dịch thành công');
      form.reset();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi ghi nhận giao dịch');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] rounded-[28px] border-none bg-card/95 backdrop-blur-xl shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold">Ghi nhận giao dịch kho</DialogTitle>
          <DialogDescription>
            Tạo phiếu nhập, xuất hoặc điều chỉnh cho một lô hàng cụ thể.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full max-h-[85vh]">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-emerald-200">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại giao dịch</FormLabel>
                    <Select onValueChange={(val) => {
                      field.onChange(val);
                      form.setValue('productId', '');
                      form.setValue('inventoryLotId', '');
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className={cn(
                          "rounded-xl transition-all duration-300 h-11",
                          selectedType === 'inbound' && "border-emerald-200 bg-emerald-50/30 text-emerald-700",
                          selectedType === 'outbound' && "border-rose-200 bg-rose-50/30 text-rose-700",
                          selectedType === 'adjustment' && "border-blue-200 bg-blue-50/30 text-blue-700"
                        )}>
                          <SelectValue placeholder="Chọn loại giao dịch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl shadow-xl">
                        <SelectItem value="inbound" className="text-emerald-600 font-medium">Nhập thêm (Inbound)</SelectItem>
                        <SelectItem value="outbound" className="text-rose-600 font-medium">Xuất kho (Outbound)</SelectItem>
                        <SelectItem value="adjustment" className="text-blue-600 font-medium">Điều chỉnh (Adjustment)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warehouseId"
                rules={{ required: 'Bắt buộc' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kho hàng</FormLabel>
                    <Select onValueChange={(val) => {
                      field.onChange(val);
                      form.setValue('productId', '');
                      form.setValue('inventoryLotId', '');
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl h-11 border-slate-200">
                          <SelectValue placeholder="Chọn kho" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl shadow-xl">
                        {warehouses?.map((w) => (
                          <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productId"
                rules={{ required: 'Bắt buộc' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sản phẩm</FormLabel>
                    <Select 
                      onValueChange={(val) => {
                        field.onChange(val);
                        form.setValue('inventoryLotId', '');
                      }} 
                      defaultValue={field.value}
                      disabled={!selectedWarehouseId || isLoadingWarehouseLots}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-xl h-11 border-slate-200">
                          <SelectValue placeholder={!selectedWarehouseId ? "Chọn kho trước" : "Chọn sản phẩm"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl shadow-xl max-h-[250px]">
                        {filteredProducts.map((p) => (
                          <SelectItem key={p.id} value={p.id} className="rounded-lg">
                            <div className="flex flex-col py-0.5">
                              <span className="font-bold text-sm text-slate-900">{p.name}</span>
                              {p.inStock > 0 && (
                                <span className="text-[10px] text-emerald-600 font-medium italic">Hiện có: {p.inStock.toLocaleString()} {p.unit} tại kho</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                        {filteredProducts.length === 0 && selectedWarehouseId && (
                          <SelectItem value="none" disabled>Kho trống hoặc không có hàng</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Product Preview Area (Fixed height to prevent jumping) */}
              <div className="min-h-[88px] relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 transition-all duration-300">
                {selectedProductId ? (
                  <div className="p-3 flex gap-4 animate-in fade-in zoom-in-95 duration-500">
                    <div className="size-16 rounded-xl bg-white border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
                      {allProducts?.find(p => p.id === selectedProductId)?.imageUrls?.[0] ? (
                        <img 
                          src={allProducts?.find(p => p.id === selectedProductId)?.imageUrls?.[0]} 
                          alt="Product" 
                          className="w-full h-full object-cover transition-transform hover:scale-110 duration-500"
                        />
                      ) : (
                        <div className="text-[10px] text-slate-400 font-bold uppercase">No Image</div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center min-w-0 flex-1">
                      <span className="text-sm font-bold text-slate-900 line-clamp-2 leading-tight mb-1">
                        {allProducts?.find(p => p.id === selectedProductId)?.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                          SKU: {allProducts?.find(p => p.id === selectedProductId)?.sku || 'N/A'}
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase">
                          ĐVT: {allProducts?.find(p => p.id === selectedProductId)?.unit || 'kg'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs italic gap-2 opacity-60">
                    <div className="size-8 rounded-full border-2 border-dashed border-slate-300" />
                    Chưa có sản phẩm được chọn
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="inventoryLotId"
                rules={{ required: 'Bắt buộc chọn lô hàng' }}
                render={({ field }) => {
                  const selectedLot = lots?.find(l => l.id === field.value);
                  return (
                    <FormItem>
                      <FormLabel className="flex justify-between items-center">
                        <span>Lô hàng ảnh hưởng</span>
                        {selectedLot && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                            Tồn lô này: {selectedLot.quantityKg} kg
                          </span>
                        )}
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!selectedWarehouseId || !selectedProductId || isLoadingLots}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-slate-200 h-11 focus:ring-emerald-500/20 focus:border-emerald-500">
                            <SelectValue placeholder={
                              !selectedWarehouseId || !selectedProductId 
                                ? "Vui lòng chọn Kho và Sản phẩm trước" 
                                : "Chọn lô hàng"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl shadow-xl border-slate-100 max-h-[200px]">
                          {lots?.map((l) => (
                            <SelectItem key={l.id} value={l.id} className="rounded-lg">
                              <div className="flex flex-col py-0.5">
                                <span className="font-bold text-sm text-slate-900">Mã Lô: {l.id.slice(-6).toUpperCase()}</span>
                                <span className="text-[10px] text-muted-foreground">Tồn: {l.quantityKg}kg • {l.qualityGrade}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="quantityKg"
                  rules={{ 
                    required: 'Nhập số lượng',
                    validate: (val) => {
                      const numVal = parseFloat(val as any);
                      if (selectedType === 'adjustment') return true;
                      if (numVal <= 0) return 'Số lượng phải lớn hơn 0';
                      if (selectedType === 'outbound') {
                        const currentLot = lots?.find(l => l.id === form.getValues('inventoryLotId'));
                        if (currentLot && numVal > currentLot.quantityKg) {
                          return `Vượt quá tồn kho (${currentLot.quantityKg}kg)`;
                        }
                      }
                      return true;
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số lượng ({allProducts?.find(p => p.id === selectedProductId)?.unit || 'kg'})</FormLabel>
                      <FormControl>
                        <Input 
                          name="quantityKg"
                          type="number" 
                          step="0.1" 
                          value={field.value}
                          onChange={field.onChange}
                          className="rounded-xl text-xl font-black h-12 border-slate-200 focus:border-emerald-500 transition-colors"
                          placeholder="0.0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Transaction Summary Box */}
                {form.getValues('inventoryLotId') && parseFloat(form.getValues('quantityKg') as any) > 0 && (
                  <div className={cn(
                    "rounded-2xl p-4 border transition-all duration-300 animate-in zoom-in-95",
                    selectedType === 'inbound' && "bg-emerald-50 border-emerald-100",
                    selectedType === 'outbound' && "bg-rose-50 border-rose-100",
                    selectedType === 'adjustment' && "bg-blue-50 border-blue-100"
                  )}>
                    <div className="flex justify-between items-center text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
                      <span>Dự báo thay đổi</span>
                      <span className={cn(
                        "font-bold",
                        selectedType === 'inbound' && "text-emerald-600",
                        selectedType === 'outbound' && "text-rose-600",
                        selectedType === 'adjustment' && "text-blue-600"
                      )}>
                        {selectedType === 'inbound' ? 'Tăng kho' : selectedType === 'outbound' ? 'Giảm kho' : 'Điều chỉnh'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400">Trước</span>
                        <span className="font-bold text-slate-600">
                          {lots?.find(l => l.id === form.getValues('inventoryLotId'))?.quantityKg.toLocaleString()} kg
                        </span>
                      </div>
                      <div className="size-6 rounded-full bg-white/50 flex items-center justify-center">
                        <ArrowLeftRight className="size-3 text-slate-400" />
                      </div>
                      <div className="flex flex-col items-end text-right">
                        <span className="text-[10px] text-slate-400">Sau khi lưu</span>
                        <span className={cn(
                          "font-black text-lg tabular-nums",
                          selectedType === 'inbound' && "text-emerald-700",
                          selectedType === 'outbound' && "text-rose-700",
                          selectedType === 'adjustment' && "text-blue-700"
                        )}>
                          {(() => {
                            const current = lots?.find(l => l.id === form.getValues('inventoryLotId'))?.quantityKg || 0;
                            const change = parseFloat(form.getValues('quantityKg') as any) || 0;
                            return selectedType === 'outbound' ? (current - change) : (current + change);
                          })().toLocaleString('vi-VN')} kg
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="note"
                rules={{
                  validate: (val) => {
                    if (selectedType === 'adjustment' && (!val || val.trim().length < 5)) {
                      return 'Bắt buộc nhập lý do điều chỉnh';
                    }
                    return true;
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      Ghi chú
                      {selectedType === 'adjustment' && <span className="text-rose-500 text-[10px] font-bold">(BẮT BUỘC)</span>}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Lý do hoặc thông tin thêm..."
                        className="rounded-xl min-h-[80px] border-slate-200 focus:border-blue-400"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="p-4 px-6 border-t bg-slate-50/80 backdrop-blur-sm">
              <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl h-11 px-6">Hủy</Button>
              <Button
                type="submit"
                disabled={createTransactionMutation.isPending}
                className={cn(
                  "rounded-xl min-w-[160px] h-11 text-white font-bold transition-all duration-300 shadow-lg",
                  selectedType === 'inbound' && "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
                  selectedType === 'outbound' && "bg-rose-600 hover:bg-rose-700 shadow-rose-200",
                  selectedType === 'adjustment' && "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                )}
              >
                {createTransactionMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  'Xác nhận Giao dịch'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
