import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { lotApi } from "../../lots/api/api";
import { extractData } from "@/client/lib/api-client";
import type { InventoryLot } from "../../lots/api/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Package, Search, MapPin, RefreshCw, Link2, Fingerprint, X } from "lucide-react";
import { useCategories } from "@/client/api/categories/use-categories";
import { priceBoardApi } from "../../price-boards/api/price-board-api";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CreateProductFromLotDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function CreateProductFromLotDrawer({
  open,
  onOpenChange,
  onSubmit,
  isLoading
}: CreateProductFromLotDrawerProps) {
  const [selectedLotId, setSelectedLotId] = useState<string>("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [isSearchingPrice, setIsSearchingPrice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Lấy danh sách lô hàng trong kho (chỉ lấy hàng đã nhập kho - RECEIVED)
  const { data: lots = [], isLoading: isLotsLoading } = useQuery({
    queryKey: ['inventory-lots', 'received'],
    queryFn: async () => {
      const response = await lotApi.getLots({});
      return extractData<InventoryLot[]>(response).filter(l => l.status === 'RECEIVED');
    },
    enabled: open
  });

  // 2. Lấy danh mục sản phẩm
  const { data: catData } = useCategories();
  const categories = catData?.data || [];
  const selectedLot = lots.find(l => l.id === selectedLotId);

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

  // 3. Effect: Tự động điền thông tin và tìm giá khi chọn lô hàng
  React.useEffect(() => {
    if (!selectedLot) return;

    setName(selectedLot.product.name);
    setError(null);

    const fetchPrice = async () => {
      const cropType = selectedLot.contract?.plot?.cropType;
      if (!cropType) return;

      setIsSearchingPrice(true);
      try {
        const pbResponse = await priceBoardApi.list({
          cropType,
          grade: selectedLot.qualityGrade,
          isActive: 'true'
        });
        const pbData = extractData<any>(pbResponse);
        if (pbData.data && pbData.data.length > 0) {
          setPrice(pbData.data[0].sellPrice.toString());
        } else {
          setPrice("");
        }
      } catch (err) {
        console.error("Lỗi khi tìm giá bán lẻ:", err);
      } finally {
        setIsSearchingPrice(false);
      }
    };

    fetchPrice();
  }, [selectedLotId, lots]);

  const handleLotSelect = (id: string) => {
    setSelectedLotId(id);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLotId || !name || !price) return;
    setError(null);

    try {
      await onSubmit({
        inventoryLotId: selectedLotId,
        name,
        pricePerKg: Number(price),
        description,
        categoryIds,
        imageUrls: [] 
      });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Có lỗi xảy ra khi tạo sản phẩm.";
      setError(message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[540px] p-0 flex flex-col font-manrope">
        <SheetHeader className="p-6 border-b border-slate-100 flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/8 flex items-center justify-center">
              <Package className="size-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold">Niêm yết nông sản mới</SheetTitle>
              <p className="text-xs text-muted-foreground font-medium">Khởi tạo thông tin thương mại từ lô hàng thực tế</p>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6">
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm animate-in fade-in slide-in-from-top-1">
                <div className="size-2 rounded-full bg-red-500 animate-pulse" />
                {error}
              </div>
            )}

            <form id="create-product-form" onSubmit={handleFormSubmit} className="space-y-8">
              {/* Phần 1: Nguồn gốc */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">1</div>
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nguồn gốc & Truy xuất</Label>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700 ml-1">Lựa chọn lô hàng từ kho</Label>
                  <Select value={selectedLotId} onValueChange={handleLotSelect}>
                    <SelectTrigger className="h-12 border-slate-200 rounded-xl bg-white shadow-sm transition-all focus:ring-primary/20">
                      <SelectValue placeholder="Chọn lô hàng RECEIVED..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100">
                      {lots.length === 0 && !isLotsLoading && (
                        <div className="p-4 text-center text-sm text-slate-400 italic">Kho hàng đang trống</div>
                      )}
                      {lots.map(lot => (
                        <SelectItem key={lot.id} value={lot.id} className="py-3 rounded-lg">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-sm">{lot.product.name}</span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span className="font-bold text-primary">SKU: {lot.product.sku}</span>
                              <span>•</span>
                              <span className="font-medium">{lot.quantityKg}kg sẵn có</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedLot ? (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Loại cây</span>
                        <p className="text-sm font-bold text-slate-700">{selectedLot.contract?.plot?.cropType || "N/A"}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Phẩm cấp</span>
                        <div>
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black h-5">
                            HẠNG {selectedLot.qualityGrade}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Mã thửa đất</span>
                        <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                          <MapPin className="size-3 text-rose-500" />
                          {selectedLot.contract?.plot?.plotCode || "N/A"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Vùng canh tác</span>
                        <p className="text-sm font-medium text-slate-600 truncate">
                          {selectedLot.contract?.plot?.zone?.name || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50/30">
                    <Package className="size-8 opacity-20" />
                    <span className="text-xs font-medium italic">Vui lòng chọn lô hàng để xác thực nguồn gốc</span>
                  </div>
                )}
              </div>

              {/* Phần 2: Thương mại */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">2</div>
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Thông tin Thương mại</Label>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 ml-1">Tên sản phẩm hiển thị</Label>
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ví dụ: Gạo ST25 Đặc Sản Sóc Trăng..." 
                      className="h-11 rounded-xl border-slate-200 focus:border-primary/50 text-sm font-medium"
                    />
                    {name && (
                      <div className="flex items-center gap-1.5 px-1 py-1 text-[10px] text-slate-400 animate-in fade-in">
                        <Link2 className="size-3 text-primary/60" />
                        <span>Slug: </span>
                        <span className="font-medium text-primary">/products/{toSlug(name)}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-slate-700 ml-1">Giá niêm yết</Label>
                        {isSearchingPrice && <RefreshCw className="size-3 animate-spin text-primary" />}
                      </div>
                      <div className="relative">
                        <Input 
                          type="number"
                          value={price} 
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="0" 
                          className="h-11 pl-4 pr-10 rounded-xl border-slate-200 focus:border-primary/50 text-sm font-bold text-primary"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">đ/kg</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 ml-1">Danh mục</Label>
                      <Select onValueChange={(v) => setCategoryIds([v])}>
                        <SelectTrigger className="h-11 rounded-xl border-slate-200 text-xs">
                          <SelectValue placeholder="Chọn nhóm..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100">
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id} className="rounded-lg">{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">3</div>
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nội dung tiếp thị</Label>
                </div>
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Chia sẻ câu chuyện hoặc đặc điểm nổi bật của sản phẩm..." 
                  className="min-h-[120px] rounded-xl border-slate-200 focus:border-primary/50 text-sm leading-relaxed"
                />
              </div>
            </form>
          </div>
        </ScrollArea>

        <SheetFooter className="p-6 border-t border-slate-100 bg-slate-50/50 gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="rounded-xl h-11 flex-1 border-slate-200 font-semibold"
          >
            Hủy bỏ
          </Button>
          <Button 
            type="submit"
            form="create-product-form"
            disabled={isLoading || !selectedLotId || !name || !price}
            className="rounded-xl h-11 flex-[2] shadow-lg shadow-primary/20 font-bold"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="size-4 animate-spin" />
                Đang lưu...
              </div>
            ) : "Xác nhận niêm yết"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
