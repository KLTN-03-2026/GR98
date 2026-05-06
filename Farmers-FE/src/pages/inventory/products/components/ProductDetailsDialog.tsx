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
  X
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PRODUCT_STATUS_LABELS, type ProductStatus } from '@/client/types';
import { toast } from 'sonner';
import FileUpload from '@/components/custom/file-upload';

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
  product: any;
  categories: any[];
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
  });
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Reset state when drawer opens or product changes
  useEffect(() => {
    if (open && product) {
      setIsEditing(false);
      setActiveTab('marketing');
      setForm({
        name: product.name || '',
        description: product.description || '',
        minOrderKg: product.minOrderKg || 1,
        unit: product.unit || 'kg',
        status: product.status || 'DRAFT',
        imageUrls: product.imageUrls || [],
        thumbnailUrl: product.thumbnailUrl || product.imageUrls?.[0] || '',
        categoryIds: product.categories?.map((c: any) => c.id) || [],
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
    await onUpdate(form);
    setIsEditing(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[720px] p-0 flex flex-col h-full font-manrope border-l-0 shadow-2xl">
        
        {/* Header Section - Fixed */}
        <SheetHeader className="p-8 border-b border-slate-100 bg-white flex-shrink-0 space-y-0">
          <SheetTitle className="sr-only">{product.name}</SheetTitle>
          <div className="flex items-start justify-between">
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
                      {product.status === 'PUBLISHED' ? 'ĐANG NIÊM YẾT' : 'NHÁP'}
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

          {isEditing && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
              <TabsList className="bg-slate-100/50 p-1 rounded-2xl h-12 w-full grid grid-cols-2 gap-1">
                <TabsTrigger value="marketing" className="rounded-xl text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
                  1. Thông tin bán hàng
                </TabsTrigger>
                <TabsTrigger value="media" className="rounded-xl text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
                  2. Hình ảnh & Mô tả
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </SheetHeader>

        {/* Content Section - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
          {isEditing ? (
            <div className="p-8 pb-24">
              <form id="edit-product-form" onSubmit={handleSubmit}>
                <Tabs value={activeTab}>
                  <TabsContent value="marketing" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tên sản phẩm thương mại <span className="text-rose-500">*</span></Label>
                        <Input
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="Ví dụ: Sầu riêng Ri6 Chín Hóa (Loại 1)"
                          className="h-14 rounded-2xl border-slate-200 bg-white px-6 text-base font-bold text-slate-900 focus-visible:ring-primary shadow-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Số lượng mua tối thiểu</Label>
                          <div className="relative group">
                            <Input
                              type="number"
                              value={form.minOrderKg}
                              onChange={(e) => setForm({ ...form, minOrderKg: Number(e.target.value) })}
                              className="h-12 rounded-xl border-slate-200 bg-white font-bold tabular-nums text-sm shadow-sm px-6"
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
                            className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm shadow-sm uppercase px-6"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Trạng thái phát hành</Label>
                        <div className="flex gap-2 p-1 rounded-2xl bg-slate-50 border border-slate-100 h-12 items-center">
                          {[
                            { id: 'PUBLISHED', label: 'Công khai', active: 'bg-white text-emerald-600 shadow-sm border-emerald-100 border' },
                            { id: 'DRAFT', label: 'Lưu nháp', active: 'bg-white text-slate-600 shadow-sm border-slate-200 border' }
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setForm({ ...form, status: item.id as ProductStatus })}
                              className={cn(
                                "flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                form.status === item.id ? item.active : "text-slate-400 hover:text-slate-600"
                              )}
                            >
                               {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
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
                  </TabsContent>

                  <TabsContent value="media" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Giới thiệu chi tiết</Label>
                        <textarea
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                          placeholder="Nhập giới thiệu chi tiết về nông sản, phương pháp canh tác..."
                          className="w-full min-h-[200px] rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-medium text-slate-700 placeholder:text-slate-300 focus-visible:ring-primary transition-all resize-none shadow-sm"
                        />
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between ml-1">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tải ảnh vào Album (Chọn nhiều ảnh)</Label>
                            <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-slate-200 text-slate-400 uppercase font-black tracking-tighter">Multi-Upload</Badge>
                          </div>
                          <FileUpload 
                            multiple={true}
                            onFilesSelect={handleMultiFileUpload}
                            onFileError={(err) => toast.error(err)}
                            maxFileSize={5 * 1024 * 1024}
                            acceptedFileTypes={["image/*"]}
                          />
                          
                          {/* Album Gallery Grid - Moved up for better visibility */}
                          <div className="grid grid-cols-4 gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-100 min-h-[140px] mt-2">
                            {form.imageUrls.map((url, i) => (
                              <div 
                                key={i} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedZoomImage(url);
                                }}
                                className={cn(
                                  "group relative aspect-square rounded-xl overflow-hidden border transition-all cursor-zoom-in",
                                  form.thumbnailUrl === url ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-slate-200 bg-white"
                                )}
                              >
                                <img src={url} alt="product" className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                  <button
                                    type="button"
                                    className="h-7 w-7 rounded-full bg-slate-900/60 text-white flex items-center justify-center shadow-lg hover:bg-primary transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setForm({ ...form, thumbnailUrl: url });
                                    }}
                                    title="Chọn làm ảnh đại diện"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    className="h-7 w-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveImage(url);
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                {form.thumbnailUrl === url && (
                                  <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-primary text-white text-[6px] font-black uppercase tracking-tighter rounded shadow-sm">
                                    COVER
                                  </div>
                                )}
                              </div>
                            ))}
                            {form.imageUrls.length === 0 && (
                              <div className="col-span-4 flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                                <ImageIcon className="size-8 opacity-20" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Album đang trống</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-slate-100">
                          <div className="flex items-center justify-between ml-1">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ảnh đại diện (Thumbnail)</Label>
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none text-[8px] h-4 px-1.5 uppercase font-black tracking-tighter">Single-Upload</Badge>
                          </div>
                          
                          <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-4">
                              {form.thumbnailUrl ? (
                                <div className="aspect-square rounded-2xl overflow-hidden border border-slate-200 relative group cursor-zoom-in" onClick={() => setSelectedZoomImage(form.thumbnailUrl)}>
                                  <img src={form.thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                    <p className="text-[8px] font-black text-white uppercase">Xem ảnh</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="aspect-square rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400">
                                  <ImageIcon className="size-6 opacity-20" />
                                  <span className="text-[8px] font-bold uppercase">No Thumbnail</span>
                                </div>
                              )}
                            </div>
                            <div className="col-span-8 space-y-4">
                              <FileUpload 
                                multiple={false}
                                onFileSelect={handleThumbnailUpload}
                                onFileError={(err) => toast.error(err)}
                                maxFileSize={5 * 1024 * 1024}
                                acceptedFileTypes={["image/*"]}
                              />
                              <div className="relative group">
                                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                                <Input
                                  value={form.thumbnailUrl}
                                  onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                                  placeholder="Dán URL ảnh đại diện..."
                                  className="h-10 rounded-xl border-slate-200 bg-white pl-12 focus-visible:ring-primary text-xs shadow-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                    </div>
                  </div>
                </TabsContent>
                </Tabs>
              </form>
            </div>
          ) : (
            <div className="p-8 space-y-10 pb-20">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Giá niêm yết</span>
                  <span className="text-lg font-black text-amber-900">{formatPrice(product.pricePerKg)}</span>
                  <span className="text-[10px] text-amber-700/60 font-medium">mỗi kilôgam</span>
                </div>
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Tồn kho hiện tại</span>
                  <span className="text-lg font-black text-primary">{product.stockKg?.toLocaleString()} kg</span>
                  <span className="text-[10px] text-primary/60 font-medium">khả dụng bán</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phẩm cấp</span>
                  <div className="flex items-center gap-1.5">
                    <Badge className="bg-slate-900 text-white text-[10px] font-black h-6 px-3">HẠNG {product.grade}</Badge>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium italic mt-0.5">{product.cropType}</span>
                </div>
              </div>

              {/* Traceability Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="size-4 text-slate-400" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Truy xuất nguồn gốc</h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/20 bg-primary/5">ID: {product.id.slice(-8).toUpperCase()}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="size-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="size-4 text-slate-400" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Hợp đồng liên kết</p>
                        <p className="text-sm font-bold text-slate-700">{product.contract?.contractNo || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="size-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                        <User className="size-4 text-slate-400" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Chủ hộ canh tác</p>
                        <p className="text-sm font-bold text-slate-700">{product.contract?.farmer?.fullName || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="size-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                        <MapPin className="size-4 text-rose-500" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Mã thửa đất</p>
                        <p className="text-sm font-bold text-slate-700">{product.plot?.plotCode || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="size-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                        <Calendar className="size-4 text-slate-400" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Ngày thu hoạch</p>
                        <p className="text-sm font-bold text-slate-700">{formatDate(product.harvestDate)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Images Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <ImageIcon className="size-4 text-slate-400" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Hình ảnh sản phẩm</h3>
                </div>
                
                <div className="grid grid-cols-4 gap-3">
                  {(product.thumbnailUrl || product.imageUrls?.[0]) ? (
                  <div 
                    className="aspect-square rounded-xl overflow-hidden border border-slate-200 relative group cursor-zoom-in"
                    onClick={() => setSelectedZoomImage(product.thumbnailUrl || product.imageUrls[0])}
                  >
                    <img src={product.thumbnailUrl || product.imageUrls[0]} alt="Thumbnail" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-center">
                      <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Thumbnail</span>
                    </div>
                  </div>
                  ) : (
                    <div className="aspect-square rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50 gap-1 text-slate-400">
                      <ImageIcon className="size-5 opacity-20" />
                      <span className="text-[8px] font-bold">Trống</span>
                    </div>
                  )}

                  {product.imageUrls?.map((url: string, index: number) => (
                    <div 
                      key={index} 
                      className="aspect-square rounded-xl overflow-hidden border border-slate-200 cursor-zoom-in group"
                      onClick={() => setSelectedZoomImage(url)}
                    >
                      <img src={url} alt={`Detail ${index + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories & Description */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="size-4 text-slate-400" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Phân loại danh mục</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.categories?.length > 0 ? (
                      product.categories.map((cat: any) => (
                        <Badge key={cat.id} className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-none px-4 py-1.5 rounded-full text-[11px] font-bold">
                          {cat.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic font-medium">Chưa gắn danh mục</span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="size-4 text-slate-400" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Mô tả sản phẩm</h3>
                  </div>
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 min-h-[100px]">
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      {product.description || "Không có mô tả cho sản phẩm này."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Section - Fixed */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
          {!isEditing ? (
            <>
              <div className="flex items-center gap-2 text-slate-400">
                <Layers className="size-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Hệ thống quản lý niêm yết v2.0</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400">CREATED:</span>
                <span className="text-[10px] font-bold text-slate-600">{formatDate(product.createdAt)}</span>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-6 rounded-xl font-bold text-slate-500"
                onClick={() => setIsEditing(false)}
                disabled={isUpdating}
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                className="h-10 px-10 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 flex items-center gap-2"
                onClick={handleSubmit}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Lưu thay đổi
              </Button>
            </div>
          )}
        </div>
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
