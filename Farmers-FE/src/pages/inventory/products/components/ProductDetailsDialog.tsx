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
        
        {/* Header Stats Grid */}
        <div className="px-8 pt-8 flex-shrink-0">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-primary/8 flex items-center justify-center border border-primary/10 shadow-sm">
                <Package className="size-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {isEditing ? 'Cập nhật sản phẩm' : product.name}
                </h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest px-2 py-0 h-5 border-slate-200 text-slate-500">
                    SKU: {product.sku}
                  </Badge>
                  {!isEditing && (
                    <Badge className={`text-[10px] font-black h-5 ${
                      product.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {PRODUCT_STATUS_LABELS[product.status].toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-4 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold shadow-sm transition-all active:scale-95"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="size-3.5 mr-2" />
                  Chỉnh sửa
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-4 rounded-xl text-slate-400 hover:text-slate-600 font-bold"
                  onClick={() => setIsEditing(false)}
                >
                  <X className="size-3.5 mr-2" />
                  Hủy
                </Button>
              )}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100 flex flex-col gap-1 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Giá / KG</span>
                <Tag className="size-3.5 text-amber-400" />
              </div>
              {isEditing ? (
                <Input
                  type="number"
                  value={form.pricePerKg}
                  onChange={(e) => setForm({ ...form, pricePerKg: Number(e.target.value) })}
                  className="h-9 bg-white border-amber-200 text-lg font-black text-amber-900 rounded-xl"
                />
              ) : (
                <span className="text-xl font-black text-amber-900">{formatPrice(product.pricePerKg)}</span>
              )}
              <span className="text-[9px] text-amber-700/60 font-bold uppercase tracking-tighter">Giá niêm yết hiện tại</span>
            </div>
            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col gap-1 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Tồn kho</span>
                <Package className="size-3.5 text-primary/40" />
              </div>
              {isEditing ? (
                <Input
                  type="number"
                  value={form.stockKg}
                  onChange={(e) => setForm({ ...form, stockKg: Number(e.target.value) })}
                  className="h-9 bg-white border-primary/20 text-lg font-black text-primary rounded-xl"
                />
              ) : (
                <span className="text-xl font-black text-primary">{product.stockKg.toLocaleString()} {product.unit || 'kg'}</span>
              )}
              <span className="text-[9px] text-primary/60 font-bold uppercase tracking-tighter">Khả dụng trong kho</span>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-1 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trạng thái</span>
                <Activity className="size-3.5 text-slate-400" />
              </div>
              {isEditing ? (
                <Select 
                  value={form.status} 
                  onValueChange={(val) => setForm({ ...form, status: val as ProductStatus })}
                >
                  <SelectTrigger className="h-9 bg-white border-slate-300 font-bold text-slate-700 rounded-xl text-xs uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {Object.entries(PRODUCT_STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="font-medium text-[11px] uppercase tracking-wider">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2">
                  <div className={cn("size-2.5 rounded-full", product.status === 'PUBLISHED' ? "bg-green-500" : "bg-slate-300")} />
                  <span className="text-lg font-black text-slate-800">{PRODUCT_STATUS_LABELS[product.status]}</span>
                </div>
              )}
            </div>
            <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col gap-1 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Phẩm cấp</span>
                <BadgeCheck className="size-3.5 text-indigo-400" />
              </div>
              {isEditing ? (
                <Select 
                  value={form.grade} 
                  onValueChange={(val) => setForm({ ...form, grade: val as any })}
                >
                  <SelectTrigger className="h-9 bg-white border-indigo-200 font-bold text-indigo-700 rounded-xl text-xs uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {['A', 'B', 'C', 'REJECT'].map((g) => (
                      <SelectItem key={g} value={g} className="font-medium text-[11px] uppercase tracking-wider">Hạng {g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-indigo-900">Hạng {product.grade}</span>
                </div>
              )}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-14 w-full bg-slate-100/80 p-1.5 rounded-2xl mb-4">
              <TabsTrigger value="general" className="flex-1 rounded-xl font-bold text-[11px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">Thông tin & Truy xuất</TabsTrigger>
              <TabsTrigger value="media" className="flex-1 rounded-xl font-bold text-[11px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">Hình ảnh</TabsTrigger>
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
                          <div className="size-8 rounded-xl bg-slate-900 flex items-center justify-center text-white"><FileText className="size-4" /></div>
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Thông tin cơ bản</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tên sản phẩm</Label>
                            <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="h-11 rounded-xl border-slate-200" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mã SKU</Label>
                            <Input value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} className="h-11 rounded-xl border-slate-200 font-mono" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Đơn vị tính</Label>
                            <Input value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})} className="h-11 rounded-xl border-slate-200" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Đặt hàng tối thiểu</Label>
                            <Input type="number" value={form.minOrderKg} onChange={(e) => setForm({...form, minOrderKg: Number(e.target.value)})} className="h-11 rounded-xl border-slate-200" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6 pt-10 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-xl bg-green-600 flex items-center justify-center text-white"><Fingerprint className="size-4" /></div>
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Truy xuất nguồn gốc</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Loại giống cây</Label>
                            <Input value={form.cropType} onChange={(e) => setForm({...form, cropType: e.target.value})} className="h-11 rounded-xl border-slate-200" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ngày thu hoạch</Label>
                            <Input type="date" value={form.harvestDate?.split('T')[0]} onChange={(e) => setForm({...form, harvestDate: e.target.value})} className="h-11 rounded-xl border-slate-200" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mã vùng trồng (Plot)</Label>
                            <Input value={form.plotId} onChange={(e) => setForm({...form, plotId: e.target.value})} className="h-11 rounded-xl border-slate-200 font-mono" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mã hợp đồng</Label>
                            <Input value={form.contractId} onChange={(e) => setForm({...form, contractId: e.target.value})} className="h-11 rounded-xl border-slate-200 font-mono" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 pt-10 border-t border-slate-100">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Danh mục sản phẩm</Label>
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
                    <div className="space-y-12">
                      <div className="grid grid-cols-2 gap-x-12 gap-y-12">
                        {/* Basic Info Group */}
                        <div className="space-y-6">
                           <div className="flex items-center gap-3 mb-2">
                             <div className="size-8 rounded-xl bg-slate-900 flex items-center justify-center text-white"><FileText className="size-4" /></div>
                             <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Thông tin chung</h3>
                           </div>
                           <div className="space-y-4">
                             <div className="flex flex-col">
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mã định danh SKU</span>
                               <span className="text-sm font-black text-slate-700 font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">{product.sku}</span>
                             </div>
                             <div className="flex flex-col">
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Đơn vị kinh doanh</span>
                               <span className="text-sm font-black text-slate-700">Mỗi {product.unit || 'Kilôgam'}</span>
                             </div>
                             <div className="flex flex-col">
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Chính sách đặt hàng</span>
                               <span className="text-sm font-black text-slate-700">Tối thiểu {product.minOrderKg} {product.unit || 'kg'} / đơn</span>
                             </div>
                           </div>
                        </div>

                        {/* Traceability Group */}
                        <div className="space-y-6">
                           <div className="flex items-center gap-3 mb-2">
                             <div className="size-8 rounded-xl bg-green-600 flex items-center justify-center text-white"><Fingerprint className="size-4" /></div>
                             <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Truy xuất nguồn gốc</h3>
                           </div>
                           <div className="space-y-4">
                             <div className="flex items-center gap-3">
                               <Calendar className="size-4 text-slate-300" />
                               <div className="flex flex-col">
                                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Ngày thu hoạch</span>
                                 <span className="text-sm font-black text-slate-700">{product.harvestDate ? new Date(product.harvestDate).toLocaleDateString('vi-VN', { dateStyle: 'long' }) : 'Chưa cập nhật'}</span>
                               </div>
                             </div>
                             <div className="flex items-center gap-3">
                               <MapPin className="size-4 text-slate-300" />
                               <div className="flex flex-col">
                                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Vùng canh tác (Plot)</span>
                                 <span className="text-sm font-black text-slate-700 font-mono underline underline-offset-4 decoration-slate-200">{product.plot?.plotCode || product.plotId || 'N/A'}</span>
                               </div>
                             </div>
                             <div className="flex items-center gap-3">
                               <Globe className="size-4 text-slate-300" />
                               <div className="flex flex-col">
                                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Mã hợp đồng liên kết</span>
                                 <span className="text-sm font-black text-slate-700 font-mono">{product.contract?.contractNo || product.contractId || 'N/A'}</span>
                               </div>
                             </div>
                           </div>
                        </div>

                        {/* Tech & QR Section - Only show if AI data exists */}
                        {product.aiConfidenceScore !== undefined && (
                          <div className="col-span-2 p-8 rounded-3xl bg-slate-900 text-white flex items-center justify-between gap-10">
                            <div className="flex-1 space-y-6">
                              <div className="flex items-center gap-3">
                                <Cpu className="size-5 text-indigo-300" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-100">Dữ liệu AI & Minh bạch</h3>
                              </div>
                              <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                  <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Độ tin cậy dữ liệu (Confidence)</span>
                                    <span className="text-2xl font-black text-white">{product.aiConfidenceScore}%</span>
                                  </div>
                                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-white rounded-full" style={{ width: `${product.aiConfidenceScore}%` }} />
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="size-32 p-3 bg-white rounded-2xl flex flex-col items-center justify-center gap-2 shadow-2xl shrink-0">
                              <QrCode className="size-16 text-slate-900" />
                              <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest">QR Verified</span>
                            </div>
                          </div>
                        )}

                        {/* Description Section */}
                        <div className="col-span-2 space-y-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="size-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200"><ShieldCheck className="size-4" /></div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Giới thiệu sản phẩm</h3>
                          </div>
                          <p className="text-sm leading-loose text-slate-600 font-medium bg-slate-50/50 p-8 rounded-3xl border border-slate-100 italic">
                            "{product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}"
                          </p>
                        </div>
                      </div>

                      {/* System Info Footer */}
                      <div className="pt-12 border-t border-slate-100 opacity-50">
                        <div className="flex items-center justify-between text-slate-400">
                          <div className="flex items-center gap-8 text-[9px] font-bold uppercase tracking-widest">
                             <div className="flex items-center gap-2"><Fingerprint className="size-3" /> ID: {product.id}</div>
                             <div className="flex items-center gap-2"><Globe className="size-3" /> {product.slug}</div>
                             <div className="flex items-center gap-2"><History className="size-3" /> Created: {new Date(product.createdAt).toLocaleDateString('vi-VN')}</div>
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
                       <div className="space-y-6 text-center">
                          <Badge className="bg-primary/10 text-primary border-none text-[10px] h-6 px-4 font-black uppercase tracking-widest">Ảnh đại diện chính</Badge>
                          <div 
                            className="aspect-video rounded-[3rem] overflow-hidden border-8 border-slate-50 shadow-2xl shadow-slate-200/50 cursor-zoom-in"
                            onClick={() => setSelectedZoomImage(product.thumbnailUrl || product.imageUrls[0])}
                          >
                            <img src={product.thumbnailUrl || product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                       </div>
                       <div className="space-y-6 pt-6 border-t border-slate-100">
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 text-center">Album chi tiết sản phẩm</h3>
                          <div className="grid grid-cols-3 gap-6">
                            {product.imageUrls.map((url, i) => (
                              <div 
                                key={i} 
                                className="aspect-square rounded-[2rem] overflow-hidden border-4 border-slate-50 shadow-lg cursor-zoom-in hover:scale-[1.05] transition-all"
                                onClick={() => setSelectedZoomImage(url)}
                              >
                                <img src={url} alt={`${product.name} detail ${i + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
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
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
            <div className="max-w-md mx-auto bg-slate-900 rounded-2xl p-2 shadow-2xl flex items-center gap-2 pointer-events-auto border border-white/10">
              <Button
                variant="ghost"
                className="flex-1 h-12 text-white hover:bg-white/10 font-bold text-xs uppercase tracking-widest rounded-xl"
                onClick={() => setIsEditing(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                className="flex-[2] h-12 bg-white text-slate-900 hover:bg-slate-100 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-white/10"
                onClick={handleSubmit}
                disabled={isUpdating}
              >
                {isUpdating ? <Activity className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
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
