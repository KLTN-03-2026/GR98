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
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { contractApi } from "@/pages/admin/contracts/api/contract-api";
import { extractData } from "@/client/lib/api-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, MapPin, RefreshCw, Link2, Info, Plus } from "lucide-react";
import { useCategories } from "@/client/api/categories/use-categories";
import { priceBoardApi } from "../../price-boards/api/price-board-api";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PaginatedContractsResponse } from "@/pages/admin/contracts/api/types";

interface CreateProductFromContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function CreateProductFromContractDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading
}: CreateProductFromContractDialogProps) {
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [imageUrls, setImageUrls] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [isSearchingPrice, setIsSearchingPrice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // States for search and pagination
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // 1. Lấy danh sách hợp đồng đã tất toán (SETTLED)
  const { data: contractsResponse, isLoading: isContractsLoading } = useQuery({
    queryKey: ['contracts', 'settled', search, page],
    queryFn: async () => {
      const response = await contractApi.list({ 
        status: 'SETTLED' as any, 
        limit, 
        page,
        search: search || undefined
      });
      return extractData<PaginatedContractsResponse>(response);
    },
    enabled: open,
    placeholderData: keepPreviousData
  });

  const contracts = contractsResponse?.data || [];
  const pagination = contractsResponse;

  // 2. Lấy danh mục sản phẩm
  const { data: catData } = useCategories();
  const categories = catData?.data || [];
  const selectedContract = contracts.find((c: any) => c.id === selectedContractId);

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

  // 3. Effect: Tự động điền thông tin và tra cứu giá từ PriceBoard
  React.useEffect(() => {
    if (!selectedContract) return;

    // Gợi ý tên dựa trên loại cây và phẩm cấp
    setName(`${selectedContract.cropType} - Loại ${selectedContract.grade}`);
    setError(null);

    const fetchPrice = async () => {
      setIsSearchingPrice(true);
      try {
        const pbResponse = await priceBoardApi.list({
          cropType: selectedContract.cropType,
          grade: selectedContract.grade,
          isActive: 'true'
        });
        const pbData = extractData<any>(pbResponse);
        if (pbData.data && pbData.data.length > 0) {
          setPrice(pbData.data[0].sellPrice.toString());
        } else {
          setPrice("");
          setError(`Cảnh báo: Không tìm thấy giá niêm yết cho ${selectedContract.cropType} hạng ${selectedContract.grade}. Vui lòng cập nhật Bảng giá.`);
        }
      } catch (err) {
        console.error("Lỗi khi tìm giá bán lẻ:", err);
      } finally {
        setIsSearchingPrice(false);
      }
    };

    fetchPrice();
  }, [selectedContractId, contracts]);

  const handleContractSelect = (id: string) => {
    setSelectedContractId(id);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractId || !name || !price) return;
    setError(null);

    try {
      await onSubmit({
        contractId: selectedContractId,
        name,
        description,
        categoryIds,
        thumbnailUrl: thumbnailUrl || undefined,
        imageUrls: imageUrls ? imageUrls.split(',').map(s => s.trim()).filter(Boolean) : []
      });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Có lỗi xảy ra khi tạo sản phẩm.";
      setError(message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[540px] p-0 flex flex-col h-full font-manrope">
        {/* Header - Fixed */}
        <div className="p-6 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-amber-100/50 flex items-center justify-center shadow-sm border border-amber-200/50">
              <FileText className="size-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Niêm yết từ Hợp đồng</h2>
              <p className="text-[11px] text-slate-500 font-medium">Khởi tạo sản phẩm từ hợp đồng đã tất toán</p>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-8">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm">
                <Info className="size-4" />
                {error}
              </div>
            )}

            <form id="create-product-contract-form" onSubmit={handleFormSubmit} className="space-y-8">
              {/* Phần 1: Hợp đồng tất toán */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">1</div>
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Thông tin Hợp đồng</Label>
                </div>
                
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-semibold text-slate-700 ml-1">Tìm kiếm & Chọn hợp đồng đã thanh toán</Label>
                    <div className="relative">
                      <Input 
                        placeholder="Tìm theo mã HĐ, tên nông dân, loại cây..." 
                        value={search}
                        onChange={handleSearchChange}
                        className="h-10 rounded-xl border-slate-200 bg-white pl-9 text-sm focus:ring-amber-500/20"
                      />
                      <RefreshCw className={`absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 ${isContractsLoading ? 'animate-spin' : ''}`} />
                    </div>
                  </div>

                  <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <ScrollArea className="h-[180px]">
                      <div className="p-1">
                        {contracts.length === 0 && !isContractsLoading && (
                          <div className="py-10 text-center text-sm text-slate-400 italic">
                            Không tìm thấy hợp đồng nào
                          </div>
                        )}
                        <div className="grid grid-cols-1 gap-1">
                          {contracts.map((c: any) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleContractSelect(c.id)}
                              className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${
                                selectedContractId === c.id 
                                  ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-200' 
                                  : 'hover:bg-slate-50 border-transparent border'
                              }`}
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className={`font-bold text-sm ${selectedContractId === c.id ? 'text-amber-900' : 'text-slate-700'}`}>
                                  {c.contractNo}
                                </span>
                                <div className="flex items-center gap-2 text-[10px]">
                                  <span className="font-bold text-amber-600 uppercase">{c.cropType}</span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-slate-500 font-medium">{c.farmer?.fullName}</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </ScrollArea>
                    
                    {pagination && pagination.totalPages > 1 && (
                      <div className="p-2 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase ml-2">
                          Trang {page} / {pagination.totalPages}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                            className="h-7 px-2 text-[10px] font-bold"
                          >
                            Trước
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={page >= pagination.totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="h-7 px-2 text-[10px] font-bold"
                          >
                            Sau
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedContract ? (
                  <div className="rounded-2xl border border-slate-100 bg-amber-50/30 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Nông dân</span>
                        <p className="text-sm font-bold text-slate-700">{selectedContract.farmer?.fullName || "N/A"}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Chất lượng</span>
                        <div>
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] font-black h-5">
                            HẠNG {selectedContract.grade}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Thửa đất</span>
                        <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                          <MapPin className="size-3 text-rose-500" />
                          {selectedContract.plot?.plotCode || "N/A"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Trạng thái</span>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px]">
                          SETTLED
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-28 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50/30">
                    <FileText className="size-8 opacity-20" />
                    <span className="text-xs font-medium italic">Vui lòng chọn hợp đồng để bắt đầu</span>
                  </div>
                )}
              </div>

              {/* Phần 2: Thương mại */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">2</div>
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Niêm yết Thương mại</Label>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 ml-1">Tên sản phẩm niêm yết</Label>
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ví dụ: Gạo ST25 - Sóc Trăng..." 
                      className="h-11 rounded-xl border-slate-200 focus:border-amber-500/50 text-sm font-medium"
                    />
                    {name && (
                      <div className="flex items-center gap-1.5 px-1 py-1 text-[10px] text-slate-400">
                        <Link2 className="size-3 text-amber-600/60" />
                        <span>Slug: </span>
                        <span className="font-medium text-amber-600">/products/{toSlug(name)}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-slate-700 ml-1">Giá bán lẻ (Tự động)</Label>
                        {isSearchingPrice && <RefreshCw className="size-3 animate-spin text-amber-600" />}
                      </div>
                      <div className="relative">
                        <Input 
                          readOnly
                          value={price} 
                          className="h-11 pl-4 pr-10 rounded-xl border-slate-200 bg-slate-50 text-sm font-bold text-amber-600 cursor-not-allowed"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">đ/kg</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 ml-1">Tồn kho ban đầu</Label>
                      <Input 
                        readOnly
                        value="0" 
                        className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-bold text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 ml-1">Danh mục nông sản</Label>
                    <Select onValueChange={(v) => setCategoryIds([v])}>
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 text-sm">
                        <SelectValue placeholder="Chọn danh mục..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100">
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id} className="rounded-lg">{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 ml-1 text-amber-700 uppercase tracking-wider text-[10px]">Hình ảnh sản phẩm (URL)</Label>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-slate-400 font-medium ml-1">Ảnh đại diện (Thumbnail)</Label>
                          <Input 
                            value={thumbnailUrl}
                            onChange={(e) => setThumbnailUrl(e.target.value)}
                            placeholder="https://example.com/thumbnail.jpg"
                            className="h-10 rounded-xl border-slate-200 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-slate-400 font-medium ml-1">Danh sách ảnh chi tiết (Phân cách bằng dấu phẩy)</Label>
                          <Textarea 
                            value={imageUrls}
                            onChange={(e) => setImageUrls(e.target.value)}
                            placeholder="url1.jpg, url2.jpg, url3.jpg"
                            className="min-h-[80px] rounded-xl border-slate-200 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">3</div>
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Mô tả giới thiệu</Label>
                </div>
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả về đặc điểm, hương vị và nguồn gốc sản phẩm..." 
                  className="min-h-[120px] rounded-xl border-slate-200 focus:border-amber-500/50 text-sm leading-relaxed"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-row gap-3 flex-shrink-0">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            className="rounded-xl h-12 px-6 font-bold text-slate-500 hover:bg-slate-100"
          >
            Hủy
          </Button>
          <Button 
            type="submit"
            form="create-product-contract-form"
            disabled={isLoading || !selectedContractId || !name || !price}
            className="rounded-xl h-12 flex-1 bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/30 font-black uppercase tracking-wider disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="size-4 animate-spin" />
                Đang xử lý...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus className="size-4" />
                Xác nhận Niêm yết
              </div>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
