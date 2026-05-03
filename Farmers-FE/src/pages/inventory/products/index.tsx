import React, { useState } from 'react';
import { Package, Plus, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { inventoryProductApi } from './api/product-api';
import { productColumns } from './components/product-columns';
import { extractData } from '@/client/lib/api-client';
import type { Product, PaginatedResponse } from '@/client/types';
import { CreateProductFromLotDialog } from './components/CreateProductFromLotDialog';
import { useProductMutations } from './api/use-product-mutations';

export default function ProductsManagementPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['products', 'internal'],
    queryFn: async () => {
      const response = await inventoryProductApi.listInternal();
      return extractData<PaginatedResponse<Product>>(response);
    },
  });

  const { createFromLot } = useProductMutations();

  const products = data?.items || [];

  const handleCreateFromLot = async (payload: any) => {
    await createFromLot.mutateAsync(payload);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/8 text-primary">
              <Package className="size-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Quản lý Sản phẩm
            </h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Quản lý danh sách nông sản niêm yết trên hệ thống thương mại điện tử.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
          >
            <RefreshCw className={`size-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button
            size="sm"
            className="h-9 shadow-md shadow-primary/20"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="size-4 mr-2" />
            Niêm yết mới từ kho
          </Button>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-hide">
          <DataTable
            columns={productColumns}
            data={products}
            isLoading={isLoading || isFetching}
            onReload={() => refetch()}
            searchPlaceholder="Tìm kiếm tên sản phẩm, SKU..."
          />
        </div>
      </div>

      <CreateProductFromLotDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreateFromLot}
        isLoading={createFromLot.isPending}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
