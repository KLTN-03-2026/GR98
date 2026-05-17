import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  MapPin,
  FileText,
  Calendar,
  Tag,
  Image as ImageIcon,
  Pencil,
  Save,
  X,
  Activity,
  BadgeCheck,
  QrCode,
  ShieldCheck,
  Fingerprint,
  Loader2,
  Sprout,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  PRODUCT_STATUS_LABELS,
  type ProductStatus,
  type Product,
  type Category,
} from '@/client/types';
import { toast } from 'sonner';
import FileUpload from '@/components/custom/file-upload';
import {
  useImageUploader,
  useSingleImageUploader,
} from '@/client/hooks/use-image-uploader';
import { ImageUploadTile } from '@/client/components/image-upload-tile';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

interface ProductDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  categories: Category[];
  onUpdate: (data: any) => Promise<void>;
  isUpdating?: boolean;
}

export function ProductDetailsDialog({
  open,
  onOpenChange,
  product,
  categories,
  onUpdate,
  isUpdating,
}: ProductDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [selectedZoomImage, setSelectedZoomImage] = useState<string | null>(null);
  const gallery = useImageUploader({ folder: 'products', maxImages: 12 });
  const thumb = useSingleImageUploader({ folder: 'products' });
  const isUploadingGallery = gallery.isUploading;
  const isUploadingThumbnail = thumb.isUploading;
  const [form, setForm] = useState({
    name: '',
    description: '',
    minOrderKg: 1,
    unit: 'kg',
    status: 'DRAFT' as ProductStatus,
    imageUrls: [] as string[],
    thumbnailUrl: '',
    categoryIds: [] as string[],
    pricePerKg: 0,
    stockKg: 0,
    grade: 'A' as any,
    cropType: '',
    harvestDate: '',
    plotId: '',
    contractId: '',
    sku: '',
  });

  // Reset state when drawer opens or product changes
  useEffect(() => {
    if (open && product) {
      setIsEditing(false);
      setActiveTab('general');
      setForm({
        name: product.name || '',
        description: product.description || '',
        minOrderKg: product.minOrderKg || 1,
        unit: product.unit || 'kg',
        status: product.status || 'DRAFT',
        imageUrls: product.imageUrls || [],
        thumbnailUrl: product.thumbnailUrl || product.imageUrls?.[0] || '',
        categoryIds: product.categories?.map((c: any) => c.id) || [],
        pricePerKg: product.pricePerKg || 0,
        stockKg: product.stockKg || 0,
        grade: product.grade || 'A',
        cropType: product.cropType || '',
        harvestDate: product.harvestDate || '',
        plotId: product.plotId || '',
        contractId: product.contractId || '',
        sku: product.sku || '',
      });
      gallery.setFromUrls(product.imageUrls || []);
      thumb.setFromUrl(product.thumbnailUrl || product.imageUrls?.[0] || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product]);

  // Đồng bộ urls từ uploader → form (form là source of truth khi onUpdate gửi BE).
  useEffect(() => {
    setForm((prev) =>
      prev.imageUrls.join('|') === gallery.urls.join('|')
        ? prev
        : {
            ...prev,
            imageUrls: gallery.urls,
            thumbnailUrl: prev.thumbnailUrl || gallery.urls[0] || '',
          },
    );
  }, [gallery.urls]);

  useEffect(() => {
    if (thumb.url && thumb.url !== form.thumbnailUrl) {
      setForm((prev) => ({ ...prev, thumbnailUrl: thumb.url! }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thumb.url]);

  if (!product) return null;

  const handleMultiFileUpload = async (files: File[]) => {
    await gallery.addFiles(files);
  };

  const handleThumbnailUpload = async (file: File) => {
    await thumb.upload(file);
    // toast success is shown after BE save; uploader already toasts errors
  };

  const toggleCategory = (id: string) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((cid) => cid !== id)
        : [...prev.categoryIds, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm');
      return;
    }
    if (isUploadingGallery || isUploadingThumbnail) {
      toast.error('Vui lòng đợi ảnh tải lên xong');
      return;
    }

    // Filter out read-only traceability fields that the backend doesn't allow in UpdateProductDto
    const { harvestDate, plotId, contractId, ...updatePayload } = form;
    void harvestDate;
    void plotId;
    void contractId;

    await onUpdate(updatePayload);
    setIsEditing(false);
    onOpenChange(false);
  };

  const isPublished = product.status === 'PUBLISHED';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-[640px] p-0 flex flex-col h-full font-manrope shadow-2xl"
      >
        {/* HEADER */}
        <SheetHeader className="shrink-0 border-b bg-gradient-to-b from-primary/[0.06] to-transparent px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                <Package className="size-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="h-5 border-primary/30 bg-primary/5 px-2 text-[10px] font-semibold text-primary"
                  >
                    SKU: {product.sku}
                  </Badge>
                  <Badge
                    className={cn(
                      'h-5 px-2 text-[10px] font-semibold border',
                      isPublished
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200',
                    )}
                  >
                    {PRODUCT_STATUS_LABELS[product.status]}
                  </Badge>
                </div>
                <SheetTitle className="truncate text-xl font-bold text-foreground">
                  {isEditing ? 'Chỉnh sửa sản phẩm' : product.name}
                </SheetTitle>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="size-3.5" />
                  Chỉnh sửa
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-1.5 text-muted-foreground"
                  onClick={() => setIsEditing(false)}
                >
                  <X className="size-3.5" />
                  Hủy
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* QUICK STATS */}
        <div className="shrink-0 border-b bg-slate-50/40 px-6 py-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={Tag} label="Giá niêm yết" tone="emerald">
              {isEditing ? (
                <Input
                  type="number"
                  value={form.pricePerKg}
                  onChange={(e) => setForm({ ...form, pricePerKg: Number(e.target.value) })}
                  className="h-8 text-sm font-semibold"
                />
              ) : (
                <p className="text-lg font-bold tabular-nums text-foreground">
                  {formatPrice(product.pricePerKg)}
                </p>
              )}
              <p className="mt-0.5 text-[10px] text-muted-foreground">đ / {product.unit || 'kg'}</p>
            </StatCard>

            <StatCard icon={Package} label="Tồn kho" tone="primary">
              {isEditing ? (
                <Input
                  type="number"
                  value={form.stockKg}
                  onChange={(e) => setForm({ ...form, stockKg: Number(e.target.value) })}
                  className="h-8 text-sm font-semibold"
                />
              ) : (
                <p className={cn(
                  'text-lg font-bold tabular-nums',
                  product.stockKg <= 0 ? 'text-muted-foreground' : 'text-foreground',
                )}>
                  {product.stockKg.toLocaleString('vi-VN')}{' '}
                  <span className="text-xs font-medium text-muted-foreground">
                    {product.unit || 'kg'}
                  </span>
                </p>
              )}
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {product.stockKg <= 0 ? 'Chưa có hàng — nhập kho để đăng bán' : 'Khả dụng trong kho'}
              </p>
            </StatCard>

            <StatCard icon={Activity} label="Trạng thái" tone="blue">
              {isEditing ? (
                <Select
                  value={form.status}
                  onValueChange={(val) => setForm({ ...form, status: val as ProductStatus })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRODUCT_STATUS_LABELS).map(([key, label]) => {
                      const noStock = product.stockKg <= 0 && key === 'PUBLISHED';
                      return (
                        <SelectItem key={key} value={key} disabled={noStock}>
                          <span className={noStock ? 'text-muted-foreground' : undefined}>
                            {label}
                            {noStock && ' — chưa có hàng trong kho'}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'size-2 rounded-full',
                      isPublished
                        ? 'bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]'
                        : 'bg-slate-400',
                    )}
                  />
                  <p className="text-sm font-semibold text-foreground">
                    {PRODUCT_STATUS_LABELS[product.status]}
                  </p>
                </div>
              )}
              <p className="mt-0.5 text-[10px] text-muted-foreground">Trạng thái thương mại</p>
            </StatCard>

            <StatCard icon={BadgeCheck} label="Chất lượng" tone="amber">
              {isEditing ? (
                <Select
                  value={form.grade}
                  onValueChange={(val) => setForm({ ...form, grade: val })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['A', 'B', 'C', 'REJECT'].map((g) => (
                      <SelectItem key={g} value={g}>
                        Hạng {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-lg font-bold text-foreground">Hạng {product.grade}</p>
              )}
              <p className="mt-0.5 text-[10px] text-muted-foreground">Phẩm cấp nông sản</p>
            </StatCard>
          </div>
        </div>

        {/* TABS */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="shrink-0 border-b bg-background px-6 pt-3">
            <TabsList className="h-9 bg-muted/60">
              <TabsTrigger value="general" className="text-xs">
                <FileText className="size-3.5 mr-1.5" />
                Thông tin & Truy xuất
              </TabsTrigger>
              <TabsTrigger value="media" className="text-xs">
                <ImageIcon className="size-3.5 mr-1.5" />
                Hình ảnh Album
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* TAB: GENERAL */}
            <TabsContent value="general" className="m-0 p-6 space-y-5">
              {isEditing ? (
                <>
                  {/* Thông tin cơ bản */}
                  <Section title="Thông tin cơ bản" icon={FileText} tone="primary">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="Tên sản phẩm">
                        <Input
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                      </Field>
                      <Field label="Mã SKU">
                        <Input
                          value={form.sku}
                          onChange={(e) => setForm({ ...form, sku: e.target.value })}
                          className="font-mono"
                        />
                      </Field>
                      <Field label="Đơn vị tính">
                        <Input
                          value={form.unit}
                          onChange={(e) => setForm({ ...form, unit: e.target.value })}
                        />
                      </Field>
                      <Field label="Đặt hàng tối thiểu">
                        <Input
                          type="number"
                          value={form.minOrderKg}
                          onChange={(e) =>
                            setForm({ ...form, minOrderKg: Number(e.target.value) })
                          }
                        />
                      </Field>
                    </div>
                  </Section>

                  {/* Truy xuất nguồn gốc */}
                  <Section title="Truy xuất nguồn gốc" icon={Fingerprint} tone="emerald">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="Loại giống cây">
                        <Input
                          value={form.cropType}
                          onChange={(e) => setForm({ ...form, cropType: e.target.value })}
                        />
                      </Field>
                      <Field label="Ngày thu hoạch">
                        <Input
                          type="date"
                          value={form.harvestDate?.split('T')[0]}
                          onChange={(e) => setForm({ ...form, harvestDate: e.target.value })}
                        />
                      </Field>
                      <Field label="Mã vùng trồng (Plot)">
                        <Input
                          value={form.plotId}
                          onChange={(e) => setForm({ ...form, plotId: e.target.value })}
                          className="font-mono"
                        />
                      </Field>
                      <Field label="Mã hợp đồng">
                        <Input
                          value={form.contractId}
                          onChange={(e) => setForm({ ...form, contractId: e.target.value })}
                          className="font-mono"
                        />
                      </Field>
                    </div>
                  </Section>

                  {/* Danh mục */}
                  <Section title="Danh mục sản phẩm" icon={Sprout} tone="blue">
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => {
                        const active = form.categoryIds.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleCategory(cat.id)}
                            className={cn(
                              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                              active
                                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary',
                            )}
                          >
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                  </Section>

                  {/* Mô tả */}
                  <Section title="Mô tả sản phẩm" icon={ShieldCheck} tone="indigo">
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Nhập mô tả chi tiết sản phẩm..."
                      className="w-full min-h-[140px] resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    />
                  </Section>
                </>
              ) : (
                <>
                  {/* Thông tin chung */}
                  <Section title="Thông tin chung" icon={FileText} tone="primary">
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <InfoRow label="Mã định danh SKU">
                        <span className="inline-flex items-center rounded-md border border-primary/15 bg-primary/5 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                          {product.sku}
                        </span>
                      </InfoRow>
                      <InfoRow label="Đơn vị kinh doanh">
                        Mỗi {product.unit || 'kg'}
                      </InfoRow>
                      <InfoRow label="Chính sách đặt hàng">
                        Tối thiểu {product.minOrderKg} {product.unit || 'kg'} / đơn
                      </InfoRow>
                      {product.categories?.length ? (
                        <InfoRow label="Danh mục">
                          <div className="flex flex-wrap gap-1">
                            {product.categories.map((c: any) => (
                              <Badge
                                key={c.id}
                                variant="outline"
                                className="font-normal"
                              >
                                {c.name}
                              </Badge>
                            ))}
                          </div>
                        </InfoRow>
                      ) : null}
                    </dl>
                  </Section>

                  {/* Truy xuất nguồn gốc */}
                  <Section title="Truy xuất nguồn gốc" icon={Fingerprint} tone="emerald">
                    {(product.contributingFarmCount ?? 0) > 1 ? (
                      // Sản phẩm gộp từ nhiều plot/hợp đồng → một plot/contract đơn
                      // không phản ánh đúng nguồn gốc. Hiển thị tổng quan + link sang
                      // trang truy xuất để xem chi tiết từng nông trại.
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                          <Sprout className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-emerald-800">
                              Sản phẩm gộp từ {product.contributingFarmCount} nông trại
                            </p>
                            <p className="text-xs text-emerald-700/80">
                              Cùng loại, cùng giống và phẩm cấp. Xem hành trình chi
                              tiết của từng nông trại ở trang truy xuất nguồn gốc.
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2.5">
                          <TraceRow
                            icon={Calendar}
                            label="Ngày thu hoạch"
                            value={
                              product.harvestDate
                                ? new Date(product.harvestDate).toLocaleDateString(
                                    'vi-VN',
                                    { dateStyle: 'long' },
                                  )
                                : 'Nhiều đợt thu hoạch'
                            }
                          />
                        </div>
                        {product.slug && (
                          <a
                            href={`/traceability/${product.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Fingerprint className="h-3.5 w-3.5" />
                            Xem chi tiết truy xuất
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <TraceRow
                          icon={Calendar}
                          label="Ngày thu hoạch"
                          value={
                            product.harvestDate
                              ? new Date(product.harvestDate).toLocaleDateString(
                                  'vi-VN',
                                  { dateStyle: 'long' },
                                )
                              : 'Chưa cập nhật'
                          }
                        />
                        <TraceRow
                          icon={MapPin}
                          label="Vùng canh tác (Plot)"
                          value={
                            (product.plot?.plotCode as string | undefined) ||
                            product.plotId ||
                            '—'
                          }
                          mono
                        />
                        <TraceRow
                          icon={FileText}
                          label="Mã hợp đồng liên kết"
                          value={
                            (product.contract?.contractNo as string | undefined) ||
                            product.contractId ||
                            '—'
                          }
                          mono
                        />
                      </div>
                    )}
                  </Section>

                  {/* AI Confidence */}
                  {product.aiConfidenceScore !== undefined && (
                    <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/[0.07] to-primary/[0.02] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-primary">
                            <ShieldCheck className="size-4" />
                            <p className="text-[11px] font-bold uppercase tracking-wider">
                              Minh bạch dữ liệu AI
                            </p>
                          </div>
                          <div className="mt-2 flex items-end justify-between gap-2">
                            <span className="text-xs text-muted-foreground">
                              Độ tin cậy xác thực
                            </span>
                            <span className="text-lg font-bold text-primary tabular-nums">
                              {product.aiConfidenceScore}%
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${product.aiConfidenceScore}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-white">
                          <QrCode className="size-9 text-primary" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Giới thiệu */}
                  <Section title="Giới thiệu sản phẩm" icon={ShieldCheck} tone="indigo">
                    <p className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                      {product.description?.trim() || (
                        <span className="text-muted-foreground italic">
                          Chưa có mô tả chi tiết cho sản phẩm này.
                        </span>
                      )}
                    </p>
                  </Section>

                  {/* System info footer */}
                  <div className="pt-2 text-[11px] text-muted-foreground">
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <span className="font-mono">ID: {product.id.slice(-12)}</span>
                      <span>•</span>
                      <span className="font-mono">{product.slug}</span>
                      <span>•</span>
                      <span>
                        Tạo: {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            {/* TAB: MEDIA */}
            <TabsContent value="media" className="m-0 p-6 space-y-5">
              {isEditing ? (
                <>
                  <Section title="Ảnh đại diện (Thumbnail)" icon={ImageIcon} tone="primary">
                    <FileUpload multiple={false} onFileSelect={handleThumbnailUpload} />
                    {thumb.item && (
                      <div className="mt-3">
                        <ImageUploadTile
                          item={thumb.item}
                          onRemove={thumb.clear}
                          onRetry={() => void thumb.retry()}
                          className="aspect-video"
                        />
                      </div>
                    )}
                  </Section>

                  <Section
                    title={`Album hình ảnh (${gallery.items.length})`}
                    icon={ImageIcon}
                    tone="blue"
                  >
                    <FileUpload multiple onFilesSelect={handleMultiFileUpload} />
                    {gallery.items.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {gallery.items.map((item) => (
                          <ImageUploadTile
                            key={item.id}
                            item={item}
                            onRemove={() => gallery.remove(item.id)}
                            onRetry={() => void gallery.retry(item.id)}
                            className="aspect-square"
                          />
                        ))}
                      </div>
                    )}
                  </Section>
                </>
              ) : (
                <>
                  <Section title="Ảnh đại diện chính" icon={ImageIcon} tone="primary">
                    {product.thumbnailUrl || product.imageUrls?.[0] ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedZoomImage(product.thumbnailUrl || product.imageUrls[0])
                        }
                        className="group block aspect-video w-full overflow-hidden rounded-lg border bg-slate-50 transition-shadow hover:shadow-md cursor-zoom-in"
                      >
                        <img
                          src={product.thumbnailUrl || product.imageUrls[0]}
                          alt={product.name}
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </button>
                    ) : (
                      <EmptyMedia label="Chưa có ảnh đại diện" />
                    )}
                  </Section>

                  <Section
                    title={`Album chi tiết (${product.imageUrls?.length ?? 0})`}
                    icon={ImageIcon}
                    tone="blue"
                  >
                    {product.imageUrls?.length ? (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {product.imageUrls.map((url, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedZoomImage(url)}
                            className="group aspect-square overflow-hidden rounded-lg border bg-slate-50 transition-shadow hover:shadow-md cursor-zoom-in"
                          >
                            <img
                              src={url}
                              alt={`${product.name} ${i + 1}`}
                              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <EmptyMedia label="Chưa có ảnh trong album" />
                    )}
                  </Section>
                </>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* FOOTER (edit mode only) */}
        {isEditing && (
          <div className="shrink-0 border-t bg-background px-6 py-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditing(false)}
              disabled={isUpdating}
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isUpdating || isUploadingGallery || isUploadingThumbnail}
              className="gap-1.5"
            >
              {isUpdating || isUploadingGallery || isUploadingThumbnail ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Lưu thay đổi
            </Button>
          </div>
        )}
      </SheetContent>

      {/* Lightbox Dialog */}
      <Dialog
        open={!!selectedZoomImage}
        onOpenChange={(o) => !o && setSelectedZoomImage(null)}
      >
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-transparent shadow-none flex items-center justify-center focus-visible:outline-none">
          <DialogTitle className="sr-only">Phóng to hình ảnh</DialogTitle>
          {selectedZoomImage && (
            <div className="relative">
              <img
                src={selectedZoomImage}
                alt="Full size"
                className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-12 right-0 size-10 rounded-full text-white hover:bg-white/10"
                onClick={() => setSelectedZoomImage(null)}
              >
                <X className="size-5" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/* Helper presentational components — chỉ phục vụ UI, không có logic.          */
/* -------------------------------------------------------------------------- */

type Tone = 'primary' | 'emerald' | 'blue' | 'amber' | 'indigo';

const TONE_TEXT: Record<Tone, string> = {
  primary: 'text-primary',
  emerald: 'text-emerald-600',
  blue: 'text-blue-600',
  amber: 'text-amber-600',
  indigo: 'text-indigo-600',
};

const TONE_BG: Record<Tone, string> = {
  primary: 'bg-primary/10',
  emerald: 'bg-emerald-50',
  blue: 'bg-blue-50',
  amber: 'bg-amber-50',
  indigo: 'bg-indigo-50',
};

function StatCard({
  icon: Icon,
  label,
  tone,
  children,
}: {
  icon: typeof Tag;
  label: string;
  tone: Tone;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white p-3 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div
          className={cn(
            'flex size-6 items-center justify-center rounded-md',
            TONE_BG[tone],
            TONE_TEXT[tone],
          )}
        >
          <Icon className="size-3.5" />
        </div>
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  tone,
  children,
}: {
  title: string;
  icon: typeof FileText;
  tone: Tone;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <header className="mb-3 flex items-center gap-2">
        <div
          className={cn(
            'flex size-7 items-center justify-center rounded-md',
            TONE_BG[tone],
            TONE_TEXT[tone],
          )}
        >
          <Icon className="size-3.5" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</h3>
      </header>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm font-semibold text-foreground">{children}</dd>
    </div>
  );
}

function TraceRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-slate-50 text-slate-500">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            'text-sm font-semibold text-foreground truncate',
            mono && 'font-mono',
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function EmptyMedia({ label }: { label: string }) {
  return (
    <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed bg-slate-50 text-muted-foreground">
      <div className="flex flex-col items-center gap-1.5">
        <ImageIcon className="size-6 opacity-50" />
        <span className="text-xs">{label}</span>
      </div>
    </div>
  );
}
