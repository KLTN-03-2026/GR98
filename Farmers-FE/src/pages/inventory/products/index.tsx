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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0 overflow-hidden border-none bg-background/80 backdrop-blur-2xl shadow-2xl rounded-[2rem]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-8 pb-4">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                {mode === 'create' ? '✨ Niêm yết sản phẩm' : '📝 Cập nhật sản phẩm'}
              </DialogTitle>
              <DialogDescription className="text-base font-medium">
                Quản lý thông tin thương mại và hình ảnh nông sản trên sàn ECM.
              </DialogDescription>
            </DialogHeader>
          </div>

          <Tabs defaultValue="general" className="w-full flex-1 overflow-hidden flex flex-col">
            <div className="px-8 border-b border-muted/50 bg-muted/20">
              <TabsList className="h-12 bg-transparent gap-8">
                <TabsTrigger 
                  value="general" 
                  className="relative h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold px-0 text-sm tracking-tight"
                >
                  Thông tin chung
                </TabsTrigger>
                <TabsTrigger 
                  value="media" 
                  className="relative h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold px-0 text-sm tracking-tight"
                >
                  Hình ảnh & Mô tả
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <TabsContent value="general" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Identification Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 pl-1">Tên hiển thị nội sàn *</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Ví dụ: Sầu riêng Ri6 Cái Mơn - Loại 1"
                        className="h-12 rounded-2xl bg-muted/30 border-none shadow-inner focus-visible:ring-primary/20 text-base font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 pl-1">Slug (Đường dẫn tĩnh)</Label>
                      <div className="relative">
                        <Input
                          value={form.slug}
                          onChange={(e) => setForm({ ...form, slug: e.target.value })}
                          className="h-10 rounded-xl bg-muted/10 border-dashed font-mono text-xs pl-4 pr-12 text-muted-foreground"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 pl-1">Danh mục ngành hàng</Label>
                    <div className="flex flex-wrap gap-2 p-4 bg-muted/20 rounded-2xl border border-dashed border-muted/50 min-h-[105px] content-start">
                      {categories.map((cat) => (
                        <Badge
                          key={cat.id}
                          variant={form.categoryIds.includes(cat.id) ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer transition-all px-3 py-1 rounded-full text-xs font-bold border-muted-foreground/20",
                            form.categoryIds.includes(cat.id) 
                              ? "bg-primary shadow-lg shadow-primary/20 scale-105" 
                              : "bg-background/50 hover:bg-primary/10 hover:border-primary/30"
                          )}
                          onClick={() => toggleCategory(cat.id)}
                        >
                          {cat.name}
                        </Badge>
                      ))}
                      {categories.length === 0 && (
                        <p className="text-[10px] text-muted-foreground italic w-full text-center py-4">Chưa có danh mục nào khả dụng</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="bg-muted/50" />

                {/* Pricing & Logistics Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 pl-1">Loại nông sản</Label>
                        <Select value={form.cropType} onValueChange={(v) => setForm({ ...form, cropType: v })}>
                          <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-none">
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
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 pl-1">Hạng chất lượng</Label>
                        <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v as QualityGrade })}>
                          <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-none font-bold text-primary">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(GRADE_LABELS).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 pl-1">Giá bán (VND/KG)</Label>
                        <div className="relative group/price">
                          <Input
                            type="number"
                            value={form.pricePerKg}
                            onChange={(e) => setForm({ ...form, pricePerKg: Number(e.target.value) })}
                            className="h-12 rounded-2xl bg-muted/30 border-none pl-4 pr-12 text-lg font-black text-primary shadow-inner"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground opacity-50 group-focus-within/price:opacity-100 transition-opacity">VNĐ</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold italic pl-1">≈ {formatCurrencyInput(form.pricePerKg)} vnđ</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 pl-1">Ngày thu hoạch</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "h-12 w-full rounded-2xl bg-muted/30 border-none justify-start px-4 text-left font-bold",
                                !form.harvestDate && "text-muted-foreground font-normal"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                              {form.harvestDate ? format(form.harvestDate, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
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
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 pl-1">Mua tối thiểu (KG)</Label>
                        <Input
                          type="number"
                          value={form.minOrderKg}
                          onChange={(e) => setForm({ ...form, minOrderKg: Number(e.target.value) })}
                          className="h-12 rounded-2xl bg-muted/30 border-none font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 pl-1">Đơn vị tính</Label>
                        <Input
                          value={form.unit}
                          onChange={(e) => setForm({ ...form, unit: e.target.value })}
                          className="h-12 rounded-2xl bg-muted/30 border-none font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 pl-1">Trạng thái phát hành</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(PRODUCT_STATUS_LABELS).map(([k, v]) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setForm({ ...form, status: k as ProductStatus })}
                            className={cn(
                              "h-12 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2",
                              form.status === k 
                                ? "bg-primary/10 border-primary text-primary shadow-sm" 
                                : "bg-transparent border-muted hover:bg-muted/30"
                            )}
                          >
                            {k === 'PUBLISHED' && <CheckCircle2 className="h-3 w-3" />}
                            {k === 'DRAFT' && <Pencil className="h-3 w-3" />}
                            {k === 'OUT_OF_STOCK' && <AlertCircle className="h-3 w-3 text-amber-500" />}
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="media" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                  <div className="md:col-span-3 space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 pl-1">Mô tả chi tiết sản phẩm</Label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Mô tả hương vị đậm đà, đặc điểm của vùng trồng, hoặc cách bảo quản tốt nhất..."
                        className="w-full min-h-[220px] rounded-[1.5rem] border-none bg-muted/30 px-5 py-4 text-sm font-medium ring-offset-background placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 pl-1">Thư viện hình ảnh</Label>
                      <div className="flex gap-2">
                        <Input
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          placeholder="Link ảnh (JPG, PNG)..."
                          className="h-10 rounded-xl bg-muted/30 border-none text-xs"
                        />
                        <Button type="button" size="icon" variant="secondary" onClick={handleAddImage} className="shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 pt-2 h-[178px] overflow-y-auto pr-1">
                        {form.imageUrls.map((url, i) => (
                          <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden border border-muted bg-muted/50 shadow-sm">
                            <img src={url} alt="preview" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => handleRemoveImage(url)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {i === 0 && (
                              <Badge className="absolute top-2 left-2 bg-primary/90 backdrop-blur-md text-[8px] font-black uppercase h-4 px-1.5 leading-none rounded-md">Cover</Badge>
                            )}
                          </div>
                        ))}
                        {form.imageUrls.length === 0 && (
                          <div className="col-span-2 h-full border-2 border-dashed border-muted rounded-2xl flex flex-col items-center justify-center bg-muted/5 text-muted-foreground/40 gap-2">
                            <ImageIcon className="h-8 w-8 opacity-20" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Trống</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="p-8 bg-muted/30 border-t border-muted/50 backdrop-blur-md">
            <DialogFooter className="gap-3">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl px-6 h-12 font-bold hover:bg-background/50">
                Quay lại
              </Button>
              <Button type="submit" className="rounded-2xl px-10 h-12 shadow-2xl shadow-primary/30 font-black text-sm uppercase tracking-wider">
                {mode === 'create' ? 'Phát hành niêm yết' : 'Cập nhật thay đổi'}
              </Button>
            </DialogFooter>
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
  const products = data?.items || [];

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
                products.map((p) => (
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
                          title="Chỉnh sửa sản phẩm"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive shadow-none border hover:border-destructive/10 transition-all"
                          onClick={() => handleDelete(p.id)}
                          title="Gỡ khỏi sàn"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary shadow-none border hover:border-primary/10 transition-all"
                          asChild
                        >
                          <a href={`/products/${p.slug}`} target="_blank" rel="noreferrer" title="Xem trên sàn">
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
