import { useState } from 'react';
import { Package, Plus, RefreshCw, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { inventoryProductApi } from './api/product-api';
import { productColumns } from './components/product-columns';
import { extractData } from '@/client/lib/api-client';
import { ProductFilters } from './components/ProductFilters';
import type { Product, PaginatedResponse } from '@/client/types';
import type { ProductQueryParams } from './api/product-api';

import { CreateProductFromContractDialog } from './components/CreateProductFromContractDialog';
import { ProductDialog } from './components/ProductDialog';
import { useProductMutations } from './api/use-product-mutations';
import { useCategories } from '@/client/api/categories/use-categories';

export default function ProductsManagementPage() {
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filters, setFilters] = useState<ProductQueryParams>({
    page: 1,
    limit: 50, // Tăng limit để hiển thị nhiều hơn
  });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['products', 'internal', filters],
    queryFn: async () => {
      const response = await inventoryProductApi.listInternal(filters);
      return extractData<PaginatedResponse<Product>>(response);
    },
  });

  const { data: catData } = useCategories();
  const categories = catData?.data || [];

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset về trang 1 khi lọc
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 50,
    });
  };

  const { createFromContract, updateProduct, deleteProduct } = useProductMutations();
  
  const products = data?.items || [];

  const handleCreateFromContract = async (payload: any) => {
    await createFromContract.mutateAsync(payload);
    setIsContractDialogOpen(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsUpdateOpen(true);
  };

  const handleUpdate = async (payload: any) => {
    if (!editingProduct) return;
    await updateProduct.mutateAsync({ id: editingProduct.id, data: payload });
    setIsUpdateOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Sản phẩm sẽ được chuyển vào mục lưu trữ.')) {
      await deleteProduct.mutateAsync(id);
    }
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
            className="h-9 bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 font-bold border-none"
            onClick={() => setIsContractDialogOpen(true)}
          >
            <FileText className="size-4 mr-2" />
            Niêm yết từ Hợp đồng
          </Button>
        </div>
      </div>

      <ProductFilters
        filters={filters}
        categories={categories}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {/* Main Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-hide">
          <DataTable
            columns={productColumns}
            data={products}
            isLoading={isLoading || isFetching}
            onReload={() => refetch()}
            searchPlaceholder="Tìm kiếm tên sản phẩm, SKU..."
            meta={{
              onEdit: handleEdit,
              onDelete: handleDelete
            }}
          />
        </div>
      </div>



      <CreateProductFromContractDialog
        open={isContractDialogOpen}
        onOpenChange={setIsContractDialogOpen}
        onSubmit={handleCreateFromContract}
        isLoading={createFromContract.isPending}
      />

      {editingProduct && (
        <ProductDialog
          open={isUpdateOpen}
          onOpenChange={setIsUpdateOpen}
          mode="edit"
          product={editingProduct}
          onSubmit={handleUpdate}
          categories={categories}
        />
      )}

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
