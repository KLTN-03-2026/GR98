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
import FileUpload from '@/components/custom/file-upload';
import { uploadImage, uploadImages } from '@/client/api/upload';
import { toast } from 'sonner';
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
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [albumImageUrls, setAlbumImageUrls] = useState<string[]>([]);
  const [isUploadingAlbum, setIsUploadingAlbum] = useState(false);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [isSearchingPrice, setIsSearchingPrice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isUploading = isUploadingThumbnail || isUploadingAlbum;
  
  // States for search and pagination
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // 1. Lấy danh sách hợp đồng đang hiệu lực (ACTIVE)
  const { data: contractsResponse, isLoading: isContractsLoading } = useQuery({
    queryKey: ['contracts', 'active-for-listing', search, page],
    queryFn: async () => {
      const response = await contractApi.list({ 
        status: 'ACTIVE' as any, 
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
        imageUrls: albumImageUrls
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
        <SheetHeader className="relative overflow-hidden border-b px-6 py-8 sm:px-8 bg-linear-to-b from-primary/[0.07] via-background to-background dark:from-primary/20 flex-shrink-0">
          <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/25">
              <FileText className="size-6" />
            </div>
            <div className="space-y-1">
              <SheetTitle className="text-2xl font-black text-slate-900 tracking-tight">
                Niêm yết mới
              </SheetTitle>
              <p className="text-xs font-bold text-primary/80 uppercase tracking-widest">
                Từ hợp đồng đang hiệu lực
              </p>
            </div>
          </div>
        </SheetHeader>

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
              {/* Phần 1: Hợp đồng đang hiệu lực */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">1</div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Thông tin Hợp đồng</Label>
                </div>
                
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-semibold text-slate-700 ml-1">Tìm kiếm & Chọn hợp đồng đang hiệu lực</Label>
                    <div className="relative">
                      <Input 
                        placeholder="Tìm theo mã HĐ, tên nông dân, loại cây..." 
                        value={search}
                        onChange={handleSearchChange}
                        className="h-10 rounded-xl border-slate-200 bg-white pl-9 text-sm focus:ring-primary/20"
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
                              className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center justify-between group border ${
                                selectedContractId === c.id 
                                  ? 'bg-primary/[0.04] border-primary/20 ring-1 ring-primary/10' 
                                  : 'hover:bg-primary/[0.02] border-transparent'
                              }`}
                            >
                              <div className="flex flex-col gap-1">
                                <span className={`font-black text-sm tracking-tight ${selectedContractId === c.id ? 'text-primary' : 'text-slate-700'}`}>
                                  {c.contractNo}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-black bg-primary/10 text-primary border-none uppercase">
                                    {c.cropType}
                                  </Badge>
                                  <span className="text-slate-300 font-bold">•</span>
                                  <span className="text-[11px] text-slate-500 font-bold">{c.farmer?.fullName}</span>
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
                  <div className="rounded-2xl border border-primary/20 bg-card p-5 space-y-4 animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden">
                    <div className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-primary/5 blur-2xl" />
                    <div className="relative grid grid-cols-2 gap-y-5 gap-x-6">
                      <div className="space-y-1.5">
                        <span className="text-[9px] text-primary/60 font-black uppercase tracking-widest">Nông dân</span>
                        <p className="text-sm font-black text-slate-900">{selectedContract.farmer?.fullName || "N/A"}</p>
                      </div>
                      <div className="space-y-1.5 text-right">
                        <span className="text-[9px] text-primary/60 font-black uppercase tracking-widest">Phẩm cấp</span>
                        <div>
                          <Badge className="bg-primary text-white border-none text-[10px] font-black h-5 px-2 shadow-sm shadow-primary/20">
                            HẠNG {selectedContract.grade}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[9px] text-primary/60 font-black uppercase tracking-widest">Vùng trồng</span>
                        <p className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-rose-500" />
                          {selectedContract.plot?.plotCode || "N/A"}
                        </p>
                      </div>
                      <div className="space-y-1.5 text-right">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Trạng thái HĐ</span>
                        <div>
                           <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-black h-5 uppercase">
                             Đang hiệu lực
                           </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-28 rounded-[2.5rem] border border-dashed border-primary/20 flex flex-col items-center justify-center text-primary/40 gap-3 bg-primary/[0.02]">
                    <FileText className="size-10 opacity-20" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Vui lòng chọn hợp đồng để bắt đầu</span>
                  </div>
                )}
              </div>

              {/* Phần 2: Thương mại */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">2</div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Niêm yết Thương mại</Label>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 ml-1">Tên sản phẩm niêm yết</Label>
                      <Input 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ví dụ: Gạo ST25 - Sóc Trăng..." 
                        className="h-11 rounded-xl border-slate-200 focus:border-primary/50 text-sm font-medium"
                      />
                    {name && (
                      <div className="flex items-center gap-1.5 px-1 py-1 text-[10px] text-slate-400">
                        <Link2 className="size-3 text-primary/60" />
                        <span>Slug: </span>
                        <span className="font-medium text-primary">/products/{toSlug(name)}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-slate-700 ml-1">Giá bán lẻ (Tự động)</Label>
                        {isSearchingPrice && <RefreshCw className="size-3 animate-spin text-primary" />}
                      </div>
                      <div className="relative">
                        <Input 
                          readOnly
                          value={price} 
                          className="h-11 pl-4 pr-10 rounded-xl border-slate-200 bg-slate-50 text-sm font-bold text-primary cursor-not-allowed"
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
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Hình ảnh sản phẩm</Label>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-slate-400 font-medium ml-1">Ảnh đại diện (Thumbnail)</Label>
                          <FileUpload
                            acceptedFileTypes={['image/*']}
                            onFileSelect={async (file) => {
                              setIsUploadingThumbnail(true);
                              try {
                                const uploaded = await uploadImage(file, 'products');
                                setThumbnailUrl(uploaded.url);
                                toast.success('Đã tải ảnh đại diện');
                              } catch {
                                toast.error('Lỗi tải ảnh đại diện');
                              } finally {
                                setIsUploadingThumbnail(false);
                              }
                            }}
                          />
                          {isUploadingThumbnail && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              Đang tải ảnh đại diện...
                            </div>
                          )}
                          {thumbnailUrl && (
                            <img src={thumbnailUrl} alt="thumbnail" className="mt-2 h-20 w-20 rounded-xl object-cover border" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-slate-400 font-medium ml-1">Danh sách ảnh chi tiết</Label>
                          <FileUpload
                            multiple
                            acceptedFileTypes={['image/*']}
                            onFilesSelect={async (files) => {
                              setIsUploadingAlbum(true);
                              try {
                                const uploaded = await uploadImages(files, 'products');
                                const newUrls = uploaded.map((u) => u.url);
                                setAlbumImageUrls((prev) => [...prev, ...newUrls]);
                                toast.success(`Đã tải ${newUrls.length} ảnh`);
                              } catch {
                                toast.error('Lỗi tải ảnh');
                              } finally {
                                setIsUploadingAlbum(false);
                              }
                            }}
                          />
                          {isUploadingAlbum && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              Đang tải ảnh chi tiết...
                            </div>
                          )}
                          {albumImageUrls.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {albumImageUrls.map((url, i) => (
                                <div key={i} className="relative">
                                  <img src={url} alt={`album-${i}`} className="h-16 w-16 rounded-xl object-cover border" />
                                </div>
                              ))}
                            </div>
                          )}
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
                  className="min-h-[120px] rounded-xl border-slate-200 focus:border-primary/50 text-sm leading-relaxed"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-row gap-3 flex-shrink-0 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            className="rounded-2xl h-12 px-6 font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
          >
            Hủy
          </Button>
          <Button 
            type="submit"
            form="create-product-contract-form"
            disabled={isLoading || isUploading || !selectedContractId || !name || !price}
            className="rounded-2xl h-12 flex-1 bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-200 font-black uppercase tracking-wider disabled:opacity-50 transition-all active:scale-[0.98]"
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
