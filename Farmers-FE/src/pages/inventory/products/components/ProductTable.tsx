import {
  Pencil,
  Trash2,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShoppingBag,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { 
  PRODUCT_STATUS_LABELS,
  type Product 
} from '@/client/types';

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onOpenCreate: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export function ProductTable({
  products,
  isLoading,
  onEdit,
  onDelete,
  onOpenCreate,
}: ProductTableProps) {
  return (
    <div className="min-h-0 flex-1 overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white shadow-sm transition-all hover:shadow-md">
      <div className="h-full overflow-auto custom-scrollbar">
        <Table>
          <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
            <TableRow className="border-b-slate-100 hover:bg-transparent">
              <TableHead className="w-24 text-[10px] font-bold uppercase tracking-tight text-slate-400 pl-6">Ảnh</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-tight text-slate-400">Sản phẩm & SKU</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-tight text-slate-400">Phân loại</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-tight text-slate-400">Giá niêm yết</TableHead>
              <TableHead className="w-28 text-center text-[10px] font-bold uppercase tracking-tight text-slate-400">Tồn kho</TableHead>
              <TableHead className="w-32 text-center text-[10px] font-bold uppercase tracking-tight text-slate-400">Trạng thái</TableHead>
              <TableHead className="w-28 text-right text-[10px] font-bold uppercase tracking-tight text-slate-400 pr-6">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-b-slate-50">
                  <TableCell className="pl-6 py-3"><Skeleton className="h-10 w-14 rounded-xl" /></TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-24 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-12 mx-auto rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 mx-auto rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20 ml-auto rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-80 text-center">
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="mb-4 rounded-full bg-slate-50 p-6 border border-dashed border-slate-200">
                      <ShoppingBag className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Chưa có sản phẩm niêm yết</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto leading-relaxed">
                      Bắt đầu niêm yết nông sản đầu tiên để tiếp cận khách hàng trên hệ thống thương mại điện tử.
                    </p>
                    <Button
                      variant="outline"
                      onClick={onOpenCreate}
                      className="mt-6 rounded-full px-8 h-10 border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-bold"
                    >
                      Niêm yết ngay
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id} className="group transition-all border-b-slate-50 hover:bg-emerald-50/20">
                  <TableCell className="pl-6 py-3">
                    <div className="relative h-10 w-14 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shadow-xs ring-2 ring-transparent group-hover:ring-emerald-500/10 transition-all">
                      {p.imageUrls?.[0] ? (
                        <img src={p.imageUrls[0]} alt={p.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-slate-200 opacity-40" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors text-sm line-clamp-1">{p.name}</p>
                      <p className="text-[10px] font-mono font-bold text-slate-400 tracking-tighter uppercase opacity-60">
                        {p.sku || 'SKU-PENDING'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-700">{p.cropType}</span>
                        <Badge variant="outline" className="text-[9px] h-4 px-1 leading-none rounded-md border-emerald-200 text-emerald-600 font-black">
                          HẠNG {p.grade}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight line-clamp-1 italic opacity-70">
                        {p.categories?.map(c => c.name).join(', ') || 'CHƯA PHÂN LOẠI'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="font-bold text-slate-900 text-sm tabular-nums">
                        {formatCurrency(p.pricePerKg)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-40">/ {p.unit}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant="outline" className="bg-emerald-50 border-emerald-100 h-6 rounded-lg tabular-nums font-bold text-emerald-700 px-2 shadow-xs">
                        {(p.actualStockKg ?? p.stockKg).toLocaleString('vi-VN')} kg
                      </Badge>
                      {p.upcomingStockKg !== undefined && p.upcomingStockKg > 0 && (
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                          + {p.upcomingStockKg.toLocaleString('vi-VN')} sắp về
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      {p.status === 'PUBLISHED' ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-none shadow-none rounded-full px-3 py-0.5 text-[10px] font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3" />
                          CÔNG KHAI
                        </Badge>
                      ) : p.status === 'OUT_OF_STOCK' ? (
                        <Badge variant="outline" className="bg-rose-500/10 text-rose-700 border-none shadow-none rounded-full px-3 py-0.5 text-[10px] font-bold flex items-center gap-1.5">
                          <AlertCircle className="h-3 w-3" />
                          HẾT HÀNG
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-100 text-slate-400 border-none shadow-none rounded-full px-3 py-0.5 text-[10px] font-bold flex items-center gap-1.5">
                          <Pencil className="h-3 w-3" />
                          {PRODUCT_STATUS_LABELS[p.status].toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full hover:bg-white hover:text-emerald-600 hover:shadow-xl hover:shadow-emerald-500/10 transition-all"
                        onClick={() => onEdit(p)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-all"
                        onClick={() => onDelete(p.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full hover:bg-slate-50 hover:text-blue-600 transition-all shadow-xs"
                        asChild
                      >
                        <a href={`/products/${p.slug}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
