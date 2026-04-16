import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ImageIcon,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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

const formatCurrencyInput = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value);
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
      <DialogContent className="sm:max-w-4xl max-h-[95vh] p-0 overflow-hidden border border-slate-200 shadow-2xl rounded-xl bg-white">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                {mode === 'create' ? 'Niêm yết sản phẩm mới' : 'Chỉnh sửa niêm yết'}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 mt-1">
                Chuẩn hóa dữ liệu nông sản cho môi trường thương mại điện tử.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-2 w-2 rounded-full",
                form.status === 'PUBLISHED' ? "bg-green-500" : "bg-slate-300"
              )} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {PRODUCT_STATUS_LABELS[form.status]}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-8 space-y-10">
            
            {/* Section 1: Basic Identity */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-900">
                <div className="h-1 w-4 bg-primary rounded-full" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Thông tin định danh</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs font-semibold text-slate-500">Tên sản phẩm thương mại *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ví dụ: Sầu riêng Musang King hạng A..."
                    className="h-11 rounded-lg border-slate-200 focus:ring-primary/10 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500">Danh mục niêm yết</Label>
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border border-slate-100 bg-slate-50/30">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-[11px] font-bold transition-all border",
                          form.categoryIds.includes(cat.id)
                            ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500">Đường dẫn hệ thống (Slug)</Label>
                  <div className="h-11 flex items-center px-4 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 font-mono text-[11px] italic">
                     {form.slug || 'Tự động tạo từ tên sản phẩm...'}
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-slate-100" />

            {/* Section 2: Technical & Commercial */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-900">
                <div className="h-1 w-4 bg-primary rounded-full" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Thông số thương mại</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-8">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500">Hệ sản phẩm</Label>
                  <Select value={form.cropType} onValueChange={(v) => setForm({ ...form, cropType: v })}>
                    <SelectTrigger className="h-11 rounded-lg border-slate-200 font-medium w-full text-left">
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
                  <Label className="text-xs font-semibold text-slate-500">Phân hạng chất lượng</Label>
                  <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v as QualityGrade })}>
                    <SelectTrigger className="h-11 rounded-lg border-slate-200 font-medium w-full overflow-hidden text-left">
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
                  <Label className="text-xs font-semibold text-slate-500">Giá trị niêm yết</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={form.pricePerKg}
                      onChange={(e) => setForm({ ...form, pricePerKg: Number(e.target.value) })}
                      className="h-11 rounded-lg border-slate-200 pr-12 font-bold tabular-nums"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">/KG</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500">Ngày thu hoạch</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-11 w-full rounded-lg border-slate-200 justify-start px-4 font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                        {form.harvestDate ? format(form.harvestDate, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl shadow-2xl border border-slate-100" align="start">
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
                  <Label className="text-xs font-semibold text-slate-500">Mua tối thiểu</Label>
                  <Input
                    type="number"
                    value={form.minOrderKg}
                    onChange={(e) => setForm({ ...form, minOrderKg: Number(e.target.value) })}
                    className="h-11 rounded-lg border-slate-200 font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500">Đơn vị chuẩn hóa</Label>
                  <Input
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="h-11 rounded-lg border-slate-200 font-medium"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs font-semibold text-slate-500">Trạng thái phát hành</Label>
                  <div className="flex gap-2">
                    {[
                      { id: 'PUBLISHED', label: 'Công khai', icon: CheckCircle2, color: 'text-green-600', active: 'bg-green-500 text-white border-green-600' },
                      { id: 'DRAFT', label: 'Bản nháp', icon: Pencil, color: 'text-slate-400', active: 'bg-slate-900 text-white border-slate-900' },
                      { id: 'OUT_OF_STOCK', label: 'Hết hàng', icon: AlertCircle, color: 'text-amber-600', active: 'bg-amber-500 text-white border-amber-600' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setForm({ ...form, status: item.id as ProductStatus })}
                        className={cn(
                          "flex-1 h-11 rounded-lg border text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all",
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
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
              <div className="md:col-span-12 space-y-4">
                 <div className="flex items-center gap-2 text-slate-900">
                    <div className="h-1 w-4 bg-primary rounded-full" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Mô tả & Hình ảnh</h3>
                 </div>
                 <textarea
                   value={form.description}
                   onChange={(e) => setForm({ ...form, description: e.target.value })}
                   placeholder="Nhập giới thiệu chi tiết về sản phẩm..."
                   className="w-full min-h-[120px] rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium placeholder:text-slate-300 focus:ring-4 focus:ring-primary/5 transition-all outline-none resize-none"
                 />
              </div>

              <div className="md:col-span-12 space-y-6">
                 <div className="flex gap-2">
                   <Input
                     value={imageUrlInput}
                     onChange={(e) => setImageUrlInput(e.target.value)}
                     placeholder="Dán đường dẫn hình ảnh..."
                     className="h-11 rounded-lg border-slate-200 bg-white"
                   />
                   <Button type="button" onClick={handleAddImage} className="h-11 px-6 rounded-lg font-bold">Thêm ảnh</Button>
                 </div>
                 
                 <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                   {form.imageUrls.map((url, i) => (
                     <div key={i} className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                       <img src={url} alt="product" className="h-full w-full object-cover" />
                       <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                         <button
                           type="button"
                           className="h-7 w-7 rounded-full bg-destructive text-white flex items-center justify-center hover:scale-110 transition-transform"
                           onClick={() => handleRemoveImage(url)}
                         >
                           <Trash2 className="h-3.5 w-3.5" />
                         </button>
                       </div>
                       {i === 0 && (
                         <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-white/90 text-[8px] font-black uppercase rounded-md border border-slate-100">Bìa</div>
                       )}
                     </div>
                   ))}
                   {form.imageUrls.length === 0 && (
                     <div className="col-span-full h-24 border-2 border-dashed border-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-300 gap-2">
                        <ImageIcon className="h-5 w-5 opacity-20" />
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Chưa có phương tiện</span>
                     </div>
                   )}
                 </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-lg h-11 px-6 font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900">
              HỦY BỎ
            </Button>
            <Button type="submit" className="rounded-lg h-11 px-10 bg-slate-900 border-none shadow-lg shadow-slate-900/10 font-bold hover:bg-black transition-all active:scale-95">
              {mode === 'create' ? 'PHÁT HÀNH NIÊM YÊT' : 'LƯU THAY ĐỔI'}
            </Button>
          </div>
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

  const { data, isLoading } = useQuery({
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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
            Quản lý niêm yết
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-primary" />
            Đưa nông sản lên sàn thương mại điện tử chuyên nghiệp
          </p>
        </div>
        <Button 
          onClick={handleOpenCreate} 
          className="gap-2 rounded-xl px-6 py-6 shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95 font-bold"
        >
          <Plus className="h-5 w-5" />
          Niêm yết mới
        </Button>
      </div>

      {/* Top Bar with Search & Filter */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-muted/20 p-4 rounded-2xl border border-muted/50 backdrop-blur-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên sản phẩm, mã SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 rounded-xl border-none bg-background/50 shadow-inner focus-visible:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger className="w-full lg:w-[180px] h-12 rounded-xl bg-background/50 border-none">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Trạng thái" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              {Object.entries(PRODUCT_STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Section */}
      <div className="relative group/table">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/5 to-primary/0 rounded-[2rem] blur-2xl opacity-50 group-hover/table:opacity-100 transition duration-1000" />
        <div className="relative rounded-2xl border border-muted/50 bg-background/50 backdrop-blur-md overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-muted/30 border-b border-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-24 text-xs font-bold uppercase tracking-widest text-muted-foreground/70 pl-8">Ảnh</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Sản phẩm & SKU</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Phân loại</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Giá niêm yết</TableHead>
                <TableHead className="w-32 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Tồn kho</TableHead>
                <TableHead className="w-32 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Trạng thái</TableHead>
                <TableHead className="w-32 text-right text-xs font-bold uppercase tracking-widest text-muted-foreground/70 pr-8">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-muted/20">
                    <TableCell className="pl-8"><Skeleton className="h-12 w-16 rounded-xl" /></TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-24 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-12 mx-auto rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 mx-auto rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-20 ml-auto rounded-xl" /></TableCell>
                  </TableRow>
                ))
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-80 text-center">
                    <div className="flex flex-col items-center justify-center gap-6 animate-in zoom-in-95 duration-500">
                      <div className="relative bg-muted/20 p-8 rounded-full border border-muted/50">
                        <Plus className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-black text-foreground/80">Chưa có sản phẩm nào</h3>
                        <p className="text-sm text-muted-foreground">Bắt đầu đưa mặt hàng đầu tiên lên sàn ECM.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p: Product) => (
                  <TableRow key={p.id} className="group transition-all border-muted/20 hover:bg-primary/[0.02]">
                    <TableCell className="pl-8">
                      <div className="relative h-12 w-16 rounded-xl overflow-hidden border border-muted bg-muted ring-offset-background group-hover:ring-2 group-hover:ring-primary/20 transition-all shadow-sm">
                        {p.imageUrls?.[0] ? (
                          <img src={p.imageUrls[0]} alt={p.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-muted-foreground/20" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{p.name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground tracking-tighter uppercase opacity-60">
                          {p.sku}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground/80">{p.cropType}</span>
                          <Badge variant="outline" className="text-[10px] h-4 px-1 leading-none rounded-md border-primary/20 text-primary">
                            Hạng {p.grade}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 italic">
                          {p.categories?.map(c => c.name).join(', ') || 'Chưa phân loại'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                        {formatCurrency(p.pricePerKg)}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-50">/ {p.unit}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-muted h-6 rounded-lg tabular-nums font-bold">
                        {p.stockKg} kg
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        {p.status === 'PUBLISHED' ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20 shadow-none rounded-full px-3">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {PRODUCT_STATUS_LABELS.PUBLISHED}
                          </Badge>
                        ) : p.status === 'OUT_OF_STOCK' ? (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-none rounded-full px-3">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {PRODUCT_STATUS_LABELS.OUT_OF_STOCK}
                          </Badge>
                        ) : (
                          <Badge className="bg-muted/50 text-muted-foreground border-none shadow-none rounded-full px-3">
                            {p.status === 'DRAFT' ? <Pencil className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                            {PRODUCT_STATUS_LABELS[p.status]}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-300">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 rounded-xl hover:bg-background shadow-none hover:shadow-lg hover:text-primary border hover:border-primary/10 transition-all"
                          onClick={() => handleOpenEdit(p)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive shadow-none border hover:border-destructive/10 transition-all"
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary shadow-none border hover:border-primary/10 transition-all"
                          asChild
                        >
                          <a href={`/products/${p.slug}`} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
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
