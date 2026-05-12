import { useState } from 'react';
import { Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { Card, CardContent } from '@/components/ui/card';
import { inventoryProductApi } from './api/product-api';
import { productColumns } from './components/product-columns';
import { extractData } from '@/client/lib/api-client';
import { ProductFilters } from './components/ProductFilters';
import type { Product, PaginatedResponse } from '@/client/types';
import type { ProductQueryParams } from './api/product-api';

import { ProductDetailsDialog } from './components/ProductDetailsDialog';
import { useProductMutations } from './api/use-product-mutations';
import { useCategories } from '@/client/api/categories/use-categories';

export default function ProductsManagementPage() {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
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

  const { data: fullProduct } = useQuery({
    queryKey: ['product', viewingProduct?.id],
    queryFn: async () => {
      if (!viewingProduct?.id) return null;
      const response = await inventoryProductApi.getOne(viewingProduct.id);
      return extractData<any>(response);
    },
    enabled: !!viewingProduct?.id && isDetailsOpen,
  });

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

  const { updateProduct, deleteProduct } = useProductMutations();
  
  const products = data?.items || [];

  const handleEdit = (product: Product) => {
    setViewingProduct(product);
    setIsDetailsOpen(true);
    // Lưu ý: Bây giờ handleEdit sẽ mở Details và Details sẽ có nút chuyển sang Edit
  };

  const handleView = (product: Product) => {
    setViewingProduct(product);
    setIsDetailsOpen(true);
  };

  const handleUpdate = async (payload: any) => {
    if (!viewingProduct) return;
    await updateProduct.mutateAsync({ id: viewingProduct.id, data: payload });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Sản phẩm sẽ được chuyển vào mục lưu trữ.')) {
      await deleteProduct.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/8 text-primary">
              <Package className="size-4" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Quản lý Sản phẩm
            </h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Quản lý danh sách nông sản niêm yết trên hệ thống thương mại điện tử.
          </p>
        </div>

      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={productColumns}
            data={products}
            isLoading={isLoading || isFetching}
            onReload={() => refetch()}
            onRowClick={handleView}
            hiddenSearch={true}
            filterToolbar={
              <ProductFilters
                filters={filters}
                categories={categories}
                onFilterChange={handleFilterChange}
                onClear={handleClearFilters}
              />
            }
            meta={{
              onView: handleView,
              onEdit: handleEdit,
              onDelete: handleDelete
            }}
          />
        </CardContent>
      </Card>

      <ProductDetailsDialog 
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        product={fullProduct || viewingProduct}
        categories={categories}
        onUpdate={handleUpdate}
        isUpdating={updateProduct.isPending}
      />
    </div>
  );
}
