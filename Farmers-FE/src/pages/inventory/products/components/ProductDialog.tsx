import { useState, useEffect } from 'react';
import {
  Pencil,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ShoppingBag,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
  CROP_TYPES,
  GRADE_LABELS,
  PRODUCT_STATUS_LABELS,
  type Product,
  type ProductStatus,
  type QualityGrade,
} from '@/client/types';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  product?: Product;
  onSubmit: (data: any) => void;
  categories: any[];
}

const toSlug = (text: string) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export function ProductDialog({
  open,
  onOpenChange,
  mode,
  product,
  onSubmit,
  categories,
}: ProductDialogProps) {
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    cropType: 'Sầu Riêng',
    grade: 'A' as QualityGrade,
    pricePerKg: 0,
    minOrderKg: 1,
    unit: 'kg',
    status: 'DRAFT' as ProductStatus,
    imageUrls: [] as string[],
    categoryIds: [] as string[],
    harvestDate: undefined as Date | undefined,
  });

  const [imageUrlInput, setImageUrlInput] = useState('');

  useEffect(() => {
    if (open) {
      if (product && mode === 'edit') {
        setForm({
          name: product.name,
          slug: product.slug,
          description: product.description || '',
          cropType: product.cropType,
          grade: product.grade,
          pricePerKg: product.pricePerKg,
          minOrderKg: product.minOrderKg,
          unit: product.unit || 'kg',
          status: product.status,
          imageUrls: product.imageUrls || [],
          categoryIds: product.categories?.map((c) => c.id) || [],
          harvestDate: product.harvestDate ? new Date(product.harvestDate) : undefined,
        });
      } else {
        setForm({
          name: '',
          slug: '',
          description: '',
          cropType: 'Sầu Riêng',
          grade: 'A',
          pricePerKg: 0,
          minOrderKg: 1,
          unit: 'kg',
          status: 'DRAFT',
          imageUrls: [],
          categoryIds: [],
          harvestDate: new Date(),
        });
      }
    }
  }, [product, mode, open]);

  const handleNameChange = (name: string) => {
    const slug = toSlug(name);
    setForm({ ...form, name, slug });
  };

  const handleAddImage = () => {
    if (imageUrlInput && !form.imageUrls.includes(imageUrlInput)) {
      setForm({ ...form, imageUrls: [...form.imageUrls, imageUrlInput] });
      setImageUrlInput('');
    }
  };

  const handleRemoveImage = (url: string) => {
    setForm({ ...form, imageUrls: form.imageUrls.filter((u) => u !== url) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm');
      return;
    }
    onSubmit(form);
  };

  const toggleCategory = (id: string) => {
    setForm(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter(cid => cid !== id)
        : [...prev.categoryIds, id]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] p-0 overflow-hidden border-none shadow-2xl rounded-[2rem] bg-white font-manrope">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
                  {mode === 'create' ? 'Niêm yết sản phẩm mới' : 'Chỉnh sửa niêm yết'}
                </DialogTitle>
                <DialogDescription className="text-[11px] font-medium text-slate-400">
                  Thiết lập thông tin thương mại cho nông sản trên sàn giao dịch.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  form.status === 'PUBLISHED' ? "bg-emerald-500" : 
                  form.status === 'OUT_OF_STOCK' ? "bg-rose-500" : "bg-slate-300"
                )} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {PRODUCT_STATUS_LABELS[form.status]}
                </span>
              </div>
            </div>
          </DialogHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar">
            
            {/* Section 1: Basic Identity */}
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="h-4 w-1 bg-emerald-500 rounded-full" />
                <h3 className="text-[10px] font-bold uppercase tracking-tight text-slate-400">Thông tin định danh</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">Tên sản phẩm thương mại <span className="text-rose-500 font-black">*</span></Label>
                  <Input
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ví dụ: Sầu riêng Musang King hạng A..."
                    className="h-10 rounded-xl border-slate-200 focus-visible:ring-emerald-500/10 focus-visible:border-emerald-500 font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-300 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">Danh mục niêm yết</Label>
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl border border-slate-100 bg-slate-50/50">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-bold transition-all border",
                          form.categoryIds.includes(cat.id)
                            ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                            : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                    {categories.length === 0 && (
                      <span className="text-[10px] font-medium text-slate-300 italic">Đang tải...</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">Đường dẫn hệ thống (Slug)</Label>
                  <div className="h-10 flex items-center px-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 font-mono text-[10px] italic overflow-hidden">
                     <span className="truncate">{form.slug || 'Tự động tạo từ tên sản phẩm...'}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-slate-100/60" />

            {/* Section 2: Technical & Commercial */}
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="h-4 w-1 bg-emerald-500 rounded-full" />
                <h3 className="text-[10px] font-bold uppercase tracking-tight text-slate-400">Thông số thương mại</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">Hệ sản phẩm</Label>
                  <Select value={form.cropType} onValueChange={(v) => setForm({ ...form, cropType: v })}>
                    <SelectTrigger className="h-10 rounded-xl border-slate-200 font-bold bg-white focus:ring-emerald-500/10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      {Object.entries(CROP_TYPES).map(([k, v]) => (
                        <SelectItem key={k} value={v} className="text-xs font-bold">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">Phân hạng</Label>
                  <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v as QualityGrade })}>
                    <SelectTrigger className="h-10 rounded-xl border-slate-200 font-bold bg-white focus:ring-emerald-500/10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      {Object.entries(GRADE_LABELS).map(([k, v]) => (
                         <SelectItem key={k} value={k} className="text-xs font-bold">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">Giá niêm yết</Label>
                  <div className="relative group">
                    <Input
                      type="number"
                      value={form.pricePerKg}
                      onChange={(e) => setForm({ ...form, pricePerKg: Number(e.target.value) })}
                      className="h-10 rounded-xl border-slate-200 pr-12 font-bold tabular-nums focus-visible:ring-emerald-500/10 focus-visible:border-emerald-500 text-xs"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 group-focus-within:text-emerald-500 transition-colors uppercase">VND/KG</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">Ngày thu hoạch</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-10 w-full rounded-xl border-slate-200 justify-start px-4 font-bold text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-emerald-500/10 text-xs"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-300" />
                        {form.harvestDate ? format(form.harvestDate, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border border-slate-100 overflow-hidden" align="start">
                      <Calendar
                        mode="single"
                        selected={form.harvestDate}
                        onSelect={(d) => setForm({ ...form, harvestDate: d })}
                        initialFocus
                        locale={vi}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">Mua tối thiểu</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={form.minOrderKg}
                      onChange={(e) => setForm({ ...form, minOrderKg: Number(e.target.value) })}
                      className="h-10 rounded-xl border-slate-200 font-bold focus-visible:ring-emerald-500/10 focus-visible:border-emerald-500 tabular-nums text-xs"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">KG</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">Đơn vị</Label>
                  <Input
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="h-10 rounded-xl border-slate-200 font-bold focus-visible:ring-emerald-500/10 focus-visible:border-emerald-500 text-xs"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">Trạng thái phát hành</Label>
                  <div className="flex gap-2">
                    {[
                      { id: 'PUBLISHED', label: 'Công khai', icon: CheckCircle2, active: 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20' },
                      { id: 'DRAFT', label: 'Bản nháp', icon: Pencil, active: 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20' },
                      { id: 'OUT_OF_STOCK', label: 'Hết hàng', icon: AlertCircle, active: 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-500/20' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setForm({ ...form, status: item.id as ProductStatus })}
                        className={cn(
                          "flex-1 h-10 rounded-xl border text-[10px] font-bold uppercase tracking-tight flex items-center justify-center gap-1.5 transition-all",
                          form.status === item.id 
                            ? item.active 
                            : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                         <item.icon className="h-3.5 w-3.5" />
                         {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-slate-100/60" />

            {/* Section 3: Story & Visuals */}
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="h-4 w-1 bg-emerald-500 rounded-full" />
                <h3 className="text-[10px] font-bold uppercase tracking-tight text-slate-400">Mô tả & Hình ảnh</h3>
              </div>
              
              <div className="space-y-4">
                 <textarea
                   value={form.description}
                   onChange={(e) => setForm({ ...form, description: e.target.value })}
                   placeholder="Nhập giới thiệu chi tiết về sản phẩm..."
                   className="w-full min-h-[120px] rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/10 focus-visible:border-emerald-500 transition-all resize-none shadow-xs"
                 />

                 <div className="space-y-3">
                    <div className="flex gap-2.5">
                      <div className="relative flex-1">
                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                        <Input
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          placeholder="Dán URL hình ảnh..."
                          className="h-10 rounded-xl border-slate-200 bg-white pl-11 focus-visible:ring-emerald-500/10 text-xs"
                        />
                      </div>
                      <Button 
                        type="button" 
                        onClick={handleAddImage} 
                        className="h-10 px-6 rounded-xl font-bold bg-slate-900 hover:bg-black text-white shadow-md shadow-slate-900/10 transition-all text-xs"
                      >
                        THÊM ẢNH
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 p-4 rounded-[1.25rem] bg-slate-50/50 border border-slate-100 border-dashed">
                      {form.imageUrls.map((url, i) => (
                        <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm ring-2 ring-transparent hover:ring-emerald-500/20 transition-all">
                          <img src={url} alt="product" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                            <button
                              type="button"
                              className="h-7 w-7 rounded-full bg-rose-500 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-rose-500/40"
                              onClick={() => handleRemoveImage(url)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {i === 0 && (
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-emerald-600 text-white text-[8px] font-black uppercase rounded-md shadow-sm border border-emerald-400/30">Bìa</div>
                          )}
                        </div>
                      ))}
                      {form.imageUrls.length === 0 && (
                        <div className="col-span-full h-24 flex flex-col items-center justify-center text-slate-300 gap-2">
                           <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200/50 border-dashed">
                             <ImageIcon className="h-4 w-4 opacity-30" />
                           </div>
                           <span className="text-[10px] font-bold uppercase tracking-tight opacity-40 italic">Chưa có hình ảnh</span>
                        </div>
                      )}
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)} 
              className="rounded-full h-10 px-6 font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all uppercase tracking-wider text-[10px]"
            >
              HỦY BỎ
            </Button>
            <Button 
              type="submit" 
              className="rounded-full h-10 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xl shadow-emerald-500/25 flex items-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <ShoppingBag className="size-4" />
              <span className="text-sm">PHÁT HÀNH NIÊM YÊT</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
