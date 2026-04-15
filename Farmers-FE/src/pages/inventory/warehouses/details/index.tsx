import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Warehouse as WarehouseIcon,
  MapPin,
  Box,
  History,
  Calendar,
  AlertCircle,
  TrendingUp,
  Tag,
  ArrowDownLeft,
  ArrowUpRight,
  Settings2,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetWarehouseDetail } from '../api/hooks';

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
  const { data: warehouse, isLoading, error } = useGetWarehouseDetail(id || '');

  const totalStock = useMemo(() => {
    return warehouse?.inventoryLots.reduce((acc, lot) => acc + lot.quantityKg, 0) ?? 0;
  }, [warehouse]);

  if (isLoading) {
    return <div className="p-6">Đang tải thông tin kho...</div>;
  }

  if (error || !warehouse) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="rounded-full bg-rose-50 p-4 dark:bg-rose-500/10 text-rose-500">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold">Không tìm thấy kho hàng</h2>
        <p className="max-w-md text-muted-foreground">
          Kho hàng không tồn tại hoặc bạn không có quyền truy cập thông tin này.
        </p>
        <Button onClick={() => navigate('/inventory/warehouses')} variant="outline" className="rounded-full">
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-6 scrollbar-hide">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/inventory/warehouses')}
          className="rounded-full hover:bg-background/80"
        >
          <ArrowLeft size={18} />
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/inventory/warehouses" className="hover:text-primary">Kho hàng</Link>
          <span className="opacity-50">/</span>
          <span className="text-foreground font-medium">{warehouse.name}</span>
        </div>
      </div>

      {/* Header Profile Section */}
      <section className="relative overflow-hidden rounded-[24px] border border-primary/10 bg-card/60 p-6 backdrop-blur-md">
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-primary/5 blur-[80px]" />
        
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-5">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-[20px] border border-primary/20 bg-primary/10 text-primary shadow-sm">
              <WarehouseIcon size={32} />
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-3">
                <h1 className="font-manrope text-2xl font-bold tracking-tight">{warehouse.name}</h1>
                <Badge className="rounded-full bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 border-none">
                  Trực tuyến
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-primary" />
                  <span>{warehouse.locationAddress ?? 'Không rõ địa chỉ'}</span>
                </div>
                <div className="flex items-center gap-1.5 before:content-['•'] before:opacity-30 before:mr-1">
                  <Tag size={14} className="text-primary" />
                  <span>ID: {warehouse.id.slice(-8).toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Card className="flex items-center gap-3 border-primary/10 bg-background/40 px-4 py-2 shadow-none">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <TrendingUp size={16} />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase text-muted-foreground tracking-wider">Tổng tồn kho</p>
                <p className="font-manrope text-lg font-bold tabular-nums">
                  {totalStock.toLocaleString('vi-VN')} <span className="text-sm font-medium">kg</span>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content Tabs */}
      <Tabs defaultValue="lots" className="w-full">
        <TabsList className="h-11 w-full justify-start rounded-full border border-border/60 bg-muted/40 p-1 mb-6">
          <TabsTrigger value="lots" className="rounded-full px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Box size={14} className="mr-2" />
            Lô hàng ({warehouse.inventoryLots.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-full px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <History size={14} className="mr-2" />
            Lịch sử giao dịch
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lots" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <Card className="rounded-[24px] border border-border/70 bg-card/85 p-0 overflow-hidden shadow-sm">
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="py-4 pl-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Lô hàng</TableHead>
                <TableHead className="py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Sản phẩm</TableHead>
                <TableHead className="py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Chất lượng</TableHead>
                <TableHead className="py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Ngày thu hoạch</TableHead>
                <TableHead className="py-4 text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Số lượng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouse.inventoryLots.length > 0 ? (
                warehouse.inventoryLots.map((lot) => (
                  <TableRow key={lot.id} className="group border-border/40 transition-colors hover:bg-muted/30">
                    <TableCell className="py-4 pl-6 font-medium tabular-nums group-hover:text-primary">
                      {lot.id.slice(-10).toUpperCase()}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold">{lot.product.name}</span>
                        <span className="text-[11px] text-muted-foreground uppercase">{lot.product.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 border ${QUALITY_COLORS[lot.qualityGrade] || ''}`}>
                        Loại {lot.qualityGrade}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="opacity-60" />
                        {lot.harvestDate ? format(new Date(lot.harvestDate), 'dd/MM/yyyy') : '—'}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right font-manrope font-bold tabular-nums">
                      {lot.quantityKg.toLocaleString('vi-VN')} {lot.product.unit}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                    Không có lô hàng nào trong kho này.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="space-y-3">
            {warehouse.transactions.length > 0 ? (
              warehouse.transactions.map((t) => {
                const config = TYPE_CONFIG[t.type as keyof typeof TYPE_CONFIG] || { label: t.type, icon: History, class: '' };
                const Icon = config.icon;
                return (
                  <Card key={t.id} className="rounded-[18px] border border-border/60 bg-card/80 p-4 shadow-none transition-all hover:border-primary/20 hover:bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`flex size-10 items-center justify-center rounded-full border ${config.class}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm tracking-tight">{config.label}</span>
                            <span className="text-[11px] text-muted-foreground">•</span>
                            <span className="text-[11px] font-medium text-muted-foreground">#{t.id.slice(-8).toUpperCase()}</span>
                          </div>
                          <p className="text-sm font-medium">{t.product.name}</p>
                          {t.note && <p className="text-[11px] text-muted-foreground italic mt-0.5 max-w-sm truncate">{t.note}</p>}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className={`font-manrope text-base font-bold tabular-nums ${t.type === 'inbound' ? 'text-emerald-600' : t.type === 'outbound' ? 'text-rose-600' : ''}`}>
                          {t.type === 'outbound' ? '-' : '+'}{t.quantityKg.toLocaleString('vi-VN')} <span className="text-xs font-normal">kg</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {format(new Date(t.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="flex h-40 items-center justify-center border-dashed text-muted-foreground">
                Chưa có lịch sử giao dịch.
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
