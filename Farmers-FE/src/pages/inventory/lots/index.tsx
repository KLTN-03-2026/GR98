import React, { useMemo, useState } from 'react';
import { Package, RefreshCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useGetLots, useGetWarehouses, useGetProducts } from './api/hooks';
import { LotDetailDrawer } from './components/LotDetailDrawer';
import { LotsFilterBar } from './components/LotsFilterBar';
import { DataTable } from '@/components/data-table';
import { Card, CardContent } from '@/components/ui/card';
import { createLotColumns } from './components/lots-columns';
import type { InventoryLot, GetLotsFilters } from './api/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmReceiptDialog } from './components/ConfirmReceiptDialog';
import { RejectLotDialog } from './components/RejectLotDialog';
import { QualityGradingDialog } from './components/QualityGradingDialog';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';

export default function InventoryLotsPage() {
  const queryClient = useQueryClient();
  const [selectedLot, setSelectedLot] = useState<InventoryLot | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('in-stock');
  const [filters, setFilters] = useState<GetLotsFilters>({});

  const { data: lots = [], isLoading, isFetching, refetch } = useGetLots(filters);
  const { data: warehouses = [] } = useGetWarehouses();
  const { data: products = [] } = useGetProducts();

  // Phân loại lô hàng
  const { inStock, upcoming, pending, stats } = useMemo(() => {
    return lots.reduce((acc, lot) => {
      if (lot.status === 'SCHEDULED') {
        acc.upcoming.push(lot);
        acc.stats.upcomingTotal += lot.quantityKg;
      } else if (lot.status === 'ARRIVED') {
        acc.pending.push(lot);
        acc.stats.pendingTotal += lot.quantityKg;
      } else if (lot.status === 'RECEIVED') {
        acc.inStock.push(lot);
        acc.stats.actualTotal += lot.quantityKg;
      }
      return acc;
    }, {
      inStock: [] as InventoryLot[],
      upcoming: [] as InventoryLot[],
      pending: [] as InventoryLot[],
      stats: { actualTotal: 0, upcomingTotal: 0, pendingTotal: 0 }
    });
  }, [lots]);

  const [confirmLot, setConfirmLot] = useState<InventoryLot | null>(null);
  const [rejectLot, setRejectLot] = useState<InventoryLot | null>(null);
  const [gradingLot, setGradingLot] = useState<InventoryLot | null>(null);

  const handleViewDetail = (lot: InventoryLot) => {
    setSelectedLot(lot);
    setIsDrawerOpen(true);
  };

  const columnsHandlers = {
    onViewDetail: handleViewDetail,
    onConfirm: (lot: InventoryLot) => setConfirmLot(lot),
    onReject: (lot: InventoryLot) => setRejectLot(lot),
    onUpdateGrade: (lot: InventoryLot) => setGradingLot(lot),
  };

  const inStockColumns = useMemo(() => createLotColumns({ ...columnsHandlers, mode: 'in-stock' }), []);
  const pendingColumns = useMemo(() => createLotColumns({ ...columnsHandlers, mode: 'pending' }), []);
  const upcomingColumns = useMemo(() => createLotColumns({ ...columnsHandlers, mode: 'upcoming' }), []);

  const filterToolbar = (
    <LotsFilterBar
      filters={filters}
      onFiltersChange={setFilters}
      warehouses={warehouses.map((w: any) => ({ id: w.id, name: w.name }))}
      products={products.map((p: any) => ({ id: p.id, name: p.name }))}
    />
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header Section - EXACT Daily Reports Style */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/8">
                <Package className="size-4 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Quản lý Lô hàng</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Giám sát định danh, chất lượng và tồn kho nông sản theo từng lô hàng thực địa.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="secondary">
            Thực tồn: {stats.actualTotal.toLocaleString('vi-VN')} kg
          </Badge>
          <Badge variant="outline">
            Đang chờ: {stats.pendingTotal.toLocaleString('vi-VN')} kg
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="in-stock" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
                <TabsList className="h-9">
                    <TabsTrigger value="in-stock" className="text-xs">Trong kho ({inStock.length})</TabsTrigger>
                    <TabsTrigger value="pending" className="text-xs">Chờ xác nhận ({pending.length})</TabsTrigger>
                    <TabsTrigger value="upcoming" className="text-xs">Sắp về ({upcoming.length})</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="in-stock" className="mt-0 outline-none">
              <DataTable
                columns={inStockColumns}
                data={inStock}
                isLoading={isLoading || isFetching}
                onRowClick={(row) => handleViewDetail(row)}
                onReload={() => queryClient.invalidateQueries({ queryKey: ['inventory-lots'] })}
                hiddenSearch
                enableSorting={false}
                filterToolbar={filterToolbar}
                noResults={<span className="text-muted-foreground">Chưa có lô hàng phù hợp.</span>}
              />
            </TabsContent>

            <TabsContent value="pending" className="mt-0 outline-none">
              <DataTable
                columns={pendingColumns}
                data={pending}
                isLoading={isLoading || isFetching}
                onRowClick={(row) => handleViewDetail(row)}
                onReload={() => queryClient.invalidateQueries({ queryKey: ['inventory-lots'] })}
                hiddenSearch
                enableSorting={false}
                filterToolbar={filterToolbar}
                noResults={<span className="text-muted-foreground">Chưa có lô hàng phù hợp.</span>}
              />
            </TabsContent>

            <TabsContent value="upcoming" className="mt-0 outline-none">
              <DataTable
                columns={upcomingColumns}
                data={upcoming}
                isLoading={isLoading || isFetching}
                onRowClick={(row) => handleViewDetail(row)}
                onReload={() => queryClient.invalidateQueries({ queryKey: ['inventory-lots'] })}
                hiddenSearch
                enableSorting={false}
                filterToolbar={filterToolbar}
                noResults={<span className="text-muted-foreground">Chưa có lô hàng phù hợp.</span>}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <LotDetailDrawer
        lot={selectedLot}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {confirmLot && (
        <ConfirmReceiptDialog
          lot={confirmLot}
          isOpen={!!confirmLot}
          onClose={() => setConfirmLot(null)}
        />
      )}

      {rejectLot && (
        <RejectLotDialog
          lot={rejectLot}
          isOpen={!!rejectLot}
          onClose={() => setRejectLot(null)}
        />
      )}

      {gradingLot && (
        <QualityGradingDialog
          lot={gradingLot}
          isOpen={!!gradingLot}
          onClose={() => setGradingLot(null)}
        />
      )}
    </div>
  );
}
