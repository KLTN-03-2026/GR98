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
  RefreshCcw,
  Search,
  Eye,
  Activity,
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
        <span className="text-sm font-medium uppercase">#{row.original.id.slice(-8)}</span>
      ),
    },
    {
      accessorKey: 'product',
      header: 'Sản phẩm',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{row.original.product.name}</span>
          <span className="text-xs text-muted-foreground uppercase">{row.original.product.sku}</span>
        </div>
      ),
    },
    {
      accessorKey: 'qualityGrade',
      header: 'Chất lượng',
      cell: ({ row }) => {
        const variant = row.original.qualityGrade === 'A' ? 'default' : row.original.qualityGrade === 'B' ? 'secondary' : 'outline';
        return <Badge variant={variant}>Loại {row.original.qualityGrade}</Badge>;
      },
    },
    {
      accessorKey: 'harvestDate',
      header: 'Thời gian thu hoạch',
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {row.original.harvestDate ? format(new Date(row.original.harvestDate), 'dd/MM/yyyy') : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'quantityKg',
      header: 'Số lượng',
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {row.original.quantityKg.toLocaleString('vi-VN')} {row.original.product.unit}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: () => (
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          Chi tiết
        </Button>
      ),
    },
  ], []);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !warehouse) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertCircle size={40} className="text-rose-500" />
        <h2 className="text-2xl font-bold tracking-tight">Không tìm thấy kho</h2>
        <Button onClick={() => navigate('/inventory/warehouses')} variant="outline">
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header Styled EXACTLY like admin/daily-reports */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/8">
            <WarehouseIcon className="size-4 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{warehouse.name}</h1>
        </div>
        <p className="text-muted-foreground text-sm flex items-center gap-1.5">
          <MapPin size={14} />
          {warehouse.locationAddress ?? 'Chưa cập nhật địa chỉ'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            Tổng tồn: {totalStock.toLocaleString('vi-VN')} kg
          </Badge>
          <Badge variant="outline">
            {warehouse.inventoryLots.length} Lô hàng
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="lots" className="w-full">
            <div className="flex items-center justify-between mb-4">
                <TabsList className="h-9">
                    <TabsTrigger value="lots" className="text-xs">Danh sách tồn kho</TabsTrigger>
                    <TabsTrigger value="history" className="text-xs">Lịch sử giao dịch</TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => refetch()}
                    >
                        <RefreshCcw className="size-4 text-muted-foreground" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={() => navigate('/inventory/warehouses')}
                    >
                        <ArrowLeft className="mr-2 size-4" />
                        Quay lại
                    </Button>
                </div>
            </div>

            <TabsContent value="lots" className="mt-0 focus-visible:outline-none">
              <DataTable
                columns={lotColumns}
                data={filteredLots}
                isLoading={isLoading}
                hiddenSearch
                enableSorting={false}
                noResults={<span className="text-muted-foreground">Chưa có dữ liệu phù hợp.</span>}
                filterToolbar={
                  <div className="flex flex-wrap items-end gap-4 w-full">
                    <div className="space-y-2 min-w-[200px] flex-1 max-w-sm">
                      <Label className="text-xs">Tìm kiếm lô hàng</Label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-8 h-9"
                          placeholder="Tên sản phẩm, mã lô..."
                          value={lotSearch}
                          onChange={(e) => setLotSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="pb-0.5">
                        <Badge variant="outline" className="h-9 px-3 border-dashed flex items-center gap-2">
                           <Activity className="size-3.5" />
                           <span className="text-xs font-normal">Cập nhật lúc {format(new Date(), 'HH:mm')}</span>
                        </Badge>
                    </div>
                  </div>
                }
              />
            </TabsContent>

            <TabsContent value="history" className="mt-0 focus-visible:outline-none">
              <div className="space-y-4 pt-2">
                {warehouse.transactions.length > 0 ? (
                  <div className="grid gap-3">
                    {warehouse.transactions.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-4 rounded-lg border bg-card transition-colors hover:bg-accent/5">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "flex size-10 items-center justify-center rounded-full border",
                            t.type === 'inbound' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            t.type === 'outbound' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                          )}>
                            <History size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{t.type === 'inbound' ? 'Nhập kho' : t.type === 'outbound' ? 'Xuất kho' : 'Điều chỉnh'}</span>
                              <span className="text-xs text-muted-foreground">#{t.id.slice(-8).toUpperCase()}</span>
                            </div>
                            <p className="text-sm">{t.product.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "text-base font-bold tabular-nums",
                            t.type === 'inbound' ? 'text-emerald-600' : t.type === 'outbound' ? 'text-rose-600' : 'text-amber-600'
                          )}>
                            {t.type === 'outbound' ? '-' : '+'}{t.quantityKg.toLocaleString('vi-VN')} kg
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(t.createdAt), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground border border-dashed rounded-lg">
                    Chưa có lịch sử giao dịch.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
