import { useState, useEffect } from 'react';
import {
  ImageIcon,
  CheckCircle2,
  ShoppingBag,
  Info,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  PRODUCT_STATUS_LABELS,
  type Product,
  type ProductStatus,
} from '@/client/types';
import { CROP_CONFIG, getVarietiesForCrop } from '@/client/data/crop-config';
import { useImageUploader } from '@/client/hooks/use-image-uploader';
import { ImageUploadTile } from '@/client/components/image-upload-tile';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  product?: Product;
  onSubmit: (data: any) => void;
  categories: any[];
}

const MAX_GALLERY_IMAGES = 12;

export function ProductDialog({
  open,
  onOpenChange,
  mode,
  product,
  onSubmit,
  categories,
}: ProductDialogProps) {
  const [activeTab, setActiveTab] = useState('marketing');
  const gallery = useImageUploader({ folder: 'products', maxImages: MAX_GALLERY_IMAGES });
  const [form, setForm] = useState({
    name: '',
    description: '',
    variety: '',
    minOrderKg: 1,
    unit: 'kg',
    status: 'DRAFT' as ProductStatus,
    thumbnailUrl: '',
    categoryIds: [] as string[],
  });

  useEffect(() => {
    if (open) {
      setActiveTab('marketing');
      if (product && mode === 'edit') {
        setForm({
          name: product.name,
          description: product.description || '',
          variety: product.variety || '',
          minOrderKg: product.minOrderKg,
          unit: product.unit || 'kg',
          status: product.status,
          thumbnailUrl: (product as any).thumbnailUrl || product.imageUrls?.[0] || '',
          categoryIds: product.categories?.map((c) => c.id) || [],
        });
        gallery.setFromUrls(product.imageUrls || []);
      } else {
        setForm({
          name: '',
          description: '',
          variety: '',
          minOrderKg: 1,
          unit: 'kg',
          status: 'DRAFT',
          thumbnailUrl: '',
          categoryIds: [],
        });
        gallery.clear();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, mode, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm');
      return;
    }
    if (gallery.isUploading) {
      toast.error('Vui lòng đợi ảnh tải lên xong');
      return;
    }
    const imageUrls = gallery.urls;
    const thumbnailUrl = form.thumbnailUrl || imageUrls[0] || '';
    onSubmit({ ...form, imageUrls, thumbnailUrl });
  };

  const toggleCategory = (id: string) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((cid) => cid !== id)
        : [...prev.categoryIds, id],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[85vh] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white font-manrope flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">

          <DialogHeader className="px-10 pt-8 pb-4 border-b border-slate-50 bg-white shrink-0">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1.5">
                <DialogTitle className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                    <ShoppingBag className="size-5" />
                  </div>
                  {mode === 'create' ? 'Phát hành niêm yết' : 'Cập nhật thương mại'}
                </DialogTitle>
                <DialogDescription className="text-xs font-medium text-slate-400 ml-1">
                  Chỉnh sửa các thông số hiển thị và truyền thông cho sản phẩm.
                </DialogDescription>
              </div>

              <div className="hidden md:flex items-center gap-2">
                <div className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-2",
                  form.status === 'PUBLISHED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                )}>
                  <div className={cn("size-1.5 rounded-full", form.status === 'PUBLISHED' ? "bg-emerald-500" : "bg-slate-300")} />
                  {PRODUCT_STATUS_LABELS[form.status]}
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-slate-100/50 p-1 rounded-2xl h-12 w-full grid grid-cols-2 gap-1">
                <TabsTrigger value="marketing" className="rounded-xl text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 transition-all">
                  1. Thông tin bán hàng
                </TabsTrigger>
                <TabsTrigger value="media" className="rounded-xl text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 transition-all">
                  2. Hình ảnh & Mô tả
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </DialogHeader>

          {/* Body Section with Tabs Content */}
          <Tabs value={activeTab} className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar bg-slate-50/20">
              <TabsContent value="marketing" className="m-0 focus-visible:outline-none">
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-slate-900 text-white flex items-center justify-center"><Info className="size-4" /></div>
                    <div className="flex flex-col">
                        <h3 className="text-sm font-bold text-slate-900">Nội dung hiển thị</h3>
                        <p className="text-[10px] font-medium text-slate-400">Tên gọi và các thông số thương mại cơ bản</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2 space-y-3">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tên sản phẩm thương mại <span className="text-rose-500">*</span></Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Ví dụ: Sầu riêng Ri6 Chín Hóa (Loại 1)"
                        className="h-14 rounded-[2rem] border-slate-200 bg-white px-8 text-base font-bold text-slate-900 placeholder:text-slate-300 focus-visible:ring-emerald-500/5 focus-visible:border-emerald-500 transition-all shadow-sm"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Giống cây</Label>
                      <div className="flex gap-2">
                        <select
                          value={form.variety}
                          onChange={(e) => setForm({ ...form, variety: e.target.value })}
                          className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                        >
                          <option value="">-- Chọn giống --</option>
                          {product?.cropType && getVarietiesForCrop(product.cropType).map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                          {product?.cropType && CROP_CONFIG.length === 0 && null}
                        </select>
                        <input
                          type="text"
                          value={form.variety}
                          onChange={(e) => setForm({ ...form, variety: e.target.value })}
                          placeholder="Hoặc gõ trực tiếp..."
                          className="h-12 w-40 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Số lượng mua tối thiểu</Label>
                      <div className="relative group">
                        <Input
                          type="number"
                          value={form.minOrderKg}
                          onChange={(e) => setForm({ ...form, minOrderKg: Number(e.target.value) })}
                          className="h-12 rounded-2xl border-slate-200 bg-white font-bold tabular-nums text-base shadow-sm px-6"
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300 uppercase">{form.unit}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Đơn vị tính</Label>
                      <Input
                        value={form.unit}
                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                        placeholder="kg, thùng, túi..."
                        className="h-12 rounded-2xl border-slate-200 bg-white font-bold text-sm shadow-sm uppercase px-6"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-3">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Trạng thái phát hành</Label>
                      <div className="flex gap-2 p-1.5 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm h-12 items-center">
                        {[
                          { id: 'PUBLISHED', label: 'Công khai (Đang bán)', active: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' },
                          { id: 'DRAFT', label: 'Lưu nháp (Ẩn)', active: 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' }
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setForm({ ...form, status: item.id as ProductStatus })}
                            className={cn(
                              "flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                              form.status === item.id ? item.active : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                            )}
                          >
                             {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Danh mục sản phẩm</Label>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleCategory(cat.id)}
                            className={cn(
                              "px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border",
                              form.categoryIds.includes(cat.id)
                                ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20"
                                : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                            )}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="media" className="m-0 focus-visible:outline-none">
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-slate-900 text-white flex items-center justify-center"><ImageIcon className="size-4" /></div>
                    <div className="flex flex-col">
                        <h3 className="text-sm font-bold text-slate-900">Mô tả & Hình ảnh</h3>
                        <p className="text-[10px] font-medium text-slate-400">Hình ảnh thực tế giúp tăng tin cậy cho niêm yết</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Giới thiệu chi tiết</Label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Nhập giới thiệu chi tiết về nông sản, phương pháp canh tác..."
                        className="w-full min-h-[160px] rounded-[2rem] border border-slate-200 bg-white px-8 py-6 text-sm font-medium text-slate-700 placeholder:text-slate-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/5 focus-visible:border-emerald-500 transition-all resize-none shadow-sm"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                          Album hình ảnh thực tế ({gallery.items.length}/{MAX_GALLERY_IMAGES}) — Click ảnh để chọn làm ảnh đại diện
                        </Label>
                        {gallery.items.length < MAX_GALLERY_IMAGES && (
                          <label className="inline-flex items-center gap-2 rounded-full bg-emerald-500 text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-emerald-600 transition-colors">
                            <Upload className="size-3.5" />
                            Thêm ảnh
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="sr-only"
                              onChange={(e) => {
                                void gallery.addFiles(e.target.files);
                                e.target.value = '';
                              }}
                            />
                          </label>
                        )}
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm min-h-[140px]">
                        {gallery.items.map((item) => {
                          const isThumb = item.status === 'done' && item.url === form.thumbnailUrl;
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                if (item.status === 'done' && item.url) {
                                  setForm((prev) => ({ ...prev, thumbnailUrl: item.url! }));
                                }
                              }}
                              className={cn(
                                'relative cursor-pointer transition-all hover:scale-[1.05] hover:z-10',
                                isThumb && 'ring-4 ring-emerald-500/20 rounded-[1.5rem]',
                              )}
                            >
                              <ImageUploadTile
                                item={item}
                                onRemove={() => {
                                  gallery.remove(item.id);
                                  if (item.url === form.thumbnailUrl) {
                                    setForm((prev) => ({ ...prev, thumbnailUrl: '' }));
                                  }
                                }}
                                onRetry={() => void gallery.retry(item.id)}
                                className="aspect-square rounded-[1.5rem]"
                              />
                              {isThumb && (
                                <div className="absolute top-3 left-3 px-2 py-0.5 bg-emerald-500 text-white text-[7px] font-black uppercase tracking-tighter rounded-md shadow-lg flex items-center gap-1">
                                  <CheckCircle2 className="size-2" /> ẢNH ĐẠI DIỆN
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {gallery.items.length === 0 && (
                          <div className="col-span-full h-24 flex flex-col items-center justify-center text-slate-200 gap-3">
                             <ImageIcon className="h-8 w-8 opacity-20" />
                             <span className="text-[10px] font-bold uppercase tracking-widest opacity-30 italic">Chưa có hình ảnh nào được tải lên</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>

            <DialogFooter className="px-10 py-6 border-t border-slate-50 bg-white flex items-center justify-between shrink-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="rounded-full h-11 px-8 font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all uppercase tracking-widest text-[10px]"
              >
                Hủy bỏ
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={gallery.isUploading}
                  className="rounded-full h-11 px-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xl shadow-emerald-500/20 flex items-center gap-3 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                >
                  {gallery.isUploading ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <ShoppingBag className="size-4" />
                  )}
                  <span className="text-xs uppercase tracking-widest">
                    {gallery.isUploading
                      ? 'Đang tải ảnh...'
                      : mode === 'create'
                        ? 'Phát hành niêm yết'
                        : 'Lưu thay đổi'}
                  </span>
                </Button>
              </div>
            </DialogFooter>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
}
