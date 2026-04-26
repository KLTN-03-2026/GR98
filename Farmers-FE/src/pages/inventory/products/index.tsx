import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ImageIcon,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShoppingBag,
  FilterX,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { inventoryProductApi } from './api/product-api';
import { useProductMutations } from './api/use-product-mutations';
import { useCategories } from '@/client/api/categories/use-categories';
import {
  CROP_TYPES,
  GRADE_LABELS,
  PRODUCT_STATUS_LABELS,
  type Product,
  type ProductStatus,
  type QualityGrade,
} from '@/client/types';

import { Separator } from '@/components/ui/separator';
import {
  Calendar as CalendarIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';

// ─── Helpers ────────────────────────────────────────────────────────────────

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


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

// ─── Components ─────────────────────────────────────────────────────────────

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  product?: Product;
  onSubmit: (data: any) => void;
  categories: any[];
}

function ProductDialog({
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
      <DialogContent className="sm:max-w-4xl max-h-[95vh] p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-white font-manrope">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          
          {/* Header */}
          <DialogHeader className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  {mode === 'create' ? 'Niêm yết sản phẩm mới' : 'Chỉnh sửa niêm yết'}
                </DialogTitle>
                <DialogDescription className="text-xs font-medium text-slate-400 mt-1">
                  Thiết lập thông tin thương mại cho nông sản trên sàn giao dịch.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  form.status === 'PUBLISHED' ? "bg-emerald-500" : "bg-slate-300"
                )} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {PRODUCT_STATUS_LABELS[form.status]}
                </span>
              </div>
            </div>
          </DialogHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-8 space-y-10">
            
            {/* Section 1: Basic Identity */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-900">
                <div className="h-1 w-4 bg-emerald-500 rounded-full" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Thông tin định danh</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tên sản phẩm thương mại <span className="text-rose-500">*</span></Label>
                  <Input
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ví dụ: Sầu riêng Musang King hạng A..."
                    className="h-11 rounded-xl border-slate-200 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Danh mục niêm yết</Label>
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl border border-slate-100 bg-slate-50/50">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                          form.categoryIds.includes(cat.id)
                            ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                            : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đường dẫn hệ thống (Slug)</Label>
                  <div className="h-11 flex items-center px-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 font-mono text-[11px] italic">
                     {form.slug || 'Tự động tạo từ tên sản phẩm...'}
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-slate-100" />

            {/* Section 2: Technical & Commercial */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-900">
                <div className="h-1 w-4 bg-emerald-500 rounded-full" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Thông số thương mại</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hệ sản phẩm</Label>
                  <Select value={form.cropType} onValueChange={(v) => setForm({ ...form, cropType: v })}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 font-bold w-full text-left">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CROP_TYPES).map(([k, v]) => (
                        <SelectItem key={k} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phân hạng</Label>
                  <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v as QualityGrade })}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 font-bold w-full overflow-hidden text-left">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(GRADE_LABELS).map(([k, v]) => (
                         <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Giá niêm yết</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={form.pricePerKg}
                      onChange={(e) => setForm({ ...form, pricePerKg: Number(e.target.value) })}
                      className="h-11 rounded-xl border-slate-200 pr-12 font-bold tabular-nums focus-visible:ring-emerald-500/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">/KG</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ngày thu hoạch</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-11 w-full rounded-xl border-slate-200 justify-start px-4 font-bold text-slate-700 hover:bg-slate-50"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-300" />
                        {form.harvestDate ? format(form.harvestDate, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border border-slate-100" align="start">
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mua tối thiểu</Label>
                  <Input
                    type="number"
                    value={form.minOrderKg}
                    onChange={(e) => setForm({ ...form, minOrderKg: Number(e.target.value) })}
                    className="h-11 rounded-xl border-slate-200 font-bold focus-visible:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đơn vị</Label>
                  <Input
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="h-11 rounded-xl border-slate-200 font-bold focus-visible:ring-emerald-500/20"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Trạng thái phát hành</Label>
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
                          "flex-1 h-11 rounded-xl border text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all",
                          form.status === item.id 
                            ? item.active 
                            : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
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

            <Separator className="bg-slate-100" />

            {/* Section 3: Story & Visuals */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-900">
                <div className="h-1 w-4 bg-emerald-500 rounded-full" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Mô tả & Hình ảnh</h3>
              </div>
              
              <div className="space-y-4">
                 <textarea
                   value={form.description}
                   onChange={(e) => setForm({ ...form, description: e.target.value })}
                   placeholder="Nhập giới thiệu chi tiết về sản phẩm..."
                   className="w-full min-h-[120px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium placeholder:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all resize-none shadow-xs"
                 />

                 <div className="space-y-4">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                        <Input
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          placeholder="Dán đường dẫn hình ảnh..."
                          className="h-11 rounded-xl border-slate-200 bg-white pl-10"
                        />
                      </div>
                      <Button type="button" onClick={handleAddImage} className="h-11 px-6 rounded-xl font-bold bg-slate-900 hover:bg-black text-white">Thêm ảnh</Button>
                    </div>
                    
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 border-dashed">
                      {form.imageUrls.map((url, i) => (
                        <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs">
                          <img src={url} alt="product" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                            <button
                              type="button"
                              className="h-7 w-7 rounded-full bg-rose-500 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-rose-500/20"
                              onClick={() => handleRemoveImage(url)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {i === 0 && (
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-emerald-600 text-white text-[8px] font-black uppercase rounded-md shadow-sm">Bìa</div>
                          )}
                        </div>
                      ))}
                      {form.imageUrls.length === 0 && (
                        <div className="col-span-full h-24 flex flex-col items-center justify-center text-slate-300 gap-2">
                           <ImageIcon className="h-5 w-5 opacity-20" />
                           <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 italic">Chưa có hình ảnh sản phẩm</span>
                        </div>
                      )}
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full h-11 px-6 font-bold text-slate-500 hover:bg-slate-100">
              HỦY BỎ
            </Button>
            <Button type="submit" className="rounded-full h-11 px-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2">
              <ShoppingBag className="size-4" />
              {mode === 'create' ? 'PHÁT HÀNH NIÊM YÊT' : 'LƯU THAY ĐỔI'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ProductsManagementPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProductStatus | 'ALL'>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<Product | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['products', 'management', search, status],
    queryFn: () => inventoryProductApi.listInternal({
      search: search || undefined,
      status: status === 'ALL' ? undefined : status,
    }),
  });

  const { data: catData } = useCategories();
  const categories = catData?.data || [];
  const products = data?.data?.items || [];

  const { createProduct, updateProduct, deleteProduct } = useProductMutations();

  const handleOpenCreate = () => {
    setMode('create');
    setSelected(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setMode('edit');
    setSelected(product);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn gỡ sản phẩm này khỏi sàn?')) {
      deleteProduct.mutate(id);
    }
  };

  const handleSubmit = (formData: any) => {
    if (mode === 'create') {
      createProduct.mutate(formData, {
        onSuccess: () => setDialogOpen(false),
      });
    } else if (selected) {
      updateProduct.mutate(
        { id: selected.id, data: formData },
        { onSuccess: () => setDialogOpen(false) }
      );
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-5 p-4 sm:p-6 font-manrope">
      {/* Header Card - Admin Style */}
      <Card className="border-dashed border-emerald-400/50 bg-white">
        <CardContent className="p-4 sm:p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <ShoppingBag className="size-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Quản lý niêm yết
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Đưa nông sản lên sàn thương mại điện tử chuyên nghiệp
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group min-w-[200px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-600 transition-colors" />
              <Input
                placeholder="Tìm sản phẩm, mã SKU..."
                className="h-9 rounded-full border-slate-200 pl-9 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger className="h-9 w-40 rounded-full border-slate-200 bg-white px-4 text-xs font-bold">
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3 text-slate-400" />
                  <SelectValue placeholder="Trạng thái" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200">
                <SelectItem value="ALL" className="text-xs font-bold">Tất cả trạng thái</SelectItem>
                {Object.entries(PRODUCT_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-xs font-bold">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleOpenCreate} 
              className="h-9 rounded-full px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Plus className="size-4" />
              Niêm yết mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Bar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
          <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-600 font-bold px-1.5 h-5 rounded-md min-w-6 justify-center">
            {data?.data?.total || 0}
          </Badge>
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Sản phẩm niêm yết</span>
        </div>
        {(search || status !== 'ALL') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setStatus('ALL');
            }}
            className="h-8 rounded-full px-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all text-xs font-bold"
          >
            <FilterX className="size-3.5 mr-1" />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* Table Section */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="h-full overflow-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-slate-50/80 sticky top-0 z-10">
              <TableRow className="border-b-slate-100 hover:bg-transparent">
                <TableHead className="w-24 text-[10px] font-bold uppercase tracking-wider text-slate-500 pl-6">Ảnh</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sản phẩm & SKU</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Phân loại</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Giá niêm yết</TableHead>
                <TableHead className="w-32 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">Tồn kho</TableHead>
                <TableHead className="w-32 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">Trạng thái</TableHead>
                <TableHead className="w-32 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500 pr-6">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b-slate-50">
                    <TableCell className="pl-6"><Skeleton className="h-10 w-14 rounded-xl" /></TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-24 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-12 mx-auto rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 mx-auto rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-20 ml-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-80 text-center">
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="mb-4 rounded-full bg-slate-50 p-6 border border-dashed border-slate-200">
                        <ShoppingBag className="h-10 w-10 text-slate-300" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">Chưa có sản phẩm nào</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">
                        Bắt đầu niêm yết nông sản đầu tiên để tiếp cận khách hàng trên sàn ECM.
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleOpenCreate}
                        className="mt-6 rounded-full px-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-bold"
                      >
                        Niêm yết ngay
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p: Product) => (
                  <TableRow key={p.id} className="group transition-all border-b-slate-50 hover:bg-emerald-50/30">
                    <TableCell className="pl-6">
                      <div className="relative h-10 w-14 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shadow-xs">
                        {p.imageUrls?.[0] ? (
                          <img src={p.imageUrls[0]} alt={p.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-slate-200" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors text-sm line-clamp-1">{p.name}</p>
                        <p className="text-[10px] font-mono font-bold text-slate-400 tracking-tighter uppercase opacity-60">
                          {p.sku}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700">{p.cropType}</span>
                          <Badge variant="outline" className="text-[9px] h-4 px-1 leading-none rounded-md border-emerald-200 text-emerald-600 font-bold">
                            Hạng {p.grade}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium line-clamp-1 italic">
                          {p.categories?.map(c => c.name).join(', ') || 'Chưa phân loại'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-bold text-slate-900 text-sm">
                        {formatCurrency(p.pricePerKg)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-50">/ {p.unit}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-slate-50 border-slate-100 h-6 rounded-lg tabular-nums font-bold text-slate-600">
                        {p.stockKg.toLocaleString('vi-VN')} kg
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        {p.status === 'PUBLISHED' ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-none shadow-none rounded-full px-3 text-[10px] font-bold">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            CÔNG KHAI
                          </Badge>
                        ) : p.status === 'OUT_OF_STOCK' ? (
                          <Badge variant="outline" className="bg-rose-500/10 text-rose-700 border-none shadow-none rounded-full px-3 text-[10px] font-bold">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            HẾT HÀNG
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-100 text-slate-400 border-none shadow-none rounded-full px-3 text-[10px] font-bold">
                            {p.status === 'DRAFT' ? <Pencil className="h-3 w-3 mr-1" /> : < शॉपिंग-बैग className="h-3 w-3 mr-1" />}
                            {PRODUCT_STATUS_LABELS[p.status].toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full hover:bg-white hover:text-emerald-600 hover:shadow-lg hover:shadow-emerald-500/10 transition-all"
                          onClick={() => handleOpenEdit(p)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-all"
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full hover:bg-slate-50 hover:text-emerald-600 transition-all"
                          asChild
                        >
                          <a href={`/products/${p.slug}`} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        product={selected ?? undefined}
        onSubmit={handleSubmit}
        categories={categories}
      />
    </div>
  );
}
