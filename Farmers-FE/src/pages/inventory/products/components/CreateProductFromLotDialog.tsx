import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Package, Search, MapPin, RefreshCw, Link2, Fingerprint } from "lucide-react";
import { useCategories } from "@/client/api/categories/use-categories";

import { priceBoardApi } from "../../price-boards/api/price-board-api";

interface CreateProductFromLotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function CreateProductFromLotDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading
}: CreateProductFromLotDialogProps) {
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

    // Tự động điền tên dựa trên tên sản phẩm gốc của lô hàng
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
        imageUrls: [] // Placeholder
      });
    } catch (err: any) {
      // Lấy thông báo lỗi cụ thể từ Backend
      const message = err.response?.data?.message || err.message || "Có lỗi xảy ra khi tạo sản phẩm.";
      setError(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Package className="size-5 text-primary" />
            Niêm yết nông sản mới
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm animate-in fade-in slide-in-from-top-1">
            <div className="size-2 rounded-full bg-red-500 animate-pulse" />
            {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6 py-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Cột 1: Nguồn gốc & Truy xuất (Read-only) */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">1. Lựa chọn nguồn cung</Label>
                <Select value={selectedLotId} onValueChange={handleLotSelect}>
                  <SelectTrigger className="h-12 border-slate-200 bg-white shadow-sm transition-all hover:border-primary/30 focus:ring-primary/20">
                    <SelectValue placeholder="Chọn lô hàng từ kho..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lots.length === 0 && !isLotsLoading && (
                      <div className="p-4 text-center text-sm text-slate-400 italic">Kho hàng đang trống</div>
                    )}
                    {lots.map(lot => (
                      <SelectItem key={lot.id} value={lot.id} className="py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-sm">{lot.product.name}</span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <Badge variant="secondary" className="h-4 text-[9px] px-1 bg-slate-100 text-slate-500 border-none">
                              SKU: {lot.product.sku}
                            </Badge>
                            <span>•</span>
                            <span className="font-medium text-slate-500">{lot.quantityKg}kg sẵn có</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedLot ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-[11px] font-bold uppercase tracking-tight text-slate-500 flex items-center gap-2">
                      <Search className="size-3.5 text-primary" /> Thông tin nguồn gốc
                    </h4>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200/50 text-[10px] font-bold h-5 uppercase tracking-wide">
                      Đã xác thực
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-medium">Loại cây</span>
                      <p className="text-sm font-bold text-slate-700">{selectedLot.contract?.plot?.cropType || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-medium">Phẩm cấp</span>
                      <div className="flex items-center">
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black h-5">
                          HẠNG {selectedLot.qualityGrade}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-medium">Mã thửa đất</span>
                      <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                        <MapPin className="size-3 text-rose-500" />
                        {selectedLot.contract?.plot?.plotCode || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-medium">Vùng canh tác</span>
                      <p className="text-sm font-medium text-slate-600 truncate">
                        {selectedLot.contract?.plot?.zone?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[180px] rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50/30">
                  <Package className="size-8 opacity-20" />
                  <span className="text-xs font-medium">Vui lòng chọn lô hàng để xem nguồn gốc</span>
                </div>
              )}
            </div>

            {/* Cột 2: Thông tin Thương mại (Editable) */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">2. Thông tin niêm yết</Label>
                <div className="space-y-4 rounded-2xl border border-slate-100 p-1">
                  <div className="space-y-1.5 px-3 pt-2">
                    <Label className="text-[11px] font-semibold text-slate-600">Tên thương mại hiển thị</Label>
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ví dụ: Gạo ST25 Đặc Sản Sóc Trăng..." 
                      className="h-11 border-slate-200 focus:border-primary/50 shadow-none text-sm font-medium"
                    />
                    {name && (
                      <div className="flex flex-col gap-1 px-1 py-1.5 animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <Link2 className="size-3 text-primary/60" />
                          <span>Đường dẫn: </span>
                          <span className="font-medium text-slate-600">/products/{toSlug(name)}</span>
                        </div>
                        {selectedLot && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Fingerprint className="size-3 text-orange-400/70" />
                            <span>Mã SKU dự kiến: </span>
                            <span className="font-medium text-slate-600">PROD-{(selectedLot.contract?.plot?.cropType || "SP").toUpperCase().substring(0, 3)}-2026-XXXX</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 px-3 pb-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-semibold text-slate-600">Giá bán niêm yết (VNĐ/kg)</Label>
                      {isSearchingPrice && <RefreshCw className="size-3 animate-spin text-primary" />}
                    </div>
                    <div className="relative">
                      <Input 
                        type="number"
                        value={price} 
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder={isSearchingPrice ? "Đang tìm giá..." : "Nhập giá bán..."} 
                        className="h-11 pl-4 pr-10 border-slate-200 focus:border-primary/50 shadow-none text-base font-bold text-primary"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">VNĐ</span>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      * Giá đề xuất dựa trên bảng giá {selectedLot?.contract?.plot.cropType} Hạng {selectedLot?.qualityGrade}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-slate-600 ml-1">Danh mục hiển thị</Label>
                <Select onValueChange={(v) => setCategoryIds([v])}>
                  <SelectTrigger className="h-11 border-slate-200 shadow-none">
                    <SelectValue placeholder="Chọn nhóm sản phẩm..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-semibold text-slate-600 ml-1">Mô tả sản phẩm (Marketing Content)</Label>
            <Textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chia sẻ câu chuyện về sản phẩm này đến khách hàng của bạn..." 
              className="min-h-[100px] rounded-xl border-slate-200 focus:border-primary/50 shadow-none text-sm leading-relaxed"
            />
          </div>
        </form>

        <DialogFooter className="bg-slate-50/50 p-6 -mx-6 -mb-6 border-t border-slate-100 rounded-b-lg gap-3">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            className="rounded-xl h-12 px-6 text-slate-500 font-semibold hover:bg-slate-100"
          >
            Hủy bỏ
          </Button>
          <Button 
            onClick={handleFormSubmit} 
            disabled={isLoading || !selectedLotId || !name || !price}
            className="rounded-xl h-12 px-10 shadow-xl shadow-primary/20 font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="size-4 animate-spin" />
                Đang xử lý...
              </div>
            ) : "Xác nhận niêm yết thương mại"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
