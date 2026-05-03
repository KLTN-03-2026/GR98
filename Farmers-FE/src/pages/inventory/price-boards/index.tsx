import { useState } from 'react';
import { PackageSearch, Coins, Tag, RefreshCcw, FilterX, MoreVertical, Edit2, Trash2, Power, Search } from 'lucide-react';
import {
  usePriceBoards,
  useUpdatePriceBoard,
  useTogglePriceBoardActive,
  useDeletePriceBoard,
  type PriceBoardResponse,
} from './api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';

// Sub-components
import { PriceBoardGradeBadge, PRICE_BOARD_GRADES } from './components/grade-badge';
import { PriceBoardFormDialog } from './components/price-board-form-dialog';
import { DeletePriceBoardDialog } from './components/delete-price-board-dialog';
import { DataTable } from '@/components/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

import { PriceBoardHeader } from './components/PriceBoardHeader';

export default function PriceBoardsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');

  // Dialog states
  const [editItem, setEditItem] = useState<PriceBoardResponse | null>(null);
  const [deleteItem, setDeleteItem] = useState<PriceBoardResponse | null>(null);

  const { data, isLoading, isFetching, refetch } = usePriceBoards({
    page,
    limit,
    cropType: search || undefined,
    grade: (gradeFilter === 'all' ? undefined : gradeFilter) || undefined,
    isActive: (isActiveFilter === 'all' ? undefined : isActiveFilter) || undefined,
  });

  const updateMutation = useUpdatePriceBoard();
  const toggleMutation = useTogglePriceBoardActive();
  const deleteMutation = useDeletePriceBoard();

  const items = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const columns: ColumnDef<PriceBoardResponse>[] = [
    {
      accessorKey: 'cropType',
      header: () => <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400">Loại nông sản</span>,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <Tag className="size-3.5" />
          </div>
          <span className="font-bold text-sm text-slate-900 line-clamp-1">{row.original.cropType}</span>
        </div>
      ),
    },
    {
      accessorKey: 'grade',
      header: () => <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400">Phẩm cấp</span>,
      cell: ({ row }) => <PriceBoardGradeBadge grade={row.original.grade} />,
    },
    {
      accessorKey: 'buyPrice',
      header: () => <div className="text-right text-[10px] font-bold uppercase tracking-tight text-slate-400">Giá mua</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold tabular-nums text-emerald-600">
          {row.original.buyPrice.toLocaleString('vi-VN')} đ
        </div>
      ),
    },
    {
      accessorKey: 'sellPrice',
      header: () => <div className="text-right text-[10px] font-bold uppercase tracking-tight text-slate-400">Giá bán</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold tabular-nums text-blue-600">
          {row.original.sellPrice.toLocaleString('vi-VN')} đ
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: () => <div className="text-center text-[10px] font-bold uppercase tracking-tight text-slate-400">Trạng thái</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge
            variant="outline"
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-none border-none",
              row.original.isActive 
                ? "bg-emerald-500/10 text-emerald-700" 
                : "bg-slate-100 text-slate-400"
            )}
          >
            {row.original.isActive ? 'Hoạt động' : 'Tạm dừng'}
          </Badge>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0 rounded-full transition-all hover:bg-slate-100 hover:shadow-sm">
                <MoreVertical className="size-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-200 shadow-xl p-1">
              <DropdownMenuItem 
                onClick={() => setEditItem(row.original)}
                className="gap-2.5 cursor-pointer rounded-lg py-2 font-bold text-xs"
              >
                <Edit2 className="size-3.5 text-emerald-600" />
                <span>Chỉnh sửa bảng giá</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => toggleMutation.mutateAsync(row.original.id)}
                className="gap-2.5 cursor-pointer rounded-lg py-2 font-bold text-xs"
                disabled={toggleMutation.isPending}
              >
                <Power className={cn("size-3.5", row.original.isActive ? "text-amber-500" : "text-emerald-500")} />
                <span>{row.original.isActive ? 'Tạm dừng hoạt động' : 'Kích hoạt hoạt động'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setDeleteItem(row.original)}
                className="gap-2.5 cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 rounded-lg py-2 font-bold text-xs"
              >
                <Trash2 className="size-3.5" />
                <span>Xóa bảng giá này</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full min-h-0 flex flex-col gap-6 p-6 font-manrope bg-slate-50/20">
      <PriceBoardHeader 
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        gradeFilter={gradeFilter}
        onGradeFilterChange={(v) => { setGradeFilter(v); setPage(1); }}
        isActiveFilter={isActiveFilter}
        onIsActiveFilterChange={(v) => { setIsActiveFilter(v); setPage(1); }}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      {/* DataTable Container */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          manualPagination
          pageCount={totalPages}
          totalItems={total}
          onPaginationChange={(updater) => {
            const next = typeof updater === 'function' ? updater({ pageIndex: page - 1, pageSize: limit }) : updater;
            setPage(next.pageIndex + 1);
            setLimit(next.pageSize);
          }}
          state={{ pagination: { pageIndex: page - 1, pageSize: limit } }}
          pageSizeOptions={[10, 15, 20, 30, 50]}
          className="h-full flex flex-col"
          tableClassName="rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden bg-white"
          noResults={
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 rounded-full bg-slate-50 p-6 border border-dashed border-slate-200">
                <PackageSearch className="size-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Không tìm thấy bảng giá</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto leading-relaxed">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để tìm bảng giá phù hợp.
              </p>
            </div>
          }
        />
      </div>

      {/* Dialogs */}
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
