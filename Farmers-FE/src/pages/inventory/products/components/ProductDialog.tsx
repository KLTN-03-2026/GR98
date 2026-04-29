import { useState, useEffect } from 'react';
import {
  Pencil,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ShoppingBag,
  Calendar as CalendarIcon,
  Tag,
  Info,
  Layers,
  ChevronRight,
  ChevronLeft,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

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

const STEPS = [
  { id: 1, title: 'Định danh', description: 'Thông tin cơ bản' },
  { id: 2, title: 'Thương mại', description: 'Giá & Chất lượng' },
  { id: 3, title: 'Hoàn thiện', description: 'Mô tả & Hình ảnh' },
];

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
  const [currentStep, setCurrentStep] = useState(1);
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
      setCurrentStep(1); // Reset to first step on open
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

  const nextStep = () => {
    if (currentStep === 1 && !form.name.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm trước khi tiếp tục');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

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
      <DialogContent className="sm:max-w-4xl h-[85vh] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white font-manrope flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          
          {/* Header Section with Stepper Indicator */}
          <DialogHeader className="px-10 pt-8 pb-6 border-b border-slate-50 bg-white shrink-0">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1.5">
                <DialogTitle className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                    <ShoppingBag className="size-5" />
                  </div>
                  {mode === 'create' ? 'Phát hành niêm yết mới' : 'Cập nhật thông tin'}
                </DialogTitle>
                <DialogDescription className="text-xs font-medium text-slate-400 ml-1">
                  Hoàn thành 3 bước để niêm yết nông sản của bạn lên sàn giao dịch.
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

            {/* Progress Steps */}
            <div className="flex items-center justify-between px-2 relative">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-100 -translate-y-1/2 z-0" />
              {STEPS.map((step) => (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 group">
                  <div className={cn(
                    "size-8 rounded-full flex items-center justify-center text-[11px] font-black transition-all duration-500 border-2",
                    currentStep === step.id 
                      ? "bg-white border-emerald-500 text-emerald-600 shadow-xl shadow-emerald-500/10 scale-110" 
                      : currentStep > step.id 
                        ? "bg-emerald-500 border-emerald-500 text-white" 
                        : "bg-white border-slate-100 text-slate-300"
                  )}>
                    {currentStep > step.id ? <CheckCircle2 className="size-4" /> : step.id}
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-[0.1em]",
                      currentStep >= step.id ? "text-slate-900" : "text-slate-300"
                    )}>{step.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </DialogHeader>

          {/* Body Section */}
          <div className="flex-1 overflow-y-auto px-10 py-10 custom-scrollbar bg-slate-50/20">
            
            {/* Step 1: Identity */}
            {currentStep === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-3">
                   <div className="size-8 rounded-xl bg-slate-900 text-white flex items-center justify-center"><Info className="size-4" /></div>
                   <div className="flex flex-col">
                      <h3 className="text-sm font-bold text-slate-900">Thông tin định danh</h3>
                      <p className="text-[10px] font-medium text-slate-400">Tên gọi và phân loại nông sản của bạn</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2 space-y-3">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tên sản phẩm thương mại <span className="text-rose-500">*</span></Label>
                    <Input
                      value={form.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Ví dụ: Sầu riêng Musang King hạng A..."
                      className="h-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-emerald-500/5 focus-visible:border-emerald-500 font-bold text-slate-900 placeholder:text-slate-300 transition-all shadow-sm text-base px-6"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Danh mục niêm yết</Label>
                    <div className="min-h-[140px] flex flex-wrap gap-2 p-6 rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          className={cn(
                            "px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border",
                            form.categoryIds.includes(cat.id)
                              ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20"
                              : "bg-slate-50 border-transparent text-slate-400 hover:border-slate-200"
                          )}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Đường dẫn SEO (Slug)</Label>
                    <div className="h-12 flex items-center px-6 rounded-2xl bg-slate-100/50 border border-slate-100 text-slate-400 font-mono text-[11px] italic overflow-hidden">
                       <span className="truncate">{form.slug || 'slug-tu-dong-theo-ten-san-pham'}</span>
                    </div>
                    <div className="flex items-start gap-2 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50">
                       <AlertCircle className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                       <p className="text-[10px] text-emerald-700/70 leading-relaxed font-medium">Đường dẫn này giúp sản phẩm của bạn dễ dàng được tìm thấy trên các công cụ tìm kiếm.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Commercial */}
            {currentStep === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-3">
                   <div className="size-8 rounded-xl bg-slate-900 text-white flex items-center justify-center"><Tag className="size-4" /></div>
                   <div className="flex flex-col">
                      <h3 className="text-sm font-bold text-slate-900">Thông số thương mại</h3>
                      <p className="text-[10px] font-medium text-slate-400">Chi tiết về giá cả, chất lượng và thời điểm thu hoạch</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Loại nông sản</Label>
                    <Select value={form.cropType} onValueChange={(v) => setForm({ ...form, cropType: v })}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 font-bold bg-white focus:ring-emerald-500/5 text-sm shadow-sm px-6">
                        <div className="flex items-center gap-3"><Layers className="size-4 text-slate-400" /><SelectValue /></div>
                      </SelectTrigger>
                      <SelectContent className="rounded-[1.5rem] border-slate-200 shadow-2xl p-2">
                        {Object.entries(CROP_TYPES).map(([k, v]) => (
                          <SelectItem key={k} value={v} className="rounded-xl py-3 px-4 text-sm font-bold focus:bg-slate-50">{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phân hạng chất lượng</Label>
                    <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v as QualityGrade })}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 font-bold bg-white focus:ring-emerald-500/5 text-sm shadow-sm px-6">
                        <div className="flex items-center gap-3"><CheckCircle2 className="size-4 text-slate-400" /><SelectValue /></div>
                      </SelectTrigger>
                      <SelectContent className="rounded-[1.5rem] border-slate-200 shadow-2xl p-2">
                        {Object.entries(GRADE_LABELS).map(([k, v]) => (
                           <SelectItem key={k} value={k} className="rounded-xl py-3 px-4 text-sm font-bold uppercase tracking-wider focus:bg-slate-50">{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Giá niêm yết (VNĐ/KG)</Label>
                    <div className="relative group">
                      <Input
                        type="number"
                        value={form.pricePerKg}
                        onChange={(e) => setForm({ ...form, pricePerKg: Number(e.target.value) })}
                        className="h-12 rounded-2xl border-slate-200 bg-white pr-20 font-bold tabular-nums focus-visible:ring-emerald-500/5 focus-visible:border-emerald-500 text-base shadow-sm px-6"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 group-focus-within:text-emerald-500 transition-colors uppercase">VNĐ</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ngày thu hoạch thực tế</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-12 w-full rounded-2xl border-slate-200 bg-white justify-start px-6 font-bold text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-emerald-500/5 text-sm shadow-sm"
                        >
                          <CalendarIcon className="mr-3 h-4 w-4 text-slate-300 shrink-0" />
                          <span className="truncate">{form.harvestDate ? format(form.harvestDate, "dd 'Tháng' MM, yyyy", { locale: vi }) : "Chọn ngày"}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-[2.5rem] shadow-2xl border-none overflow-hidden" align="start">
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

                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sản lượng tối thiểu</Label>
                    <div className="flex gap-4">
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          value={form.minOrderKg}
                          onChange={(e) => setForm({ ...form, minOrderKg: Number(e.target.value) })}
                          className="h-12 rounded-2xl border-slate-200 bg-white font-bold tabular-nums text-base shadow-sm px-6"
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">KG</span>
                      </div>
                      <Input
                        value={form.unit}
                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                        className="h-12 w-28 rounded-2xl border-slate-200 bg-white font-bold text-center text-sm shadow-sm uppercase"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Trạng thái phát hành</Label>
                    <div className="flex gap-2 p-1.5 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm h-12 items-center">
                      {[
                        { id: 'PUBLISHED', label: 'Công khai', active: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' },
                        { id: 'DRAFT', label: 'Nháp', active: 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' }
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
                </div>
              </div>
            )}

            {/* Step 3: Media */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-3">
                   <div className="size-8 rounded-xl bg-slate-900 text-white flex items-center justify-center"><ImageIcon className="size-4" /></div>
                   <div className="flex flex-col">
                      <h3 className="text-sm font-bold text-slate-900">Mô tả & Hình ảnh</h3>
                      <p className="text-[10px] font-medium text-slate-400">Hình ảnh thực tế giúp tăng tin cậy cho niêm yết</p>
                   </div>
                </div>

                <div className="space-y-8">
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
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Album hình ảnh thực tế</Label>
                    <div className="flex gap-4">
                      <div className="relative flex-1 group">
                        <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 transition-colors group-focus-within:text-emerald-500" />
                        <Input
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          placeholder="Dán URL hình ảnh..."
                          className="h-12 rounded-2xl border-slate-200 bg-white pl-14 focus-visible:ring-emerald-500/5 text-sm shadow-sm"
                        />
                      </div>
                      <Button 
                        type="button" 
                        onClick={handleAddImage} 
                        className="h-12 px-8 rounded-2xl font-black bg-slate-900 hover:bg-black text-white shadow-xl shadow-slate-900/10 transition-all text-[10px] uppercase tracking-widest"
                      >
                        THÊM ẢNH
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm min-h-[140px]">
                      {form.imageUrls.map((url, i) => (
                        <div key={i} className="group relative aspect-square rounded-[1.5rem] overflow-hidden border border-slate-100 bg-slate-50 shadow-sm transition-all hover:scale-[1.05] hover:z-20">
                          <img src={url} alt="product" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                            <button
                              type="button"
                              className="h-8 w-8 rounded-full bg-rose-500 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-xl shadow-rose-500/40"
                              onClick={() => handleRemoveImage(url)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          {i === 0 && (
                            <div className="absolute top-3 left-3 px-2 py-0.5 bg-emerald-500 text-white text-[7px] font-black uppercase tracking-tighter rounded-md shadow-lg">ẢNH BÌA</div>
                          )}
                        </div>
                      ))}
                      {form.imageUrls.length === 0 && (
                        <div className="col-span-full h-24 flex flex-col items-center justify-center text-slate-200 gap-3">
                           <ImageIcon className="h-8 w-8 opacity-20" />
                           <span className="text-[10px] font-bold uppercase tracking-widest opacity-30 italic">Chưa có hình ảnh nào được tải lên</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <DialogFooter className="px-10 py-8 border-t border-slate-50 bg-white flex items-center justify-between shrink-0">
            {currentStep === 1 ? (
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => onOpenChange(false)} 
                className="rounded-full h-12 px-10 font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all uppercase tracking-widest text-[10px]"
              >
                Hủy bỏ
              </Button>
            ) : (
              <Button 
                type="button" 
                variant="ghost" 
                onClick={prevStep}
                className="rounded-full h-12 px-8 font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all flex items-center gap-2"
              >
                <ChevronLeft className="size-4" />
                <span className="uppercase tracking-widest text-[10px]">Quay lại</span>
              </Button>
            )}

            <div className="flex items-center gap-3">
              {currentStep < STEPS.length ? (
                <Button 
                  type="button" 
                  onClick={nextStep}
                  className="rounded-full h-12 px-10 bg-slate-900 hover:bg-black text-white font-bold shadow-2xl shadow-slate-900/20 flex items-center gap-2 transition-all hover:translate-x-1"
                >
                  <span className="text-xs uppercase tracking-widest">Tiếp theo</span>
                  <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  className="rounded-full h-12 px-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-2xl shadow-emerald-500/25 flex items-center gap-3 transition-all hover:-translate-y-1 active:translate-y-0"
                >
                  <ShoppingBag className="size-4" />
                  <span className="text-xs uppercase tracking-widest">Phát hành niêm yết</span>
                  <ArrowRight className="size-4" />
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
