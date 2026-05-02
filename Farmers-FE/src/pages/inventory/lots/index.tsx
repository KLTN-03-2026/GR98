import React, { useMemo, useState } from 'react';
import { Package, Warehouse, History } from 'lucide-react';
import { useGetLots, useGetWarehouses, useGetProducts } from './api/hooks';
import { LotDetailDrawer } from './components/LotDetailDrawer';
import { LotsFilterBar } from './components/LotsFilterBar';
import { DataTable } from '@/components/data-table';
import { Card, CardContent } from '@/components/ui/card';
import { createLotColumns } from './components/lots-columns';
import type { InventoryLot, GetLotsFilters } from './api/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function InventoryLotsPage() {
  const [selectedLot, setSelectedLot] = useState<InventoryLot | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('in-stock');
  const [filters, setFilters] = useState<GetLotsFilters>({});

  const { data: lots = [], isLoading, isFetching, refetch } = useGetLots(filters);
  const { data: warehouses = [] } = useGetWarehouses();
  const { data: products = [] } = useGetProducts();

  // Phân loại lô hàng
  const { inStock, upcoming, stats } = useMemo(() => {
    return lots.reduce((acc, lot) => {
      if (lot.isUpcoming) {
        acc.upcoming.push(lot);
        acc.stats.upcomingTotal += lot.quantityKg;
      } else {
        acc.inStock.push(lot);
        acc.stats.actualTotal += lot.quantityKg;
      }
      return acc;
    }, {
      inStock: [] as InventoryLot[],
      upcoming: [] as InventoryLot[],
      stats: { actualTotal: 0, upcomingTotal: 0 }
    });
  }, [lots]);

  const handleViewDetail = (lot: InventoryLot) => {
    setSelectedLot(lot);
    setIsDrawerOpen(true);
  };

  const columns = useMemo(() => createLotColumns({
    onViewDetail: handleViewDetail
  }), []);

  const filterToolbar = (
    <LotsFilterBar
      filters={filters}
      onFiltersChange={setFilters}
      warehouses={warehouses.map((w: any) => ({ id: w.id, name: w.name }))}
      products={products.map((p: any) => ({ id: p.id, name: p.name }))}
    />
  );

  return (
    <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/8">
              <Package className="size-4 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Quản lý Lô hàng
            </h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Giám sát định danh, chất lượng và tồn kho nông sản theo từng lô hàng nhập kho.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 rounded-lg border bg-background p-1">
            <div className="px-3 py-1.5 rounded-md bg-emerald-50 border border-emerald-100/50">
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Thực tồn</p>
              <p className="text-sm font-semibold text-emerald-700">{stats.actualTotal.toLocaleString('vi-VN')} kg</p>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-muted">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sắp về</p>
              <p className="text-sm font-semibold text-foreground">{stats.upcomingTotal.toLocaleString('vi-VN')} kg</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="in-stock" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="in-stock">
              <Warehouse className="size-4 mr-2" />
              Lô hàng trong kho ({inStock.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              <History className="size-4 mr-2" />
              Lô hàng sắp về ({upcoming.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="in-stock" className="mt-0">
          <Card>
            <CardContent className="pt-6">
              <DataTable
                columns={columns}
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

        <TabsContent value="upcoming" className="mt-0">
          <Card>
            <CardContent className="pt-6">
              <DataTable
                columns={columns}
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
    </div>
  );
}
