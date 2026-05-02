import React, { useMemo, useState } from 'react';
import { Package, Warehouse, History } from 'lucide-react';
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

export default function InventoryLotsPage() {
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
    <div className="h-full min-h-0 flex flex-col gap-6 p-4 sm:p-6">
      {/* Header Section - Admin Style */}
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
      </div>

      <Tabs defaultValue="in-stock" value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <div className="flex flex-col gap-4">
          {/* Quick Stats & Tabs Toolbar */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <TabsList className="h-10 p-1 bg-muted/50 rounded-lg">
              <TabsTrigger value="in-stock" className="px-4 rounded-md">
                Lô trong kho
                <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700">{inStock.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="pending" className="px-4 rounded-md">
                Chờ xác nhận
                <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700">{pending.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="px-4 rounded-md">
                Sắp về
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">{upcoming.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1">
                Thực tồn: <span className="ml-1 font-bold">{stats.actualTotal.toLocaleString('vi-VN')} kg</span>
              </Badge>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 px-3 py-1">
                Chờ nhập: <span className="ml-1 font-bold">{stats.pendingTotal.toLocaleString('vi-VN')} kg</span>
              </Badge>
            </div>
          </div>
        </div>

        <TabsContent value="in-stock" className="mt-0 outline-none">
          <Card>
            <CardContent className="p-0">
              <DataTable
                columns={inStockColumns}
                data={inStock}
                isLoading={isLoading || isFetching}
                onRowClick={(row) => handleViewDetail(row)}
                onReload={() => refetch()}
                searchPlaceholder="Tìm kiếm lô hàng trong kho..."
                filterToolbar={filterToolbar}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-0 outline-none">
          <Card>
            <CardContent className="p-0">
              <DataTable
                columns={pendingColumns}
                data={pending}
                isLoading={isLoading || isFetching}
                onRowClick={(row) => handleViewDetail(row)}
                onReload={() => refetch()}
                searchPlaceholder="Tìm kiếm lô hàng chờ xác nhận..."
                filterToolbar={filterToolbar}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-0 outline-none">
          <Card>
            <CardContent className="p-0">
              <DataTable
                columns={upcomingColumns}
                data={upcoming}
                isLoading={isLoading || isFetching}
                onRowClick={(row) => handleViewDetail(row)}
                onReload={() => refetch()}
                searchPlaceholder="Tìm kiếm lô hàng sắp về..."
                filterToolbar={filterToolbar}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Drawer */}
      <LotDetailDrawer
        lot={selectedLot}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Confirm Receipt Dialog */}
      {confirmLot && (
        <ConfirmReceiptDialog
          lot={confirmLot}
          isOpen={!!confirmLot}
          onClose={() => setConfirmLot(null)}
        />
      )}

      {/* Reject Lot Dialog */}
      {rejectLot && (
        <RejectLotDialog
          lot={rejectLot}
          isOpen={!!rejectLot}
          onClose={() => setRejectLot(null)}
        />
      )}

      {/* Quality Grading Dialog */}
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
