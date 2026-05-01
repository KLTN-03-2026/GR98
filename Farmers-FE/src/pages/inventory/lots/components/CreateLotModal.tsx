import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { PendingHarvest, QualityGrade, CreateLotInput } from '../api/types';

const formSchema = z.object({
  warehouseId: z.string().min(1, 'Vui lòng chọn kho hàng'),
  quantityKg: z.number({ message: 'Vui lòng nhập số' }).positive('Số lượng phải lớn hơn 0'),
  qualityGrade: z.string().min(1, 'Vui lòng chọn phẩm cấp'),
  harvestDate: z.string().min(1, 'Vui lòng chọn ngày thu hoạch'),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateLotModalProps {
  harvest: PendingHarvest | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLotInput) => void;
  warehouses: any[];
}

export function CreateLotModal({
  harvest,
  isOpen,
  onClose,
  onSubmit,
  warehouses,
}: CreateLotModalProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      warehouseId: '',
      quantityKg: 0,
      qualityGrade: 'A',
      harvestDate: new Date().toISOString().split('T')[0],
      note: '',
    },
  });

  const actualWeight = form.watch('quantityKg');
  const estimateWeight = harvest?.yieldEstimateKg || 0;

  const deviation = useMemo(() => {
    if (!estimateWeight || !actualWeight) return 0;
    return Math.abs(actualWeight - estimateWeight) / estimateWeight;
  }, [actualWeight, estimateWeight]);

  const isDeviationHigh = deviation > 0.05;

  useEffect(() => {
    if (harvest) {
      form.reset({
        warehouseId: '',
        quantityKg: harvest.yieldEstimateKg,
        qualityGrade: 'A',
        harvestDate: new Date().toISOString().split('T')[0],
        note: '',
      });
    }
  }, [harvest, form]);

  const handleFormSubmit = (values: FormValues) => {
    console.log('Harvest data for submission:', harvest);
    if (!harvest) return;

    if (isDeviationHigh && !values.note) {
      form.setError('note', { message: 'Bắt buộc nhập lý do khi sai lệch > 5%' });
      return;
    }

    const activeContract = harvest.plot.contracts[0];
    const realProductId = activeContract?.product?.id || '';

    if (!realProductId) {
      toast.error('Không tìm thấy thông tin sản phẩm liên kết với hợp đồng này.');
      return;
    }

    onSubmit({
      ...values,
      qualityGrade: values.qualityGrade as QualityGrade,
      reportId: harvest.id,
      productId: realProductId,
      contractId: activeContract?.id,
      deviationReason: isDeviationHigh ? values.note : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Đối soát & Nhập lô hàng</DialogTitle>
        </DialogHeader>

        {harvest && (
          <div className="bg-muted/50 p-3 rounded-lg mb-4 text-sm flex gap-4">
            <div className="flex-1">
              <p className="text-muted-foreground">Sản phẩm</p>
              <p className="font-semibold">{harvest.plot.cropType}</p>
            </div>
            <div className="flex-1">
              <p className="text-muted-foreground">Dự kiến (Supervisor)</p>
              <p className="font-semibold text-primary">{harvest.yieldEstimateKg.toLocaleString()} kg</p>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="warehouseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kho tiếp nhận</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn kho hàng" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantityKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Khối lượng thực tế (kg)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === '' ? 0 : Number(val));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="qualityGrade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phẩm cấp</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn phẩm cấp" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A">Loại A</SelectItem>
                        <SelectItem value="B">Loại B</SelectItem>
                        <SelectItem value="C">Loại C</SelectItem>
                        <SelectItem value="REJECT">Loại Loại bỏ (Reject)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isDeviationHigh && (
              <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle>Cảnh báo sai lệch sản lượng</AlertTitle>
                <AlertDescription>
                  Sản lượng thực tế lệch {(deviation * 100).toFixed(1)}% so với dự kiến. Vui lòng nhập lý do giải trình.
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú / Giải trình {isDeviationHigh && <span className="text-destructive">*</span>}</FormLabel>
                  <FormControl>
                    <Input placeholder={isDeviationHigh ? "Nhập lý do sai lệch..." : "Ghi chú thêm..."} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
              <Button type="submit">Xác nhận nhập kho</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
