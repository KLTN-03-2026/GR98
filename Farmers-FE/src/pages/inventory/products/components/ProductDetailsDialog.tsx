import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  Loader2
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
  DialogHeader,
  DialogFooter
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        showCloseButton
        className="flex w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] max-h-[min(94dvh,1080px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl lg:max-w-7xl font-manrope"
      >
        <DialogHeader className="shrink-0 border-b px-6 py-4 text-left sm:px-8 bg-slate-50/50">
          <div className="flex items-center justify-between pr-8">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold text-slate-900">
                {isEditing ? 'Cập nhật sản phẩm' : product.name}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider px-2 py-0 h-5 bg-white border-slate-200 text-slate-500">
                  SKU: {product.sku}
                </Badge>
                <Badge className={cn(
                  "text-[10px] font-bold h-5 px-2 uppercase tracking-wider",
                  product.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-600 border border-slate-500/20'
                )}>
                  {PRODUCT_STATUS_LABELS[product.status]}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-4 rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold shadow-sm transition-all"
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
                  Hủy bỏ
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 sm:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-11 w-full bg-slate-100 p-1 rounded-xl mb-6">
              <TabsTrigger value="general" className="flex-1 rounded-lg font-bold text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
                Thông tin & Truy xuất
              </TabsTrigger>
              <TabsTrigger value="media" className="flex-1 rounded-lg font-bold text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
                Hình ảnh Album
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="m-0 space-y-8 animate-in fade-in duration-300">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-slate-900 border-b pb-2">
                      <FileText className="size-4" />
                      <h3 className="text-sm font-bold uppercase tracking-wider">Thông tin cơ bản</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">Tên sản phẩm</Label>
                        <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="h-10 rounded-xl" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold text-slate-500 uppercase">Mã SKU</Label>
                          <Input value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} className="h-10 rounded-xl font-mono" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold text-slate-500 uppercase">Trạng thái</Label>
                          <Select value={form.status} onValueChange={(val) => setForm({ ...form, status: val as ProductStatus })}>
                            <SelectTrigger className="h-10 rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {Object.entries(PRODUCT_STATUS_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold text-slate-500 uppercase">Giá bán (VNĐ/kg)</Label>
                          <Input type="number" value={form.pricePerKg} onChange={(e) => setForm({...form, pricePerKg: Number(e.target.value)})} className="h-10 rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold text-slate-500 uppercase">Tồn kho (kg)</Label>
                          <Input type="number" value={form.stockKg} onChange={(e) => setForm({...form, stockKg: Number(e.target.value)})} className="h-10 rounded-xl" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-slate-900 border-b pb-2">
                      <Fingerprint className="size-4" />
                      <h3 className="text-sm font-bold uppercase tracking-wider">Truy xuất & Mô tả</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold text-slate-500 uppercase">Loại giống</Label>
                          <Input value={form.cropType} onChange={(e) => setForm({...form, cropType: e.target.value})} className="h-10 rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold text-slate-500 uppercase">Phẩm cấp</Label>
                          <Select value={form.grade} onValueChange={(val) => setForm({ ...form, grade: val as any })}>
                            <SelectTrigger className="h-10 rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {['A', 'B', 'C', 'REJECT'].map((g) => (
                                <SelectItem key={g} value={g}>Hạng {g}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">Mô tả sản phẩm</Label>
                        <textarea
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                          className="w-full min-h-[100px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                  <div className="lg:col-span-2 space-y-8">
                    {/* General Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                          <FileText className="size-3.5" />
                          <span className="text-[11px] font-bold uppercase tracking-wider">Thông tin chung</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-sm text-slate-500">Giá niêm yết</span>
                            <span className="text-sm font-bold text-slate-900">{formatPrice(product.pricePerKg)}/kg</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-sm text-slate-500">Tồn kho hiện tại</span>
                            <span className="text-sm font-bold text-slate-900">{product.stockKg.toLocaleString()} {product.unit || 'kg'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-sm text-slate-500">Chất lượng</span>
                            <span className="text-sm font-bold text-slate-900">Hạng {product.grade}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-sm text-slate-500">Giống cây</span>
                            <span className="text-sm font-bold text-slate-900">{product.cropType || '—'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                          <Fingerprint className="size-3.5" />
                          <span className="text-[11px] font-bold uppercase tracking-wider">Nguồn gốc & Hệ thống</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-sm text-slate-500">Mã vùng trồng</span>
                            <span className="text-sm font-mono font-medium text-primary">{product.plot?.plotCode || '—'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-sm text-slate-500">Mã hợp đồng</span>
                            <span className="text-sm font-mono font-medium text-slate-900">{product.contract?.contractNo || '—'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-sm text-slate-500">Ngày thu hoạch</span>
                            <span className="text-sm font-bold text-slate-900">{product.harvestDate ? formatDate(product.harvestDate) : '—'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-sm text-slate-500">Độ tin cậy AI</span>
                            <span className="text-sm font-bold text-emerald-600">{product.aiConfidenceScore ? `${product.aiConfidenceScore}%` : '—'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Info className="size-3.5" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Mô tả chi tiết</span>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                        {product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
                      </p>
                    </div>
                  </div>

                  {/* Sidebar Info */}
                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-4">
                      <div className="flex items-center gap-2 text-slate-500 border-b pb-2">
                        <QrCode className="size-3.5" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Mã định danh QR</span>
                      </div>
                      <div className="flex flex-col items-center gap-3 py-2">
                        <div className="size-32 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                          <QrCode className="size-20 text-slate-300" />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{product.qrCode}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <History className="size-3" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Nhật ký hệ thống</span>
                      </div>
                      <div className="text-[11px] text-slate-500 space-y-2">
                        <p>ID: <span className="font-mono text-[10px]">{product.id}</span></p>
                        <p>Tạo: {formatDate(product.createdAt)}</p>
                        <p>Cập nhật: {formatDate(product.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="media" className="m-0 space-y-8 animate-in fade-in duration-300 pb-10">
              {isEditing ? (
                <div className="space-y-8">
                   <div className="space-y-4">
                     <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ảnh đại diện chính</Label>
                     <FileUpload multiple={false} onFileSelect={handleThumbnailUpload} />
                     {form.thumbnailUrl && (
                       <div className="mt-4 aspect-video max-w-md rounded-2xl overflow-hidden border border-slate-200">
                         <img src={form.thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover" />
                       </div>
                     )}
                   </div>
                   <div className="space-y-4 pt-8 border-t">
                     <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Album hình ảnh ({form.imageUrls.length})</Label>
                     <FileUpload multiple={true} onFilesSelect={handleMultiFileUpload} />
                     <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                       {form.imageUrls.map((url, i) => (
                         <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200">
                           <img src={url} alt="album" className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-rose-500/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer" onClick={() => handleRemoveImage(url)}>
                             <Trash2 className="size-4 text-white" />
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ảnh đại diện</span>
                      <div 
                        className="aspect-video rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm cursor-zoom-in group relative"
                        onClick={() => setSelectedZoomImage(product.thumbnailUrl || product.imageUrls[0])}
                      >
                        <img src={product.thumbnailUrl || product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Album ({product.imageUrls.length} ảnh)</span>
                      <div className="grid grid-cols-3 gap-3">
                        {product.imageUrls.map((url, i) => (
                          <div 
                            key={i} 
                            className="aspect-square rounded-xl overflow-hidden border border-slate-100 shadow-sm cursor-zoom-in hover:opacity-90 transition-all"
                            onClick={() => setSelectedZoomImage(url)}
                          >
                            <img src={url} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-3 sm:justify-end sm:px-8 bg-slate-50/50 gap-2">
          {isEditing && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px] font-bold rounded-xl"
              onClick={handleSubmit}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
              Lưu thay đổi
            </Button>
          )}
          <Button type="button" variant="secondary" className="font-bold rounded-xl" onClick={() => onOpenChange(false)} disabled={isUpdating}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>

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
    </Dialog>
  );
}
