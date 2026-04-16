import { useState } from 'react';
import { PackageSearch } from 'lucide-react';
import {
  usePriceBoards,
  useCreatePriceBoard,
  useUpdatePriceBoard,
  useTogglePriceBoardActive,
  useDeletePriceBoard,
  type PriceBoardResponse,
} from './api';
import { Skeleton } from '@/components/ui/skeleton';

// Sub-components
import { PriceBoardTable } from './components/price-board-table';
import { PriceBoardFilters } from './components/price-board-filters';
import { PriceBoardFormDialog } from './components/price-board-form-dialog';
import { DeletePriceBoardDialog } from './components/delete-price-board-dialog';
import { Button } from '@/components/ui/button';

export default function PriceBoardsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');

  // Dialog states
  const [editItem, setEditItem] = useState<PriceBoardResponse | null>(null);
  const [deleteItem, setDeleteItem] = useState<PriceBoardResponse | null>(null);

  const { data, isLoading, isFetching } = usePriceBoards({
    page,
    limit: 20,
    cropType: search || undefined,
    grade: (gradeFilter === 'all' ? undefined : gradeFilter) || undefined,
    isActive: (isActiveFilter === 'all' ? undefined : isActiveFilter) || undefined,
  });

  const createMutation = useCreatePriceBoard();
  const updateMutation = useUpdatePriceBoard();
  const toggleMutation = useTogglePriceBoardActive();
  const deleteMutation = useDeletePriceBoard();

  const items = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-50/30">
      {/* Header chuẩn */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Thiết lập Bảng giá gốc</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Quản lý và điều phối giá mua/bán cho từng loại nông sản và phẩm cấp.
          </p>
        </div>
        <PriceBoardFormDialog 
          mode="create" 
          onSubmit={async (payload) => { await createMutation.mutateAsync(payload); }}
          isLoading={createMutation.isPending}
        />
      </div>

      {/* Bộ lọc chuẩn */}
      <PriceBoardFilters 
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        gradeFilter={gradeFilter}
        onGradeFilterChange={(v) => { setGradeFilter(v); setPage(1); }}
        isActiveFilter={isActiveFilter}
        onIsActiveFilterChange={(v) => { setIsActiveFilter(v); setPage(1); }}
        onClear={() => { setSearch(''); setGradeFilter(''); setIsActiveFilter(''); setPage(1); }}
      />

      {/* Nội dung dữ liệu */}
      <div className="w-full">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white border border-dashed rounded-lg space-y-4">
            <PackageSearch className="size-12 text-slate-200" />
            <div className="text-center">
              <p className="text-slate-500 font-medium">Không tìm thấy dữ liệu bảng giá</p>
              <p className="text-sm text-slate-400">Vui lòng thử điều chỉnh bộ lọc hoặc thêm mới.</p>
            </div>
          </div>
        ) : (
          <PriceBoardTable 
            items={items}
            onToggleActive={(id) => toggleMutation.mutateAsync(id)}
            isToggling={toggleMutation.isPending}
            onEdit={(item) => setEditItem(item)}
            onDelete={(item) => setDeleteItem(item)}
          />
        )}

        {/* Phân trang chuẩn */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between py-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Hiển thị {items.length} / {total} bản ghi
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1 || isFetching}
              >
                Trước
              </Button>
              <div className="flex items-center justify-center w-10 h-8 text-sm font-medium border rounded bg-white">
                {page}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages || isFetching}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs duy trì trạng thái */}
      <PriceBoardFormDialog 
        mode="edit" 
        initial={editItem || undefined}
        open={!!editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
        onSubmit={async (payload) => { 
          if (editItem) {
            await updateMutation.mutateAsync({ id: editItem.id, data: payload });
            setEditItem(null);
          }
        }}
        isLoading={updateMutation.isPending}
      />

      <DeletePriceBoardDialog 
        item={deleteItem}
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        onConfirm={async () => {
          if (deleteItem) {
            await deleteMutation.mutateAsync(deleteItem.id);
            setDeleteItem(null);
          }
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
