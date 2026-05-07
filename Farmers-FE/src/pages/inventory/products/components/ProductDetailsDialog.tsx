import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  MapPin, 
  User, 
  FileText, 
  Calendar, 
  Tag, 
  ChevronRight, 
  Layers,
  BarChart3,
  Image as ImageIcon,
  Info,
  Pencil,
  ShoppingBag,
  Trash2,
  CheckCircle2,
  Save,
  X,
  Activity,
  BadgeCheck,
  Cpu,
  History,
  QrCode,
  Globe,
  Fingerprint,
  ExternalLink,
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PRODUCT_STATUS_LABELS, type ProductStatus, type Product, type Category } from '@/client/types';
import { toast } from 'sonner';
import FileUpload from '@/components/custom/file-upload';
import { CustomScrollArea } from '@/components/custom/custom-scroll-area';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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
  isUpdating
}: ProductDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('marketing');
  const [selectedZoomImage, setSelectedZoomImage] = useState<string | null>(null);
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
  const [imageUrlInput, setImageUrlInput] = useState('');

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
    }
  }, [open, product]);

  if (!product) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Chưa xác định";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: vi });
    } catch {
      return "Lỗi ngày";
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleAddImage = () => {
    if (imageUrlInput && !form.imageUrls.includes(imageUrlInput)) {
      const newImages = [...form.imageUrls, imageUrlInput];
      setForm({ 
        ...form, 
        imageUrls: newImages,
        thumbnailUrl: form.thumbnailUrl || imageUrlInput // Auto-set if empty
      });
      setImageUrlInput('');
    }
  };

  const handleMultiFileUpload = async (files: File[]) => {
    try {
      const base64s = await Promise.all(files.map(file => fileToBase64(file)));
      const newImages = [...form.imageUrls];
      let addedCount = 0;
      
      for (const base64 of base64s) {
        if (!newImages.includes(base64)) {
          newImages.push(base64);
          addedCount++;
        }
      }

      if (addedCount > 0) {
        setForm({ 
          ...form, 
          imageUrls: newImages,
          thumbnailUrl: form.thumbnailUrl || newImages[0]
        });
        toast.success(`Đã tải lên ${addedCount} ảnh vào Album`);
      }
    } catch (error) {
      toast.error('Lỗi khi tải ảnh lên Album');
      console.error(error);
    }
  };

  const handleThumbnailUpload = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      setForm({ ...form, thumbnailUrl: base64 });
      toast.success('Đã cập nhật ảnh đại diện');
    } catch (error) {
      toast.error('Lỗi khi tải ảnh đại diện');
      console.error(error);
    }
  };

  const handleRemoveImage = (url: string) => {
    setForm({ ...form, imageUrls: form.imageUrls.filter((u) => u !== url) });
  };

  const toggleCategory = (id: string) => {
    setForm(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter(cid => cid !== id)
        : [...prev.categoryIds, id]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm');
      return;
    }

    // Filter out read-only traceability fields that the backend doesn't allow in UpdateProductDto
    const { 
      harvestDate, 
      plotId, 
      contractId, 
      ...updatePayload 
    } = form;

    await onUpdate(updatePayload);
    setIsEditing(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[720px] p-0 flex flex-col h-full font-manrope border-l-0 shadow-2xl">
        
        {/* Header Section */}
        <SheetHeader className="relative overflow-hidden border-b px-8 py-10 flex-shrink-0 bg-linear-to-b from-primary/[0.07] via-background to-background dark:from-primary/20">
          <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="size-16 rounded-[2rem] bg-primary text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/25 border-4 border-white/50">
                <Package className="size-8" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 h-5 border-primary/20 bg-primary/5 text-primary shadow-xs">
                    SKU: {product.sku}
                  </Badge>
                  {!isEditing && (
                    <Badge className={cn(
                      "text-[10px] font-black h-5 px-2.5 uppercase tracking-wider shadow-sm",
                      product.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-600 border border-slate-500/20'
                    )}>
                      {PRODUCT_STATUS_LABELS[product.status]}
                    </Badge>
                  )}
                </div>
                <SheetTitle className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                  {isEditing ? 'Cập nhật sản phẩm' : product.name}
                </SheetTitle>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-5 rounded-2xl border-primary/20 bg-white text-primary hover:bg-primary/5 font-black shadow-sm transition-all active:scale-95"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="size-4 mr-2" />
                  Chỉnh sửa
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 px-5 rounded-2xl text-slate-400 hover:text-slate-600 font-black"
                  onClick={() => setIsEditing(false)}
                >
                  <X className="size-4 mr-2" />
                  Hủy bỏ
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Quick Stats Grid */}
        <div className="px-8 py-6 flex-shrink-0">
          <div className="grid grid-cols-4 gap-4">
            <div className="group relative min-w-0 overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-card to-primary/[0.04] p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-primary/70 uppercase tracking-widest">Giá niêm yết</span>
                <div className="size-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                  <Tag className="size-4" />
                </div>
              </div>
              {isEditing ? (
                <div className="relative mt-2">
                   <Input
                    type="number"
                    value={form.pricePerKg}
                    onChange={(e) => setForm({ ...form, pricePerKg: Number(e.target.value) })}
                    className="h-10 bg-white border-primary/20 text-lg font-black text-primary rounded-xl pl-3 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary/40">đ</span>
                </div>
              ) : (
                <span className="mt-2 text-2xl font-black text-slate-900 tracking-tight">{formatPrice(product.pricePerKg)}</span>
              )}
              <span className="mt-1 text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Giá bán lẻ trên KG</span>
            </div>

            <div className="group relative min-w-0 overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-card to-primary/[0.04] p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-primary/70 uppercase tracking-widest">Tồn kho</span>
                <div className="size-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                  <Package className="size-4" />
                </div>
              </div>
              {isEditing ? (
                <div className="relative mt-2">
                  <Input
                    type="number"
                    value={form.stockKg}
                    onChange={(e) => setForm({ ...form, stockKg: Number(e.target.value) })}
                    className="h-10 bg-white border-primary/20 text-lg font-black text-primary rounded-xl pl-3 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary/40">kg</span>
                </div>
              ) : (
                <span className="mt-2 text-2xl font-black text-slate-900 tracking-tight">{product.stockKg.toLocaleString()} {product.unit || 'kg'}</span>
              )}
              <span className="mt-1 text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Khả dụng trong kho</span>
            </div>

            <div className="group relative min-w-0 overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-card to-primary/[0.04] p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-primary/70 uppercase tracking-widest">Trạng thái</span>
                <div className="size-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                  <Activity className="size-4" />
                </div>
              </div>
              {isEditing ? (
                <Select 
                  value={form.status} 
                  onValueChange={(val) => setForm({ ...form, status: val as ProductStatus })}
                >
                  <SelectTrigger className="h-10 mt-2 bg-white border-primary/20 font-black text-primary rounded-xl text-[10px] uppercase tracking-wider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                    {Object.entries(PRODUCT_STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="font-black text-[10px] uppercase tracking-widest">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-2 flex items-center gap-2">
                  <div className={cn("size-2.5 rounded-full animate-pulse", product.status === 'PUBLISHED' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-400")} />
                  <span className="text-2xl font-black tracking-tight text-slate-900">{PRODUCT_STATUS_LABELS[product.status]}</span>
                </div>
              )}
              <span className="mt-1 text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Trạng thái thương mại</span>
            </div>

            <div className="group relative min-w-0 overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-card to-primary/[0.04] p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-primary/70 uppercase tracking-widest">Chất lượng</span>
                <div className="size-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                  <BadgeCheck className="size-4" />
                </div>
              </div>
              {isEditing ? (
                <Select 
                  value={form.grade} 
                  onValueChange={(val) => setForm({ ...form, grade: val as any })}
                >
                  <SelectTrigger className="h-10 mt-2 bg-white border-primary/20 font-black text-primary rounded-xl text-[10px] uppercase tracking-wider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-indigo-100 shadow-xl">
                    {['A', 'B', 'C', 'REJECT'].map((g) => (
                      <SelectItem key={g} value={g} className="font-black text-[10px] uppercase tracking-widest">Hạng {g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="mt-2 text-2xl font-black text-slate-900 tracking-tight">Hạng {product.grade}</span>
              )}
              <span className="mt-1 text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Phẩm cấp nông sản</span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-8">
            <TabsList className="h-14 w-full bg-primary/5 p-1.5 rounded-3xl mb-0">
              <TabsTrigger value="general" className="flex-1 rounded-[1.25rem] font-black text-[11px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all">
                Thông tin & Truy xuất
              </TabsTrigger>
              <TabsTrigger value="media" className="flex-1 rounded-[1.25rem] font-black text-[11px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all">
                Hình ảnh Album
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content Section - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <Tabs value={activeTab}>
            <TabsContent value="general" className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <CustomScrollArea className="h-full">
                <div className="px-8 pb-32 space-y-12 pt-4">
                  {isEditing ? (
                    <div className="space-y-10">
                      {/* Edit Mode General Info */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20"><FileText className="size-4.5" /></div>
                          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Thông tin cơ bản</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên sản phẩm</Label>
                            <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="h-12 rounded-2xl border-slate-200 focus:border-primary/50 bg-white" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã SKU</Label>
                            <Input value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} className="h-12 rounded-2xl border-slate-200 font-mono bg-white" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đơn vị tính</Label>
                            <Input value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})} className="h-12 rounded-2xl border-slate-200 bg-white" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đặt hàng tối thiểu</Label>
                            <Input type="number" value={form.minOrderKg} onChange={(e) => setForm({...form, minOrderKg: Number(e.target.value)})} className="h-12 rounded-2xl border-slate-200 bg-white" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6 pt-10 border-t border-primary/5">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20"><Fingerprint className="size-4.5" /></div>
                          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Truy xuất nguồn gốc</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Loại giống cây</Label>
                            <Input value={form.cropType} onChange={(e) => setForm({...form, cropType: e.target.value})} className="h-12 rounded-2xl border-slate-200 bg-white" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ngày thu hoạch</Label>
                            <Input type="date" value={form.harvestDate?.split('T')[0]} onChange={(e) => setForm({...form, harvestDate: e.target.value})} className="h-12 rounded-2xl border-slate-200 bg-white" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã vùng trồng (Plot)</Label>
                            <Input value={form.plotId} onChange={(e) => setForm({...form, plotId: e.target.value})} className="h-12 rounded-2xl border-slate-200 font-mono bg-white" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã hợp đồng</Label>
                            <Input value={form.contractId} onChange={(e) => setForm({...form, contractId: e.target.value})} className="h-12 rounded-2xl border-slate-200 font-mono bg-white" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 pt-10 border-t border-primary/5">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Danh mục sản phẩm</Label>
                        <div className="flex flex-wrap gap-2">
                          {categories.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => toggleCategory(cat.id)}
                              className={cn(
                                "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all border",
                                form.categoryIds.includes(cat.id)
                                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/25"
                                  : "bg-white border-slate-200 text-slate-400 hover:border-primary/30 hover:text-primary"
                              )}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4 pt-10 border-t border-slate-100">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mô tả sản phẩm</Label>
                        <textarea
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                          className="w-full min-h-[150px] rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm resize-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-16 pt-4">
                      <div className="grid grid-cols-2 gap-x-12 gap-y-16">
                        {/* Basic Info Group */}
                        <div className="space-y-8">
                           <div className="flex items-center gap-3">
                             <div className="size-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20"><FileText className="size-4.5" /></div>
                             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Thông tin chung</h3>
                           </div>
                           <div className="space-y-6">
                             <div className="flex flex-col gap-1">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mã định danh SKU</span>
                               <span className="text-sm font-black text-primary font-mono bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 w-fit">{product.sku}</span>
                             </div>
                             <div className="flex flex-col gap-0.5">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Đơn vị kinh doanh</span>
                               <span className="text-base font-black text-slate-900">Mỗi {product.unit || 'Kilôgam'}</span>
                             </div>
                             <div className="flex flex-col gap-0.5">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Chính sách đặt hàng</span>
                               <span className="text-base font-black text-slate-900">Tối thiểu {product.minOrderKg} {product.unit || 'kg'} / đơn</span>
                             </div>
                           </div>
                        </div>

                        {/* Traceability Group */}
                        <div className="space-y-8">
                           <div className="flex items-center gap-3">
                             <div className="size-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20"><Fingerprint className="size-4.5" /></div>
                             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Truy xuất nguồn gốc</h3>
                           </div>
                           <div className="space-y-6">
                             <div className="flex items-start gap-4">
                               <div className="size-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                                 <Calendar className="size-5" />
                               </div>
                               <div className="flex flex-col">
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ngày thu hoạch</span>
                                 <span className="text-sm font-black text-slate-900">{product.harvestDate ? new Date(product.harvestDate).toLocaleDateString('vi-VN', { dateStyle: 'long' }) : 'Chưa cập nhật'}</span>
                               </div>
                             </div>
                             <div className="flex items-start gap-4">
                               <div className="size-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                                 <MapPin className="size-5" />
                               </div>
                               <div className="flex flex-col">
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vùng canh tác (Plot)</span>
                                 <span className="text-sm font-black text-primary font-mono underline underline-offset-4 decoration-primary/20">{product.plot?.plotCode || product.plotId || 'N/A'}</span>
                               </div>
                             </div>
                             <div className="flex items-start gap-4">
                               <div className="size-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                                 <Globe className="size-5" />
                               </div>
                               <div className="flex flex-col">
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mã hợp đồng liên kết</span>
                                 <span className="text-sm font-black text-slate-900 font-mono">{product.contract?.contractNo || product.contractId || 'N/A'}</span>
                               </div>
                             </div>
                           </div>
                        </div>

                        {/* Tech & QR Section */}
                        {product.aiConfidenceScore !== undefined && (
                          <div className="col-span-2 p-10 rounded-[2.5rem] bg-linear-to-br from-primary to-primary-foreground text-white flex items-center justify-between gap-10 shadow-2xl shadow-primary/20 relative overflow-hidden group">
                            <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-white/10 blur-[80px]" />
                            <div className="flex-1 space-y-8 relative">
                              <div className="flex items-center gap-3">
                                <div className="size-8 rounded-xl bg-white/20 flex items-center justify-center text-white"><Cpu className="size-5" /></div>
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/70">Minh bạch dữ liệu AI</h3>
                              </div>
                              <div className="space-y-5">
                                <div className="flex flex-col gap-3">
                                  <div className="flex justify-between items-end">
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">Độ tin cậy xác thực (Confidence)</span>
                                    <span className="text-3xl font-black text-white">{product.aiConfidenceScore}%</span>
                                  </div>
                                  <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-1000" style={{ width: `${product.aiConfidenceScore}%` }} />
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="size-36 p-4 bg-white rounded-3xl flex flex-col items-center justify-center gap-2 shadow-2xl shrink-0 group-hover:scale-110 transition-transform duration-500">
                              <QrCode className="size-20 text-primary" />
                              <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">QR Verified</span>
                            </div>
                          </div>
                        )}

                        {/* Description Section */}
                        <div className="col-span-2 space-y-6">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20"><ShieldCheck className="size-4.5" /></div>
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Giới thiệu sản phẩm</h3>
                          </div>
                          <div className="relative">
                            <div className="absolute -left-4 top-0 bottom-0 w-1.5 bg-indigo-500/20 rounded-full" />
                            <p className="text-base leading-[2] text-slate-600 font-medium px-4 italic">
                              "{product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}"
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* System Info Footer */}
                      <div className="pt-16 border-t border-slate-100 opacity-40">
                        <div className="flex items-center justify-between text-slate-400">
                          <div className="flex flex-wrap items-center gap-x-10 gap-y-3 text-[10px] font-black uppercase tracking-widest">
                             <div className="flex items-center gap-2.5"><Fingerprint className="size-3.5" /> ID: {product.id}</div>
                             <div className="flex items-center gap-2.5"><Globe className="size-3.5" /> {product.slug}</div>
                             <div className="flex items-center gap-2.5"><History className="size-3.5" /> Created: {new Date(product.createdAt).toLocaleDateString('vi-VN')}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CustomScrollArea>
            </TabsContent>

            <TabsContent value="media" className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <CustomScrollArea className="h-full">
                <div className="px-8 pb-32 pt-4 space-y-10">
                  {isEditing ? (
                    <div className="space-y-10">
                       <div className="space-y-4">
                         <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ảnh đại diện (Thumbnail)</Label>
                         <FileUpload multiple={false} onFileSelect={handleThumbnailUpload} />
                         {form.thumbnailUrl && (
                           <div className="mt-4 aspect-video rounded-3xl overflow-hidden border-4 border-slate-50 shadow-lg">
                             <img src={form.thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover" />
                           </div>
                         )}
                       </div>
                       <div className="space-y-4 pt-10 border-t border-slate-100">
                         <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Album hình ảnh ({form.imageUrls.length})</Label>
                         <FileUpload multiple={true} onFilesSelect={handleMultiFileUpload} />
                         <div className="grid grid-cols-4 gap-4 mt-6">
                           {form.imageUrls.map((url, i) => (
                             <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-100">
                               <img src={url} alt="album" className="w-full h-full object-cover" />
                               <div className="absolute inset-0 bg-rose-500/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer" onClick={() => handleRemoveImage(url)}>
                                 <Trash2 className="size-5 text-white" />
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                    </div>
                  ) : (
                    <div className="space-y-12">
                    <div className="space-y-16">
                       <div className="space-y-8">
                          <div className="flex items-center justify-center">
                            <Badge className="bg-primary/10 text-primary border-none text-[11px] h-8 px-6 font-black uppercase tracking-[0.2em] rounded-full">Ảnh đại diện chính</Badge>
                          </div>
                          <div 
                            className="aspect-video rounded-[3.5rem] overflow-hidden border-[12px] border-slate-50 shadow-2xl shadow-slate-200/50 cursor-zoom-in group relative"
                            onClick={() => setSelectedZoomImage(product.thumbnailUrl || product.imageUrls[0])}
                          >
                            <img src={product.thumbnailUrl || product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ImageIcon className="size-12 text-white/80" />
                            </div>
                          </div>
                       </div>
                       <div className="space-y-10 pt-10 border-t border-slate-100">
                          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Album chi tiết sản phẩm</h3>
                          <div className="grid grid-cols-3 gap-8">
                            {product.imageUrls.map((url, i) => (
                              <div 
                                key={i} 
                                className="aspect-square rounded-[2.5rem] overflow-hidden border-8 border-slate-50 shadow-xl cursor-zoom-in hover:scale-[1.08] transition-all duration-500 group relative"
                                onClick={() => setSelectedZoomImage(url)}
                              >
                                <img src={url} alt={`${product.name} detail ${i + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            ))}
                          </div>
                       </div>
                    </div>
                    </div>
                  )}
                </div>
              </CustomScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Floating Action Bar (In Edit Mode) */}
        {isEditing && (
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none">
            <div className="max-w-md mx-auto bg-slate-900 rounded-[2.5rem] p-2.5 shadow-2xl flex items-center gap-2 pointer-events-auto border border-white/10 shadow-slate-900/40">
              <Button
                variant="ghost"
                className="flex-1 h-14 text-slate-400 hover:bg-white/5 hover:text-white font-black text-[11px] uppercase tracking-widest rounded-[1.75rem] transition-all"
                onClick={() => setIsEditing(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                className="flex-[2] h-14 bg-slate-900 text-white hover:bg-slate-800 font-black text-[11px] uppercase tracking-widest rounded-[1.75rem] shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
                onClick={handleSubmit}
                disabled={isUpdating}
              >
                {isUpdating ? <Activity className="size-5 animate-spin mr-2" /> : <Save className="size-5 mr-2" />}
                Lưu thay đổi
              </Button>
            </div>
          </div>
        )}
      </SheetContent>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedZoomImage} onOpenChange={(open) => !open && setSelectedZoomImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-transparent shadow-none flex items-center justify-center focus-visible:outline-none">
          <DialogTitle className="sr-only">Phóng to hình ảnh</DialogTitle>
          {selectedZoomImage && (
            <div className="relative animate-in zoom-in-95 duration-200">
              <img 
                src={selectedZoomImage} 
                alt="Full size" 
                className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-12 right-0 text-white hover:bg-white/10 rounded-full h-10 w-10"
                onClick={() => setSelectedZoomImage(null)}
              >
                <X className="size-6" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
