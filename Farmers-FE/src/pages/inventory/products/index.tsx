import { useState } from 'react';
import { FilterX } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { inventoryProductApi } from './api/product-api';
import { useProductMutations } from './api/use-product-mutations';
import { useCategories } from '@/client/api/categories/use-categories';
import {
  type Product,
  type ProductStatus,
} from '@/client/types';

import { ProductHeader } from './components/ProductHeader';
import { ProductTable } from './components/ProductTable';
import { ProductDialog } from './components/ProductDialog';

export default function ProductsManagementPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProductStatus | 'ALL'>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<Product | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['products', 'management', search, status],
    queryFn: () => inventoryProductApi.listInternal({
      search: search || undefined,
      status: status === 'ALL' ? undefined : status,
    }),
  });

  const { data: catData } = useCategories();
  const categories = catData?.data || [];
  const products = data?.data?.items || [];

  const { createProduct, updateProduct, deleteProduct } = useProductMutations();

  const handleOpenCreate = () => {
    setMode('create');
    setSelected(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setMode('edit');
    setSelected(product);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn gỡ sản phẩm này khỏi sàn?')) {
      deleteProduct.mutate(id);
    }
  };

  const handleSubmit = (formData: any) => {
    if (mode === 'create') {
      createProduct.mutate(formData, {
        onSuccess: () => setDialogOpen(false),
      });
    } else if (selected) {
      updateProduct.mutate(
        { id: selected.id, data: formData },
        { onSuccess: () => setDialogOpen(false) }
      );
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-6 p-6 font-manrope bg-slate-50/20">
      {/* Header & Filters */}
      <ProductHeader 
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        onOpenCreate={handleOpenCreate}
        onRefresh={() => refetch()}
        isRefreshing={isRefetching}
      />

      {/* Info Bar & Active Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 rounded-full border border-emerald-100 shadow-sm">
            <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-600 font-black px-1.5 h-5 rounded-md min-w-[24px] justify-center text-[10px]">
              {data?.data?.total || 0}
            </Badge>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Sản phẩm niêm yết</span>
          </div>
          
          {(search || status !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatus('ALL');
              }}
              className="h-8 rounded-full px-4 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all text-[10px] font-bold uppercase tracking-tight"
            >
              <FilterX className="size-3.5 mr-1.5" />
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </div>

      {/* Main Table Content */}
      <ProductTable 
        products={products}
        isLoading={isLoading}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        onOpenCreate={handleOpenCreate}
      />

      {/* Create/Edit Dialog */}
      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        product={selected ?? undefined}
        onSubmit={handleSubmit}
        categories={categories}
      />
    </div>
  );
}
