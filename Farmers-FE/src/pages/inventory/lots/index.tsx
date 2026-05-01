import React, { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Package, RefreshCw } from 'lucide-react';
import { useGetLots } from './api/hooks';
import { LotDetailDrawer } from './components/LotDetailDrawer';
import { DataTable } from '@/components/data-table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createLotColumns } from './components/lots-columns';
import type { InventoryLot } from './api/types';
import { cn } from '@/lib/utils';

export default function InventoryLotsPage() {
  const queryClient = useQueryClient();
  const [selectedLot, setSelectedLot] = useState<InventoryLot | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: lots = [], isLoading, isFetching, refetch } = useGetLots({});

  const handleViewDetail = (lot: InventoryLot) => {
    setSelectedLot(lot);
    setIsDrawerOpen(true);
  };

  const columns = useMemo(() => createLotColumns({
    onViewDetail: handleViewDetail
  }), []);

  return (
    <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-500">
      {/* Header section matches Admin style */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/8">
              <Package className="size-4 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Quản lý Lô hàng
            </h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Giám sát định danh, chất lượng và tồn kho nông sản theo từng lô hàng nhập kho.
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn("size-4 mr-2", isFetching && "animate-spin")} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Main Table wrapped in Card matching Admin style */}
      <Card>
        <CardContent className="pt-6">
          <DataTable 
            columns={columns} 
            data={lots} 
            isLoading={isLoading || isFetching}
            onRowClick={(row) => handleViewDetail(row)}
            searchPlaceholder="Tìm kiếm theo mã lô, tên sản phẩm hoặc SKU..."
            noResults={
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Package className="size-8 text-slate-200" />
                <p className="text-sm text-muted-foreground">Không tìm thấy lô hàng nào phù hợp.</p>
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <LotDetailDrawer 
        lot={selectedLot} 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </div>
  );
}

