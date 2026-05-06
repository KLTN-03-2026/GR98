import React from 'react';
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
  Info
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface ProductDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

export function ProductDetailsDialog({
  open,
  onOpenChange,
  product
}: ProductDetailsDialogProps) {
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[640px] p-0 flex flex-col h-full font-manrope border-l-0 shadow-2xl">
        {/* Header Section - Fixed */}
        <div className="p-8 border-b border-slate-100 bg-white flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-primary/8 flex items-center justify-center border border-primary/10 shadow-sm">
                <Package className="size-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{product.name}</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest px-2 py-0 h-5 border-slate-200 text-slate-500">
                    SKU: {product.sku}
                  </Badge>
                  <Badge className={`text-[10px] font-black h-5 ${
                    product.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {product.status === 'PUBLISHED' ? 'ĐANG NIÊM YẾT' : 'NHÁP'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
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
                  <div className="aspect-square rounded-xl overflow-hidden border border-slate-200 relative group">
                    <img src={product.thumbnailUrl || product.imageUrls[0]} alt="Thumbnail" className="w-full h-full object-cover" />
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
                  <div key={index} className="aspect-square rounded-xl overflow-hidden border border-slate-200">
                    <img src={url} alt={`Detail ${index + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
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
        </div>

        {/* Footer Section - Fixed */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-slate-400">
            <Layers className="size-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Hệ thống quản lý niêm yết v2.0</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400">CREATED:</span>
            <span className="text-[10px] font-bold text-slate-600">{formatDate(product.createdAt)}</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
