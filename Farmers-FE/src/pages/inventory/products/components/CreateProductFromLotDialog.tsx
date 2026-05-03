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
import { Package, Search, MapPin, RefreshCw } from "lucide-react";
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

  const handleLotSelect = async (id: string) => {
    setSelectedLotId(id);
    const lot = lots.find(l => l.id === id);
    if (lot) {
      // Tự động điền tên dựa trên loại cây của lô hàng
      setName(lot.product.name);
      
      // Tự động tìm giá bán lẻ từ bảng giá
      setIsSearchingPrice(true);
      try {
        const pbResponse = await priceBoardApi.list({
          cropType: lot.product.name, // Thường là cropType tương ứng với tên sản phẩm gốc
          grade: lot.qualityGrade,
          isActive: 'true'
        });
        const pbData = extractData<any>(pbResponse);
        if (pbData.data && pbData.data.length > 0) {
          // Lấy giá bán lẻ (sellPrice) từ bảng giá hợp lệ đầu tiên
          setPrice(pbData.data[0].sellPrice.toString());
        }
      } catch (error) {
        console.error("Lỗi khi tìm giá bán lẻ:", error);
      } finally {
        setIsSearchingPrice(false);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLotId || !name || !price) return;

    onSubmit({
      inventoryLotId: selectedLotId,
      name,
      pricePerKg: Number(price),
      description,
      categoryIds,
      imageUrls: [] // Placeholder
    });
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

        <form onSubmit={handleFormSubmit} className="space-y-6 py-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Cột 1: Chọn lô hàng */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Chọn lô hàng trong kho</Label>
                <Select value={selectedLotId} onValueChange={handleLotSelect}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Chọn một lô hàng..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lots.length === 0 && !isLotsLoading && (
                      <div className="p-4 text-center text-sm text-slate-400 italic">Không có lô hàng sẵn sàng</div>
                    )}
                    {lots.map(lot => (
                      <SelectItem key={lot.id} value={lot.id}>
                        <div className="flex flex-col text-left py-1">
                          <span className="font-bold text-sm">{lot.product.name}</span>
                          <span className="text-[10px] text-slate-400">SKU: {lot.product.sku} | {lot.quantityKg}kg</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedLot && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <h4 className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                    <Search className="size-3" /> Thông tin lô hàng gốc
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Loại cây:</span>
                      <span className="font-bold">{selectedLot.product.name}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Phẩm cấp:</span>
                      <Badge variant="outline" className="h-4 text-[9px] font-bold border-emerald-200 text-emerald-600">
                        HẠNG {selectedLot.qualityGrade}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Nguồn gốc:</span>
                      <span className="font-bold flex items-center gap-1">
                        <MapPin className="size-3 text-rose-500" />
                        {selectedLot.contract?.plot.plotCode || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cột 2: Thông tin niêm yết */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Tên sản phẩm gốc (Chỉ xem)</Label>
                <Input 
                  value={selectedLot?.product.name || ""} 
                  disabled
                  className="h-11 bg-slate-50 border-slate-200 text-slate-500 font-medium cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Phẩm cấp (Chỉ xem)</Label>
                <div className="h-11 flex items-center px-3 rounded-md border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-bold">
                  HẠNG {selectedLot?.qualityGrade || "N/A"}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Tên thương mại niêm yết</Label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Sầu riêng Ri6 Hạng A đặc biệt..." 
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase text-slate-500">Giá bán lẻ (VNĐ/kg)</Label>
                  {isSearchingPrice && <RefreshCw className="size-3 animate-spin text-primary" />}
                  {!isSearchingPrice && price && (
                    <Badge variant="outline" className="h-4 text-[9px] bg-blue-50 text-blue-600 border-blue-100">
                      Giá gợi ý hệ thống
                    </Badge>
                  )}
                </div>
                <Input 
                  type="number"
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)}
                  disabled
                  placeholder={isSearchingPrice ? "Đang tìm giá gợi ý..." : (price ? "" : "Chưa có bảng giá niêm yết")} 
                  className="h-11 font-bold text-blue-600 bg-slate-50 border-slate-200 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Danh mục</Label>
              <Select onValueChange={(v) => setCategoryIds([v])}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Chọn danh mục..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Lô đất nguồn gốc (Chỉ xem)</Label>
              <Input 
                value={selectedLot?.contract?.plot.plotCode || "N/A"} 
                disabled
                className="h-11 bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Mô tả sản phẩm</Label>
            <Textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả sản phẩm cho khách hàng..." 
              className="min-h-[80px] resize-none"
            />
          </div>
        </form>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">Hủy bỏ</Button>
          <Button 
            onClick={handleFormSubmit} 
            disabled={isLoading || !selectedLotId || !name || !price}
            className="rounded-xl px-8 shadow-lg shadow-primary/20"
          >
            {isLoading ? "Đang xử lý..." : "Xác nhận niêm yết"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
