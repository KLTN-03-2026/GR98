import { useState } from 'react';
import { PackageSearch, Plus, Coins, Tag, RefreshCcw, FilterX, MoreVertical, Edit2, Trash2, Power } from 'lucide-react';
import {
  usePriceBoards,
  useCreatePriceBoard,
  useUpdatePriceBoard,
  useTogglePriceBoardActive,
  useDeletePriceBoard,
  type PriceBoardResponse,
} from './api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

// Sub-components
import { PriceBoardGradeBadge, PRICE_BOARD_GRADES } from './components/grade-badge';
import { PriceBoardFormDialog } from './components/price-board-form-dialog';
import { DeletePriceBoardDialog } from './components/delete-price-board-dialog';
import { DataTable, DataTableColumnHeader } from '@/components/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

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

  const createMutation = useCreatePriceBoard();
  const updateMutation = useUpdatePriceBoard();
  const toggleMutation = useTogglePriceBoardActive();
  const deleteMutation = useDeletePriceBoard();

  const items = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const columns: ColumnDef<PriceBoardResponse>[] = [
    {
      accessorKey: 'cropType',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Loại nông sản" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Tag className="size-3.5" />
          </div>
          <span className="font-bold text-sm">{row.original.cropType}</span>
        </div>
      ),
    },
    {
      accessorKey: 'grade',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phẩm cấp" />
      ),
      cell: ({ row }) => <PriceBoardGradeBadge grade={row.original.grade} />,
    },
    {
      accessorKey: 'buyPrice',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Giá mua" className="justify-end" />
      ),
      cell: ({ row }) => (
        <div className="text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
          {row.original.buyPrice.toLocaleString('vi-VN')} đ
        </div>
      ),
    },
    {
      accessorKey: 'sellPrice',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Giá bán" className="justify-end" />
      ),
      cell: ({ row }) => (
        <div className="text-right font-bold tabular-nums text-blue-600 dark:text-blue-400">
          {row.original.sellPrice.toLocaleString('vi-VN')} đ
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Trạng thái" />
      ),
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            row.original.isActive 
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300" 
              : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-400"
          )}
        >
          {row.original.isActive ? 'Hoạt động' : 'Tạm dừng'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0 rounded-lg transition-colors hover:bg-muted">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl border-primary/10">
              <DropdownMenuItem 
                onClick={() => setEditItem(row.original)}
                className="gap-2 cursor-pointer"
              >
                <Edit2 className="size-4 text-primary" />
                <span>Chỉnh sửa</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => toggleMutation.mutateAsync(row.original.id)}
                className="gap-2 cursor-pointer"
                disabled={toggleMutation.isPending}
              >
                <Power className={cn("size-4", row.original.isActive ? "text-amber-500" : "text-emerald-500")} />
                <span>{row.original.isActive ? 'Tạm dừng' : 'Kích hoạt'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setDeleteItem(row.original)}
                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4" />
                <span>Xóa bảng giá</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const filterToolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 rounded-xl bg-background p-1 border border-primary/5 shadow-sm">
        <Select value={gradeFilter} onValueChange={(v) => { setGradeFilter(v); setPage(1); }}>
          <SelectTrigger className="h-8 w-[150px] border-none bg-transparent font-medium shadow-none focus:ring-0">
            <SelectValue placeholder="Phẩm cấp" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-primary/10">
            <SelectItem value="all">Tất cả phẩm cấp</SelectItem>
            {PRICE_BOARD_GRADES.map((g) => (
              <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="h-4 w-px bg-muted mx-1" />
        <Select value={isActiveFilter} onValueChange={(v) => { setIsActiveFilter(v); setPage(1); }}>
          <SelectTrigger className="h-8 w-[150px] border-none bg-transparent font-medium shadow-none focus:ring-0">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-primary/10">
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="true">Hoạt động</SelectItem>
            <SelectItem value="false">Tạm dừng</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {(search || gradeFilter !== 'all' || isActiveFilter !== 'all') && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setSearch(''); setGradeFilter('all'); setIsActiveFilter('all'); setPage(1); }}
          className="h-8 rounded-lg px-2 text-muted-foreground"
        >
          <FilterX className="size-3.5 mr-1" />
          Xóa lọc
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto overflow-x-hidden p-6 font-manrope">
      {/* Header Bar */}
      <section className="relative -mx-1 shrink-0 overflow-hidden rounded-[22px] border border-primary/10 bg-[linear-gradient(180deg,rgba(247,251,252,0.92),rgba(244,248,250,0.82))] px-1 py-1.5 shadow-[0_10px_24px_-24px_rgba(16,24,40,0.22)] backdrop-blur-md dark:bg-[linear-gradient(180deg,rgba(13,20,30,0.94),rgba(10,18,26,0.86))]">
        <div className="pointer-events-none absolute inset-x-20 top-0 h-12 rounded-full bg-primary/8 blur-3xl" />

        <div className="relative h-fit shrink-0 rounded-[20px] border border-primary/10 bg-background/72 px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            {/* Title block */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-xl border border-primary/12 bg-primary/8 text-primary">
                  <Coins className="size-3.5" />
                </div>
                <h2 className="font-manrope text-xl font-bold tracking-tight text-foreground">
                  Thiết lập Bảng giá gốc
                </h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Quản lý và điều phối giá mua/bán cho từng loại nông sản
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-8 rounded-full border-primary/12 bg-background/75 px-3 text-[11px]"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCcw className={cn("size-3.5", isFetching && "animate-spin")} />
                Làm mới
              </Button>
              <PriceBoardFormDialog 
                mode="create" 
                onSubmit={async (payload) => { await createMutation.mutateAsync(payload); }}
                isLoading={createMutation.isPending}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="w-full rounded-[24px] border border-border/60 bg-background/50 p-1 shadow-sm backdrop-blur-sm">
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          searchPlaceholder="Tìm loại nông sản..."
          filterToolbar={filterToolbar}
          
          // Server-side pagination
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
          
          noResults={
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted/50 mb-4">
                <PackageSearch className="size-8 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Không tìm thấy dữ liệu bảng giá</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Vui lòng thử điều chỉnh bộ lọc hoặc thêm mới.</p>
            </div>
          }
        />
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
