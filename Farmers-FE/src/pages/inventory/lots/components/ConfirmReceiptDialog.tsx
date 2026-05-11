import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useConfirmReceipt } from '../api/hooks';
import { toast } from 'sonner';
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ImagePlus,
  X,
  FileSignature,
} from 'lucide-react';
import type { InventoryLot } from '../api/types';
import { cn } from '@/lib/utils';
import { uploadImage } from '@/client/api/upload/upload-api';
import {
  generateReceiptNo,
  serializeReceiptMetadata,
  RECEIPT_CONDITION_LABEL,
  type ReceiptCondition,
  type ReceiptMetadata,
} from './receipt-metadata';

interface ConfirmReceiptDialogProps {
  lot: InventoryLot;
  isOpen: boolean;
  onClose: () => void;
}

interface FormValues {
  actualWeight: number;
  receivedAt: string;
  delivererName: string;
  delivererPhone: string;
  vehiclePlate: string;
  invoiceNo: string;
  condition: ReceiptCondition;
  note: string;
}

const MAX_PHOTOS = 5;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB

/** Định dạng datetime-local: YYYY-MM-DDTHH:mm (timezone của trình duyệt). */
function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ConfirmReceiptDialog({ lot, isOpen, onClose }: ConfirmReceiptDialogProps) {
  const confirmMutation = useConfirmReceipt();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const receiptNo = useMemo(() => generateReceiptNo(lot.id), [lot.id]);

  const form = useForm<FormValues>({
    defaultValues: {
      actualWeight: lot.quantityKg,
      receivedAt: toLocalInputValue(new Date()),
      delivererName: lot.contract?.farmer?.fullName ?? '',
      delivererPhone: lot.contract?.farmer?.phone ?? '',
      vehiclePlate: '',
      invoiceNo: '',
      condition: 'OK',
      note: '',
    },
  });

  const enteredWeight = form.watch('actualWeight');
  const condition = form.watch('condition');
  const deviation = lot.quantityKg > 0 ? enteredWeight - lot.quantityKg : 0;
  const deviationPercent = lot.quantityKg > 0 ? (Math.abs(deviation) / lot.quantityKg) * 100 : 0;
  const requireNote = deviationPercent > 5 || condition !== 'OK';

  useEffect(() => {
    if (isOpen) {
      form.reset({
        actualWeight: lot.quantityKg,
        receivedAt: toLocalInputValue(new Date()),
        delivererName: lot.contract?.farmer?.fullName ?? '',
        delivererPhone: lot.contract?.farmer?.phone ?? '',
        vehiclePlate: '',
        invoiceNo: '',
        condition: 'OK',
        note: '',
      });
      setPhotos([]);
    }
  }, [isOpen, lot, form]);

  const handlePickPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    if (photos.length + files.length > MAX_PHOTOS) {
      toast.error(`Tối đa ${MAX_PHOTOS} ảnh`);
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast.error(`"${file.name}" không phải file ảnh`);
          continue;
        }
        if (file.size > MAX_PHOTO_SIZE) {
          toast.error(`Ảnh "${file.name}" vượt quá 5MB`);
          continue;
        }
        const res = await uploadImage(file, 'goods-receipts');
        uploaded.push(res.url);
      }
      if (uploaded.length > 0) {
        setPhotos((prev) => [...prev, ...uploaded]);
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Tải ảnh thất bại');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (url: string) => {
    setPhotos((prev) => prev.filter((p) => p !== url));
  };

  const onSubmit = (values: FormValues) => {
    if (requireNote && !values.note.trim()) {
      toast.error('Vui lòng nhập ghi chú giải trình');
      return;
    }
    if (!values.delivererName.trim()) {
      toast.error('Vui lòng nhập họ tên người giao hàng');
      return;
    }

    const meta: ReceiptMetadata = {
      kind: 'goods-receipt',
      receiptNo,
      receivedAt: new Date(values.receivedAt).toISOString(),
      deliverer: {
        name: values.delivererName.trim(),
        phone: values.delivererPhone.trim(),
      },
      vehiclePlate: values.vehiclePlate.trim(),
      invoiceNo: values.invoiceNo.trim(),
      condition: values.condition,
      photos,
      comment: values.note.trim(),
    };

    confirmMutation.mutate(
      {
        lotId: lot.id,
        actualWeight: values.actualWeight,
        note: serializeReceiptMetadata(meta),
      },
      {
        onSuccess: () => {
          toast.success('Xác nhận nhập kho thành công');
          onClose();
        },
        onError: (error: any) => {
          const errorMessage =
            error.response?.data?.message || error.message || 'Có lỗi xảy ra khi xác nhận';
          toast.error(`Thất bại: ${errorMessage}`);
        },
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <CheckCircle2 className="size-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Phiếu nhập kho</span>
          </div>
          <DialogTitle className="text-xl font-bold">Hoàn tất quy trình nhập hàng</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Section 1: Header phiếu */}
            <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <FileSignature className="size-3.5" />
                Thông tin phiếu nhập
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase">
                    Số phiếu
                  </label>
                  <Input
                    value={receiptNo}
                    readOnly
                    className="h-9 mt-1 bg-white font-mono text-xs"
                  />
                </div>

                <FormField
                  control={form.control}
                  name="receivedAt"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormLabel className="text-[11px] font-semibold text-slate-500 uppercase">
                        Ngày giờ nhập
                      </FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} className="h-9 mt-1 bg-white" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="delivererName"
                  rules={{ required: 'Bắt buộc' }}
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormLabel className="text-[11px] font-semibold text-slate-500 uppercase">
                        Người giao hàng *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Họ tên người giao"
                          {...field}
                          className="h-9 mt-1 bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="delivererPhone"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormLabel className="text-[11px] font-semibold text-slate-500 uppercase">
                        SĐT
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="0900..." {...field} className="h-9 mt-1 bg-white" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="vehiclePlate"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormLabel className="text-[11px] font-semibold text-slate-500 uppercase">
                        Biển số xe
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="51A-123.45"
                          {...field}
                          className="h-9 mt-1 bg-white"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="invoiceNo"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormLabel className="text-[11px] font-semibold text-slate-500 uppercase">
                        Số hoá đơn / phiếu giao
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(nếu có)"
                          {...field}
                          className="h-9 mt-1 bg-white"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* Section 2: Khối lượng & Kiểm phẩm */}
            <section className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Khối lượng dự kiến:</span>
                  <span className="font-bold text-slate-900">
                    {lot.quantityKg.toLocaleString('vi-VN')} kg
                  </span>
                </div>
              </div>

              <FormField
                control={form.control}
                name="actualWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">
                      Khối lượng thực nhập (kg)
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          className="h-12 text-xl font-bold pr-12 focus:ring-emerald-500 border-emerald-100"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                          KG
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />

                    {deviation !== 0 && (
                      <div
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-lg text-xs mt-2',
                          deviationPercent > 5
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100',
                        )}
                      >
                        {deviationPercent > 5 ? (
                          <AlertTriangle className="size-3.5" />
                        ) : (
                          <CheckCircle2 className="size-3.5" />
                        )}
                        <span>
                          Chênh lệch: {deviation > 0 ? '+' : ''}
                          {deviation.toFixed(1)} kg ({deviationPercent.toFixed(1)}%)
                          {deviationPercent > 5 && ' — Vui lòng nhập lý do giải trình'}
                        </span>
                      </div>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Tình trạng cảm quan</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(RECEIPT_CONDITION_LABEL) as ReceiptCondition[]).map((k) => (
                          <SelectItem key={k} value={k}>
                            {RECEIPT_CONDITION_LABEL[k]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Ảnh đính kèm */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold">
                    Ảnh đính kèm{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      (hàng hoá, phiếu cân, hoá đơn — tối đa {MAX_PHOTOS} ảnh, ≤5MB/ảnh)
                    </span>
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {photos.length}/{MAX_PHOTOS}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {photos.map((url) => (
                    <div
                      key={url}
                      className="relative size-20 rounded-lg overflow-hidden border bg-slate-100"
                    >
                      <img src={url} alt="" className="size-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(url)}
                        className="absolute -top-1 -right-1 size-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}

                  {photos.length < MAX_PHOTOS && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="size-20 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors disabled:opacity-50"
                    >
                      {isUploading ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <>
                          <ImagePlus className="size-5" />
                          <span className="text-[10px] mt-1 font-semibold">Thêm ảnh</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePickPhotos}
                />
              </div>
            </section>

            {/* Section 3: Ghi chú */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">
                    Ghi chú nhập kho
                    {requireNote && <span className="text-rose-500 ml-1">*</span>}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Ghi chú về tình trạng hàng hoá, lý do chênh lệch (nếu có)..."
                      className="min-h-[90px] resize-none"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={
                  confirmMutation.isPending ||
                  isUploading ||
                  (requireNote && !form.watch('note').trim())
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 rounded-xl"
              >
                {confirmMutation.isPending ? (
                  <Loader2 className="animate-spin size-4 mr-2" />
                ) : null}
                Xác nhận nhập kho
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
