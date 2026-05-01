import { useForm, useWatch } from 'react-hook-form';
import { useEffect, useState } from 'react';
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
import { Loader2, Info, Package, FileText, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { Label } from '@/components/ui/label';

type CreateLotFormValues = Omit<CreateLotInput, 'quantityKg'> & { quantityKg: string; deviationReason?: string };

interface CreateLotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateLotModal({ isOpen, onClose }: CreateLotModalProps) {
  const { data: warehouses } = useGetWarehouses();
  const { data: products } = useGetProducts();
  const { data: contracts } = useGetContracts();
  const createLotMutation = useCreateLot();
  const [needsDeviationReason, setNeedsDeviationReason] = useState(false);
  const [deviationWarning, setDeviationWarning] = useState('');

  const form = useForm<CreateLotFormValues>({
    defaultValues: {
      warehouseId: '',
      productId: '',
      contractId: '',
      quantityKg: '',
      harvestDate: format(new Date(), 'yyyy-MM-dd'),
      expiryDate: '',
      qualityGrade: 'A',
      note: '',
      deviationReason: '',
    },
  });

  const selectedContractId = useWatch({ control: form.control, name: 'contractId' });
  const harvestDateWatch = useWatch({ control: form.control, name: 'harvestDate' });

  // Nghiệp vụ Auto-fill: Khi chọn hợp đồng, tự động điền Sản phẩm và Phẩm cấp
  useEffect(() => {
    if (selectedContractId && selectedContractId !== 'none' && contracts) {
      const contract = contracts.find(c => c.id === selectedContractId);
      if (contract) {
        form.setValue('productId', contract.product?.id || '');
        form.setValue('qualityGrade', contract.grade);
        toast.info(`Đã tự động lấy dữ liệu từ Hợp đồng ${contract.contractNo}`, {
          description: `Sản phẩm: ${contract.product?.name}`,
          duration: 3000,
        });
      }
    }
  }, [selectedContractId, contracts, form]);

  // Tự động tính hạn sử dụng (Mặc định 30 ngày)
  useEffect(() => {
    if (harvestDateWatch) {
      const harvest = new Date(harvestDateWatch);
      const expiry = new Date(harvest);
      expiry.setDate(expiry.getDate() + 30); // Giả định 30 ngày
      form.setValue('expiryDate', format(expiry, 'yyyy-MM-dd'));
    }
  }, [harvestDateWatch, form]);

  const onSubmit = async (values: CreateLotFormValues) => {
    // Validation nghiệp vụ bổ sung
    const harvest = startOfDay(new Date(values.harvestDate));
    const now = startOfDay(new Date());

    if (isAfter(harvest, now)) {
      form.setError('harvestDate', { message: 'Ngày thu hoạch không thể ở tương lai' });
      return;
    }

    if (values.expiryDate) {
      const expiry = startOfDay(new Date(values.expiryDate));
      if (isBefore(expiry, harvest)) {
        form.setError('expiryDate', { message: 'Ngày hết hạn phải sau ngày thu hoạch' });
        return;
      }
    }

    try {
      await createLotMutation.mutateAsync({
        ...values,
        contractId: values.contractId === 'none' ? undefined : values.contractId,
        quantityKg: parseFloat(values.quantityKg),
        expiryDate: values.expiryDate || undefined,
        deviationReason: values.deviationReason || undefined,
      });
      toast.success('Nhập kho lô hàng thành công', {
        description: `Lô hàng mới đã được ghi nhận vào hệ thống.`,
      });
      form.reset();
      setNeedsDeviationReason(false);
      onClose();
    } catch (error: any) {
      // Bắt lỗi CẢNH BÁO CHÊNH LỆCH từ backend
      const errMsg = error?.response?.data?.message || error.message;
      if (errMsg && errMsg.includes('CẢNH BÁO CHÊNH LỆCH')) {
        setNeedsDeviationReason(true);
        setDeviationWarning(errMsg);
        toast.error('Có sự chênh lệch sản lượng', { description: 'Vui lòng điền lý do giải trình để tiếp tục.' });
      } else {
        toast.error('Có lỗi xảy ra khi nhập kho', { description: errMsg });
      }
    }
  };

  const handleClose = () => {
    setNeedsDeviationReason(false);
    setDeviationWarning('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden font-manrope">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Nhập kho lô hàng mới</DialogTitle>
              <DialogDescription className="text-xs">
                Ghi nhận nông sản thực tế nhập kho. Dữ liệu sẽ được dùng để truy xuất nguồn gốc.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 pt-4 space-y-5">
            {/* Source Linking Section */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="flex items-center gap-2 text-slate-600">
                <FileText className="size-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Liên kết nguồn gốc</span>
              </div>

              <FormField<CreateLotFormValues, 'contractId'>
                control={form.control as any}
                name="contractId"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 text-xs font-semibold">
                          <SelectValue placeholder="Chọn hợp đồng để tự động điền dữ liệu" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs italic">Nhập thủ công (Không qua HĐ)</SelectItem>
                        {contracts?.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs font-semibold">
                            {c.contractNo} — {c.farmer.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField<CreateLotFormValues, 'warehouseId'>
                control={form.control as any}
                name="warehouseId"
                rules={{ required: 'Vui lòng chọn kho' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Kho lưu trữ</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 text-xs">
                          <SelectValue placeholder="Chọn kho" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses?.map((w) => (
                          <SelectItem key={w.id} value={w.id} className="text-xs font-medium">{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField<CreateLotFormValues, 'productId'>
                control={form.control as any}
                name="productId"
                rules={{ required: 'Vui lòng chọn sản phẩm' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Sản phẩm</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 text-xs">
                          <SelectValue placeholder="Chọn sản phẩm" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products?.map((p) => (
                          <SelectItem key={p.id} value={p.id} className="text-xs font-medium">{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField<CreateLotFormValues, 'quantityKg'>
                control={form.control as any}
                name="quantityKg"
                rules={{
                  required: 'Nhập số lượng',
                  min: { value: 0.1, message: 'Tối thiểu 0.1kg' }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Số lượng (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} className="h-10 text-sm font-semibold" />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField<CreateLotFormValues, 'qualityGrade'>
                control={form.control as any}
                name="qualityGrade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Phẩm cấp</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 text-xs">
                          <SelectValue placeholder="Chọn hạng" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A">Hạng A (Xuất khẩu)</SelectItem>
                        <SelectItem value="B">Hạng B (Nội địa)</SelectItem>
                        <SelectItem value="C">Hạng C (Chế biến)</SelectItem>
                        <SelectItem value="REJECT" className="text-rose-500">Loại bỏ (Reject)</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <FormLabel className="text-xs font-semibold flex items-center gap-1">
                      <CalendarIcon className="size-3 text-muted-foreground" /> Ngày thu hoạch
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="h-10 text-sm font-medium" />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField<CreateLotFormValues, 'expiryDate'>
                control={form.control as any}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold flex items-center gap-1 text-amber-700">
                      <Clock className="size-3" /> Ngày hết hạn
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="h-10 text-sm font-medium bg-amber-50/30 border-amber-100" />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

            <FormField<CreateLotFormValues, 'note'>
              control={form.control as any}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">Ghi chú vận hành</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="VD: Hàng mới về từ vườn ông A, đã qua kiểm dịch sơ bộ..."
                      className="text-sm min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {needsDeviationReason && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-start gap-2">
                  <Info className="size-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800 font-medium">
                    {deviationWarning}
                  </p>
                </div>
                <FormField<CreateLotFormValues, 'deviationReason'>
                  control={form.control as any}
                  name="deviationReason"
                  rules={{ required: 'Vui lòng điền lý do giải trình' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-amber-900">Lý do giải trình (Bắt buộc)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="VD: Do mưa lớn nên rụng trái nhiều hơn dự kiến..."
                          className="h-10 text-sm border-amber-300 focus-visible:ring-amber-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="text-sm font-medium text-muted-foreground"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={createLotMutation.isPending}
                className="min-w-[140px]"
              >
                {createLotMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  'Xác nhận nhập kho'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
