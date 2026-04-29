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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateLotGrade } from '../api';
import { toast } from 'sonner';
import { Loader2, RefreshCcw, AlertTriangle } from 'lucide-react';
import type { InventoryLot } from '../api/types';

interface UpdateGradeModalProps {
  lot: InventoryLot | null;
  isOpen: boolean;
  onClose: () => void;
}

interface UpdateGradeFormValues {
  qualityGrade: string;
  note: string;
}

export default function UpdateGradeModal({ lot, isOpen, onClose }: UpdateGradeModalProps) {
  const updateGradeMutation = useUpdateLotGrade();

  const form = useForm<UpdateGradeFormValues>({
    defaultValues: {
      qualityGrade: lot?.qualityGrade || 'A',
      note: '',
    },
  });

  // Reset form when lot changes
  if (lot && form.getValues('qualityGrade') !== lot.qualityGrade && !form.formState.isDirty) {
    form.reset({
      qualityGrade: lot.qualityGrade,
      note: '',
    });
  }

  const onSubmit = async (values: UpdateGradeFormValues) => {
    if (!lot) return;

    if (values.qualityGrade === lot.qualityGrade) {
      toast.error('Phẩm cấp mới phải khác phẩm cấp hiện tại');
      return;
    }

    try {
      await updateGradeMutation.mutateAsync({
        id: lot.id,
        qualityGrade: values.qualityGrade as any,
        note: values.note,
      });
      toast.success('Cập nhật phẩm cấp thành công', {
        description: `Lô hàng ${lot.id.slice(-8)} đã được chuyển sang Hạng ${values.qualityGrade}`,
      });
      onClose();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật phẩm cấp');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden font-manrope">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
              <RefreshCcw className="size-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Cập nhật Phẩm cấp</DialogTitle>
              <DialogDescription className="text-xs">
                Thay đổi phân loại chất lượng của lô hàng. Hệ thống sẽ ghi lại nhật ký điều chỉnh.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 pt-4 space-y-5">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Sản phẩm hiện tại</span>
                <span className="text-sm font-semibold text-slate-900">{lot?.product.name}</span>
                <span className="text-[10px] font-medium text-slate-500">Mã Lô: {lot?.id.slice(-12)}</span>
              </div>
              <div className="ml-auto flex flex-col items-end">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Hạng hiện tại</span>
                <Badge variant="outline" className="mt-1 border-amber-200 text-amber-700 bg-amber-50 font-bold">
                  HẠNG {lot?.qualityGrade}
                </Badge>
              </div>
            </div>

            <FormField<UpdateGradeFormValues, 'qualityGrade'>
              control={form.control as any}
              name="qualityGrade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">Phẩm cấp mới</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Chọn hạng mới" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="A">Hạng A (Xuất khẩu)</SelectItem>
                      <SelectItem value="B">Hạng B (Nội địa)</SelectItem>
                      <SelectItem value="C">Hạng C (Chế biến)</SelectItem>
                      <SelectItem value="REJECT" className="text-rose-500">Loại bỏ (Reject)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField<UpdateGradeFormValues, 'note'>
              control={form.control as any}
              name="note"
              rules={{ required: 'Vui lòng nhập lý do thay đổi phẩm cấp' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">Lý do điều chỉnh (Bắt buộc)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="VD: Phát hiện dấu hiệu hư hỏng bề mặt, hạ cấp để xử lý nhanh..."
                      className="text-sm min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <p className="text-[10px] font-medium leading-relaxed">
                Lưu ý: Thay đổi phẩm cấp sẽ ảnh hưởng đến giá bán dự kiến và bảng cân đối cung cầu.
              </p>
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-sm font-medium text-muted-foreground"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={updateGradeMutation.isPending}
                className="min-w-[120px]"
              >
                {updateGradeMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  'Lưu thay đổi'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
