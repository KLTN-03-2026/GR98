import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Boxes } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SupplyDemandItem } from '../api/types';

interface SupplyDemandTableProps {
  items: SupplyDemandItem[] | undefined;
  isLoading: boolean;
}

export function SupplyDemandTable({ items, isLoading }: SupplyDemandTableProps) {
  return (
    <Card className="rounded-[2rem] border border-slate-200/60 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/30">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[10px] font-manrope font-bold uppercase tracking-tight text-slate-400 flex items-center gap-2">
            <Boxes className="size-4 text-emerald-600" />
            Chi tiết cân đối theo mặt hàng
          </h3>
          <p className="text-[10px] font-medium text-slate-400">Số liệu tồn kho thực tế và nhu cầu đơn hàng</p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50/30">
            <TableRow className="hover:bg-transparent border-b-slate-100">
              <TableHead className="h-12 px-6 text-[10px] uppercase font-bold tracking-tight text-slate-400">Mặt hàng</TableHead>
              <TableHead className="h-12 text-right text-[10px] uppercase font-bold tracking-tight text-slate-400">Sản lượng dự kiến</TableHead>
              <TableHead className="h-12 text-right text-[10px] uppercase font-bold tracking-tight text-slate-400">Tồn kho thực tế</TableHead>
              <TableHead className="h-12 text-right text-[10px] uppercase font-bold tracking-tight text-slate-400">Nhu cầu (Đơn hàng)</TableHead>
              <TableHead className="h-12 text-right text-[10px] uppercase font-bold tracking-tight text-slate-400 pr-6">Cán cân dự phòng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-b-slate-50">
                  <TableCell className="px-6 py-4"><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="text-right py-4"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell className="text-right py-4"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell className="text-right py-4"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell className="text-right pr-6 py-4"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : items && items.length > 0 ? (
              items.map((item) => {
                const balance = item.actualStockKg - item.pendingOrderKg;
                return (
                  <TableRow key={item.cropType} className="group transition-colors hover:bg-emerald-50/20 border-b-slate-50 last:border-0">
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
                          {item.cropType}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-medium mt-0.5">Nông sản</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4 font-medium text-sm text-slate-600 tabular-nums">
                      {item.expectedKg.toLocaleString('vi-VN')} kg
                    </TableCell>
                    <TableCell className="text-right py-4 font-bold text-sm text-slate-900 tabular-nums">
                      {item.actualStockKg.toLocaleString('vi-VN')} kg
                    </TableCell>
                    <TableCell className="text-right py-4 font-medium text-sm text-rose-600 tabular-nums">
                      {item.pendingOrderKg.toLocaleString('vi-VN')} kg
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full px-3 py-0.5 text-[10px] font-bold border-none shadow-xs",
                          balance >= 0
                            ? 'bg-emerald-500/10 text-emerald-700'
                            : 'bg-rose-500/10 text-rose-700'
                        )}
                      >
                        {balance >= 0 ? '+' : ''}
                        {balance.toLocaleString('vi-VN')} kg
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 opacity-40">
                    <Boxes className="size-8" />
                    <span className="text-xs font-medium">Không có dữ liệu chi tiết</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
