import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Warehouse as WarehouseIcon,
  MapPin,
  Box,
  History,
  Calendar,
  AlertCircle,
  Package,
  Tag,
  ArrowDownLeft,
  ArrowUpRight,
  Settings2,
  Activity,
  RefreshCcw,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetWarehouseDetail } from '../api/hooks';
import { cn } from '@/lib/utils';
import { DataTable } from '@/components/data-table/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import type { InventoryLot, WarehouseTransaction } from '../api/types';

const QUALITY_COLORS = {
  A: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  B: 'bg-blue-500/10 text-blue-700 border-blue-200',
  C: 'bg-amber-500/10 text-amber-700 border-amber-200',
  REJECT: 'bg-rose-500/10 text-rose-700 border-rose-200',
};

const TYPE_CONFIG = {
  inbound: { label: 'Nhập kho', icon: ArrowDownLeft, class: 'text-emerald-600 bg-emerald-500/10 border-emerald-200' },
  outbound: { label: 'Xuất kho', icon: ArrowUpRight, class: 'text-rose-600 bg-rose-500/10 border-rose-200' },
  adjustment: { label: 'Điều chỉnh', icon: Settings2, class: 'text-amber-600 bg-amber-500/10 border-amber-200' },
};

export default function WarehouseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: warehouse, isLoading, error, refetch } = useGetWarehouseDetail(id || '');
  const [lotSearch, setLotSearch] = useState('');

  const totalStock = useMemo(() => {
    return warehouse?.inventoryLots.reduce((acc, lot) => acc + lot.quantityKg, 0) ?? 0;
  }, [warehouse]);

  const filteredLots = useMemo(() => {
    if (!warehouse) return [];
    return warehouse.inventoryLots.filter(lot => 
        lot.product.name.toLowerCase().includes(lotSearch.toLowerCase()) ||
        lot.product.sku.toLowerCase().includes(lotSearch.toLowerCase()) ||
        lot.id.toLowerCase().includes(lotSearch.toLowerCase())
    );
  }, [warehouse, lotSearch]);

  const lotColumns = useMemo<ColumnDef<InventoryLot>[]>(() => [
    {
      accessorKey: 'id',
      header: 'Mã lô',
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums text-primary uppercase text-xs">
          #{row.original.id.slice(-10)}
        </span>
      ),
    },
    {
      accessorKey: 'product',
      header: 'Sản phẩm',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-sm">{row.original.product.name}</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase">{row.original.product.sku}</span>
        </div>
      ),
    },
    {
      accessorKey: 'qualityGrade',
      header: 'Chất lượng',
      cell: ({ row }) => (
        <Badge variant="outline" className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase", QUALITY_COLORS[row.original.qualityGrade] || '')}>
          Loại {row.original.qualityGrade}
        </Badge>
      ),
    },
    {
      accessorKey: 'harvestDate',
      header: 'Ngày thu hoạch',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Calendar size={13} className="text-primary/60" />
          {row.original.harvestDate ? format(new Date(row.original.harvestDate), 'dd/MM/yyyy') : '—'}
        </div>
      ),
    },
    {
      accessorKey: 'quantityKg',
      header: () => <div className="text-right">Số lượng</div>,
      cell: ({ row }) => (
        <div className="text-right font-manrope font-bold tabular-nums text-slate-900">
          {row.original.quantityKg.toLocaleString('vi-VN')} <span className="text-[10px] font-medium text-muted-foreground">{row.original.product.unit}</span>
        </div>
      ),
    },
  ], []);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Đang tải thông tin kho...</p>
        </div>
      </div>
    );
  }

  if (error || !warehouse) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="rounded-full bg-rose-50 p-4 text-rose-500 shadow-sm border border-rose-100">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Không tìm thấy kho hàng</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Kho hàng không tồn tại hoặc bạn không có quyền truy cập thông tin này.
        </p>
        <Button onClick={() => navigate('/inventory/warehouses')} variant="primary" className="rounded-full px-8">
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 font-manrope">
      {/* Header Styled like admin/daily-reports */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/8">
              <WarehouseIcon className="size-4 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{warehouse.name}</h1>
          </div>
          <div className="flex items-center gap-2">
             <Button
                variant="outline"
                size="icon"
                className="size-9 rounded-xl border-slate-200"
                onClick={() => refetch()}
              >
                <RefreshCcw className="size-4 text-muted-foreground" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-slate-200 text-xs font-bold uppercase tracking-wider"
                onClick={() => navigate('/inventory/warehouses')}
              >
                <ArrowLeft className="mr-2 size-3.5" />
                Quay lại
              </Button>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm flex items-center gap-1.5 font-medium">
                <MapPin size={14} className="text-primary/60" />
                {warehouse.locationAddress ?? 'Chưa cập nhật địa chỉ'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-sky-50 text-sky-700 border-sky-100 font-bold uppercase text-[10px] tracking-wider px-2.5">
                    Tổng tồn: {totalStock.toLocaleString('vi-VN')} kg
                </Badge>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold uppercase text-[10px] tracking-wider px-2.5">
                    {warehouse.inventoryLots.length} Lô hàng
                </Badge>
                <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100 font-bold uppercase text-[10px] tracking-wider px-2.5">
                    Mã kho: {warehouse.id.slice(-8).toUpperCase()}
                </Badge>
            </div>
        </div>
      </div>

      <Card className="border-border/60 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <Tabs defaultValue="lots" className="w-full">
            <div className="px-6 pt-6 pb-2">
                <TabsList className="h-10 rounded-xl bg-slate-100/80 p-1">
                    <TabsTrigger value="lots" className="rounded-lg px-8 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                        Danh sách tồn kho
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-lg px-8 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                        Lịch sử giao dịch
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="lots" className="m-0 focus-visible:outline-none">
              <DataTable
                columns={lotColumns}
                data={filteredLots}
                isLoading={isLoading}
                hiddenSearch
                className="border-none"
                tableClassName="border-x-0 border-b-0 rounded-none"
                noResults={<span className="text-muted-foreground">Không tìm thấy lô hàng phù hợp.</span>}
                filterToolbar={
                  <div className="flex flex-wrap items-end gap-4 w-full px-6 pb-4 pt-2">
                    <div className="space-y-2 min-w-[280px] flex-1 max-w-sm">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tìm kiếm sản phẩm, mã lô</Label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-8 h-9 rounded-xl border-slate-200 text-sm focus-visible:ring-primary/20"
                          placeholder="Nhập tên sầu riêng, cà phê hoặc mã lô..."
                          value={lotSearch}
                          onChange={(e) => setLotSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-end gap-2 pb-0.5">
                        <div className="flex items-center gap-2 rounded-xl border border-dashed border-primary/20 px-3 h-9 bg-primary/5">
                            <Activity className="size-3.5 text-primary" />
                            <span className="text-[10px] font-bold uppercase text-primary tracking-tight">Cập nhật lúc {format(new Date(), 'HH:mm')}</span>
                        </div>
                    </div>
                  </div>
                }
              />
            </TabsContent>

            <TabsContent value="history" className="m-0 focus-visible:outline-none px-6 pb-6 pt-2">
              <div className="space-y-4 mt-2">
                <div className="flex flex-col gap-1 px-1">
                  <h2 className="text-base font-bold tracking-tight">Nhật ký biến động kho</h2>
                  <p className="text-xs text-muted-foreground font-medium italic">Theo dõi chi tiết các lượt nhập kho, xuất kho và điều chỉnh tồn kho.</p>
                </div>
                
                <div className="grid gap-2.5">
                  {warehouse.transactions.length > 0 ? (
                    warehouse.transactions.map((t) => {
                      const config = TYPE_CONFIG[t.type as keyof typeof TYPE_CONFIG] || { label: t.type, icon: History, class: '' };
                      const Icon = config.icon;
                      return (
                        <div key={t.id} className="group relative overflow-hidden rounded-xl border border-slate-200/60 bg-slate-50/30 p-3.5 transition-all hover:border-primary/30 hover:bg-white hover:shadow-sm">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                              <div className={cn("flex size-9 items-center justify-center rounded-xl border shadow-xs transition-transform group-hover:scale-105", config.class)}>
                                <Icon size={18} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[13px] tracking-tight text-slate-800">{config.label}</span>
                                  <span className="text-[10px] font-bold text-slate-400">#{t.id.slice(-8).toUpperCase()}</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-900">{t.product.name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={cn(
                                "font-manrope text-base font-bold tabular-nums leading-none",
                                t.type === 'inbound' ? 'text-emerald-600' : t.type === 'outbound' ? 'text-rose-600' : 'text-amber-600'
                              )}>
                                {t.type === 'outbound' ? '-' : '+'}{t.quantityKg.toLocaleString('vi-VN')} <span className="text-[11px] font-medium">kg</span>
                              </p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-80">
                                {format(new Date(t.createdAt), 'dd/MM HH:mm', { locale: vi })}
                              </p>
                            </div>
                          </div>
                          {t.note && (
                            <div className="mt-2.5 flex items-start gap-2 border-t border-dashed border-slate-200 pt-2 opacity-80">
                                <Activity size={10} className="mt-0.5 text-muted-foreground" />
                                <p className="text-[11px] text-muted-foreground italic leading-relaxed line-clamp-1">{t.note}</p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-300">
                      <History className="size-8 text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chưa có lịch sử giao dịch</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
