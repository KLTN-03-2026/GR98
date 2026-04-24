import { useState } from 'react';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  TrendingDown,
  ChevronRight,
  RefreshCcw,
  Search,
  FileText,
  Boxes,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSupplyDemand } from './api/hooks';
import { SupplyDemandChart } from './components/SupplyDemandChart';
import type { SupplyDemandItem } from './api/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function InventorySupplyDemandPage() {
  const [filters, setFilters] = useState({
    cropType: '',
    fromDate: '',
    toDate: '',
  });

  const { data, isLoading, refetch, isRefetching } = useSupplyDemand(filters);

  const totalExpected =
    data?.items.reduce((acc: number, item: SupplyDemandItem) => acc + item.expectedKg, 0) ?? 0;
  const totalStock =
    data?.items.reduce((acc: number, item: SupplyDemandItem) => acc + item.actualStockKg, 0) ?? 0;
  const totalPending =
    data?.items.reduce((acc: number, item: SupplyDemandItem) => acc + item.pendingOrderKg, 0) ?? 0;

  const gap = totalStock - totalPending;

  return (
    <div className="h-full min-h-0 flex flex-col gap-5 p-4 sm:p-6 font-manrope">
      {/* Header Card - Admin Style */}
      <Card className="border-dashed border-emerald-400/50 bg-white">
        <CardContent className="p-4 sm:p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <TrendingUp className="size-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Quản lý Cung - Cầu
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Phân tích cán cân sản lượng, tồn kho và nhu cầu thị trường
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group min-w-[200px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-600 transition-colors" />
              <Input
                placeholder="Loại cây trồng..."
                className="h-9 rounded-full border-slate-200 pl-9 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
                value={filters.cropType}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, cropType: e.target.value }))
                }
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-full border-slate-200"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCcw className={cn("size-3.5", isRefetching && "animate-spin")} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards - Admin Pattern */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Sản lượng Dự kiến"
          value={totalExpected}
          unit="kg"
          icon={FileText}
          description="Từ hợp đồng & báo cáo"
          accent="primary"
          isLoading={isLoading}
        />
        <SummaryCard
          title="Tồn kho Thực tế"
          value={totalStock}
          unit="kg"
          icon={Package}
          description="Hiện có trong kho"
          accent="emerald"
          isLoading={isLoading}
        />
        <SummaryCard
          title="Nhu cầu Đơn hàng"
          value={totalPending}
          unit="kg"
          icon={ShoppingCart}
          description="Đơn chưa xuất kho"
          accent="rose"
          isLoading={isLoading}
        />
        <SummaryCard
          title="Cán cân Dự phòng"
          value={gap}
          unit="kg"
          icon={gap >= 0 ? TrendingUp : TrendingDown}
          description={gap >= 0 ? 'Dư cung (Sẵn sàng)' : 'Thiếu hụt (Cần nhập)'}
          accent={gap >= 0 ? 'emerald' : 'rose'}
          isLoading={isLoading}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3 pb-4">
          {/* Chart Container */}
          <Card className="xl:col-span-2 rounded-2xl border-slate-200 shadow-xs overflow-hidden">
            <CardContent className="p-6">
              {isLoading ? (
                <Skeleton className="h-[400px] w-full rounded-xl" />
              ) : (
                <SupplyDemandChart data={data?.items ?? []} />
              )}
            </CardContent>
          </Card>

          {/* Detailed Table Container */}
          <Card className="xl:col-span-1 rounded-2xl border-slate-200 shadow-xs flex flex-col h-fit">
            <div className="flex items-center gap-2 p-4 border-b border-slate-100">
              <Boxes className="size-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">Chi tiết mặt hàng</h3>
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-b-slate-100">
                    <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 pl-4">Mặt hàng</TableHead>
                    <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider text-slate-500">Tồn kho</TableHead>
                    <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider text-slate-500 pr-4">Cân đối</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="pl-4"><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell className="pr-4"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : data?.items && data.items.length > 0 ? (
                    data.items.map((item: SupplyDemandItem) => {
                      const balance = item.actualStockKg - item.pendingOrderKg;
                      return (
                        <TableRow key={item.cropType} className="group/row transition-colors hover:bg-emerald-50/30 border-b-slate-50 last:border-0">
                          <TableCell className="font-bold text-sm text-slate-900 pl-4">
                            {item.cropType}
                          </TableCell>
                          <TableCell className="text-right text-sm font-bold text-slate-600 tabular-nums">
                            {item.actualStockKg.toLocaleString('vi-VN')} kg
                          </TableCell>
                          <TableCell className="text-right pr-4">
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-full px-2 py-0 text-[10px] font-bold border-none shadow-none",
                                balance >= 0
                                  ? 'bg-emerald-500/10 text-emerald-700'
                                  : 'bg-rose-500/10 text-rose-700'
                              )}
                            >
                              {balance >= 0 ? '+' : ''}
                              {balance.toLocaleString('vi-VN')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-32 text-center text-slate-400 text-xs italic">
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  unit,
  icon: Icon,
  description,
  accent,
  isLoading,
}: {
  title: string;
  value: number;
  unit: string;
  icon: any;
  description: string;
  accent: 'primary' | 'emerald' | 'rose';
  isLoading: boolean;
}) {
  const accentClasses = {
    primary: 'border-l-blue-500 bg-linear-to-br from-white to-blue-50/30',
    emerald: 'border-l-emerald-500 bg-linear-to-br from-white to-emerald-50/30',
    rose: 'border-l-rose-500 bg-linear-to-br from-white to-rose-50/30',
  };

  const iconClasses = {
    primary: 'bg-blue-500/10 text-blue-600',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    rose: 'bg-rose-500/10 text-rose-600',
  };

  return (
    <Card className={cn("overflow-hidden rounded-2xl border-slate-200 border-l-4 shadow-xs transition-all hover:shadow-md", accentClasses[accent])}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {title}
            </p>
            {isLoading ? (
              <Skeleton className="mt-2 h-7 w-24" />
            ) : (
              <h3 className="mt-1 font-bold text-2xl text-slate-900 tracking-tight tabular-nums">
                {value.toLocaleString('vi-VN')}
                <span className="ml-1 text-xs font-bold text-slate-400 uppercase">
                  {unit}
                </span>
              </h3>
            )}
          </div>
          <div className={cn("flex size-10 items-center justify-center rounded-xl shrink-0", iconClasses[accent])}>
            <Icon className="size-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{description}</p>
          <ChevronRight className="size-3 text-slate-300" />
        </div>
      </CardContent>
    </Card>
  );
}
