import { useForm } from 'react-hook-form';
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
import { useGetProducts, useGetContracts, useCreateLot } from '../api';
import type { CreateLotInput } from '../api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Define the form type locally for better type inference with react-hook-form
type CreateLotFormValues = Omit<CreateLotInput, 'quantityKg'> & { quantityKg: string };

interface CreateLotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateLotModal({ isOpen, onClose }: CreateLotModalProps) {
  const { data: warehouses } = useGetWarehouses();
  const { data: products } = useGetProducts();
  const { data: contracts } = useGetContracts();
  const createLotMutation = useCreateLot();

  const form = useForm<CreateLotFormValues>({
    defaultValues: {
      warehouseId: '',
      productId: '',
      contractId: '',
      quantityKg: '',
      harvestDate: new Date().toISOString().split('T')[0],
      expiryDate: undefined,
      qualityGrade: 'A',
      note: '',
    },
  });

  const onSubmit = async (values: CreateLotFormValues) => {
    try {
      await createLotMutation.mutateAsync({
        ...values,
        contractId: values.contractId === 'none' ? undefined : values.contractId,
        quantityKg: parseFloat(values.quantityKg),
        expiryDate: values.expiryDate || undefined,
      });
      toast.success('Nhập kho lô hàng thành công');
      form.reset();
      onClose();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi nhập kho');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-[22px]">
        <DialogHeader>
          <DialogTitle>Nhập kho lô hàng mới</DialogTitle>
          <DialogDescription>
            Ghi nhận nông sản mới nhập kho. Hệ thống sẽ tự động tạo phiếu nhập kho tương ứng.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField<CreateLotFormValues, 'warehouseId'>
                control={form.control as any}
                name="warehouseId"
                rules={{ required: 'Vui lòng chọn kho' }}
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

              <FormField<CreateLotFormValues, 'productId'>
                control={form.control as any}
                name="productId"
                rules={{ required: 'Vui lòng chọn sản phẩm' }}
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
                          <SelectItem key={p.id} value={p.id}>{p.name} ({p.unit})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField<CreateLotFormValues, 'contractId'>
              control={form.control as any}
              name="contractId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hợp đồng nguồn (Không bắt buộc)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Chọn hợp đồng để truy xuất nguồn gốc" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Không có hợp đồng</SelectItem>
                      {contracts?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.contractNo} — {c.farmer.fullName} ({c.plot.plotCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField<CreateLotFormValues, 'quantityKg'>
                control={form.control as any}
                name="quantityKg"
                rules={{ required: 'Nhập số lượng', min: { value: 0.1, message: 'Tối thiểu 0.1kg' } }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số lượng (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<CreateLotFormValues, 'qualityGrade'>
                control={form.control as any}
                name="qualityGrade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chất lượng</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Chọn hạng" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A">Hạng A</SelectItem>
                        <SelectItem value="B">Hạng B</SelectItem>
                        <SelectItem value="C">Hạng C</SelectItem>
                        <SelectItem value="REJECT">Loại bỏ</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField<CreateLotFormValues, 'harvestDate'>
                control={form.control as any}
                name="harvestDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày thu hoạch</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<CreateLotFormValues, 'expiryDate'>
                control={form.control as any}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày hết hạn (Nếu có)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField<CreateLotFormValues, 'note'>
              control={form.control as any}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ghi chú về lô hàng này..."
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
                disabled={createLotMutation.isPending}
                className="rounded-xl min-w-[120px]"
              >
                {createLotMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  'Xác nhận nhập'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
