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
import { Loader2 } from 'lucide-react';
import type { CreateTransactionInput } from '../api/types';

interface CreateTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateTransactionDialog({ isOpen, onClose }: CreateTransactionDialogProps) {
  const { data: warehouses } = useGetWarehouses();
  const { data: products } = useGetProducts();
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

  // Fetch lots filtered by selected warehouse and product
  const { data: lots, isLoading: isLoadingLots } = useGetLots({
    warehouseId: selectedWarehouseId || undefined,
    productId: selectedProductId || undefined,
  });

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
      <DialogContent className="sm:max-w-[500px] rounded-[22px]">
        <DialogHeader>
          <DialogTitle>Ghi nhận giao dịch kho</DialogTitle>
          <DialogDescription>
            Tạo phiếu nhập, xuất hoặc điều chỉnh cho một lô hàng cụ thể.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại giao dịch</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Chọn loại giao dịch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="inbound">Nhập thêm (Inbound)</SelectItem>
                      <SelectItem value="outbound">Xuất kho (Outbound)</SelectItem>
                      <SelectItem value="adjustment">Điều chỉnh (Adjustment)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="warehouseId"
                rules={{ required: 'Bắt buộc' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kho hàng</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Chọn kho" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Chọn sản phẩm" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="inventoryLotId"
              rules={{ required: 'Bắt buộc chọn lô hàng' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lô hàng ảnh hưởng</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!selectedWarehouseId || !selectedProductId || isLoadingLots}
                  >
                    <FormControl>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder={
                          !selectedWarehouseId || !selectedProductId 
                            ? "Vui lòng chọn Kho và Sản phẩm trước" 
                            : "Chọn lô hàng"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lots?.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          Mã Lô: {l.id.slice(-6).toUpperCase()} — Tồn: {l.quantityKg}kg ({l.qualityGrade})
                        </SelectItem>
                      ))}
                      {lots?.length === 0 && selectedWarehouseId && selectedProductId && (
                        <SelectItem value="none" disabled>Không tìm thấy lô hàng phù hợp</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantityKg"
              rules={{ 
                required: 'Nhập số lượng',
                validate: (val) => {
                  if (selectedType === 'adjustment') return true;
                  return val > 0 || 'Số lượng phải lớn hơn 0';
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số lượng (kg)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1" 
                      {...field} 
                      className="rounded-xl"
                      placeholder={selectedType === 'adjustment' ? "Số lượng điều chỉnh (có thể âm)" : "Số lượng giao dịch"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Lý do điều chỉnh hoặc thông tin thêm..."
                      className="rounded-xl min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createTransactionMutation.isPending}
                className="rounded-xl min-w-[120px]"
              >
                {createTransactionMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  'Lưu giao dịch'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
