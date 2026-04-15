import { useState } from 'react';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  TrendingDown,
  ChevronRight,
  Filter,
  RefreshCcw,
  Search,
  FileText,
  Boxes,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="flex h-full flex-col gap-6 overflow-y-auto overflow-x-hidden p-6">
      {/* Header & Filters */}
      <section className="relative shrink-0 overflow-hidden rounded-[22px] border border-primary/10 bg-[linear-gradient(180deg,rgba(247,251,252,0.92),rgba(244,248,250,0.82))] p-1 shadow-[0_10px_24px_-24px_rgba(16,24,40,0.22)] backdrop-blur-md dark:bg-[linear-gradient(180deg,rgba(13,20,30,0.94),rgba(10,18,26,0.86))]">
        <div className="relative h-fit shrink-0 rounded-[20px] border border-primary/10 bg-background/72 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl border border-primary/15 bg-primary/8 shadow-sm">
                <TrendingUp className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="font-manrope text-xl font-bold tracking-tight">
                  Quản lý Cung - Cầu
                </h1>
                <p className="text-[11px] text-muted-foreground">
                  Phân tích cân bằng giữa sản lượng dự kiến, tồn kho và nhu cầu
                  thị trường
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Loại cây trồng..."
                  className="h-9 w-40 rounded-full pl-8 text-xs bg-background/50 border-border/40 focus:bg-background transition-all"
                  value={filters.cropType}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, cropType: e.target.value }))
                  }
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-full border-primary/15 bg-background/40 px-3 text-xs"
                onClick={() => refetch()}
                disabled={isRefetching}
              >
                <RefreshCcw
                  className={`mr-2 size-3.5 ${isRefetching ? 'animate-spin' : ''}`}
                />
                Làm mới
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Sản lượng Dự kiến"
          value={totalExpected}
          unit="kg"
          icon={FileText}
          description="Từ hợp đồng & báo cáo GSV"
          accent="primary"
          isLoading={isLoading}
        />
        <SummaryCard
          title="Tồn kho Thực tế"
          value={totalStock}
          unit="kg"
          icon={Package}
          description="Hiện có trong các kho quản lý"
          accent="emerald"
          isLoading={isLoading}
        />
        <SummaryCard
          title="Nhu cầu Đơn hàng"
          value={totalPending}
          unit="kg"
          icon={ShoppingCart}
          description="Các đơn hàng chưa xuất kho"
          accent="rose"
          isLoading={isLoading}
        />
        <SummaryCard
          title="Cán cân Dự phòng"
          value={gap}
          unit="kg"
          icon={gap >= 0 ? TrendingUp : TrendingDown}
          description={gap >= 0 ? 'Dư cung (Sẵn sàng bán)' : 'Thiếu hụt (Cần nhập thêm)'}
          accent={gap >= 0 ? 'emerald' : 'rose'}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Chart */}
        <div className="xl:col-span-2">
          {isLoading ? (
            <Skeleton className="h-[460px] w-full rounded-[24px]" />
          ) : (
            <SupplyDemandChart data={data?.items ?? []} />
          )}
        </div>

        {/* Detailed Table */}
        <div className="xl:col-span-1">
          <Card className="h-full rounded-[24px] border border-border/70 bg-card/85 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="size-4 text-primary" />
                <CardTitle className="font-manrope text-sm font-semibold">
                  Chi tiết từng loại cây
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60">
                    <TableHead className="text-[10px] uppercase font-bold tracking-wider">
                      Mặt hàng
                    </TableHead>
                    <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider">
                      Tồn kho
                    </TableHead>
                    <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider">
                      Cân đối
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : data?.items && data.items.length > 0 ? (
                    data.items.map((item: SupplyDemandItem) => {
                      const balance = item.actualStockKg - item.pendingOrderKg;
                      return (
                        <TableRow key={item.cropType} className="group/row transition-colors hover:bg-muted/30">
                          <TableCell className="font-medium text-sm">
                            {item.cropType}
                          </TableCell>
                          <TableCell className="text-right text-sm font-manrope">
                            {item.actualStockKg.toLocaleString('vi-VN')} kg
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant="outline"
                              className={`rounded-full px-2 py-0 text-[10px] ${
                                balance >= 0
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
                                  : 'bg-rose-500/10 text-rose-600 border-rose-200'
                              }`}
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
                      <TableCell colSpan={3} className="h-32 text-center text-muted-foreground text-xs italic">
                        Không có dữ liệu phù hợp
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
    primary:
      'border-primary/15 bg-primary/8 text-primary dark:bg-primary/20',
    emerald:
      'border-emerald-200/50 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    rose: 'border-rose-200/50 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  };

  return (
    <Card className="overflow-hidden rounded-[24px] border border-border/70 bg-card/85 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div
            className={`flex size-10 items-center justify-center rounded-xl border ${accentClasses[accent]}`}
          >
            <Icon className="size-5" />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            {isLoading ? (
              <Skeleton className="mt-1 h-8 w-24 ml-auto" />
            ) : (
              <h3 className="mt-1 font-manrope text-2xl font-bold tracking-tight">
                {value.toLocaleString('vi-VN')}
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  {unit}
                </span>
              </h3>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-3">
          <p className="text-[11px] text-muted-foreground">{description}</p>
          <ChevronRight className="size-3 text-muted-foreground/30" />
        </div>
      </CardContent>
    </Card>
  );
}
