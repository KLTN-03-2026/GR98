import { useState } from 'react';
import { PackageSearch, Plus, Coins, Tag, RefreshCcw, FilterX, MoreVertical, Edit2, Trash2, Power, Search } from 'lucide-react';
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
      header: 'Loại nông sản',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <Tag className="size-3.5" />
          </div>
          <span className="font-bold text-sm text-slate-900">{row.original.cropType}</span>
        </div>
      ),
    },
    {
      accessorKey: 'grade',
      header: 'Phẩm cấp',
      cell: ({ row }) => <PriceBoardGradeBadge grade={row.original.grade} />,
    },
    {
      accessorKey: 'buyPrice',
      header: 'Giá mua',
      cell: ({ row }) => (
        <div className="text-right font-bold tabular-nums text-emerald-600">
          {row.original.buyPrice.toLocaleString('vi-VN')} đ
        </div>
      ),
    },
    {
      accessorKey: 'sellPrice',
      header: 'Giá bán',
      cell: ({ row }) => (
        <div className="text-right font-bold tabular-nums text-blue-600">
          {row.original.sellPrice.toLocaleString('vi-VN')} đ
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Trạng thái',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            row.original.isActive 
              ? "border-emerald-200 bg-emerald-50 text-emerald-700" 
              : "border-slate-200 bg-slate-50 text-slate-500"
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
              <Button variant="ghost" className="size-8 p-0 rounded-lg transition-colors hover:bg-slate-100">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-200">
              <DropdownMenuItem 
                onClick={() => setEditItem(row.original)}
                className="gap-2 cursor-pointer"
              >
                <Edit2 className="size-4 text-emerald-600" />
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
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative group flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-600 transition-colors" />
        <Input
          placeholder="Tìm loại nông sản..."
          className="h-9 rounded-full border-slate-200 pl-9 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <Select value={gradeFilter} onValueChange={(v) => { setGradeFilter(v); setPage(1); }}>
        <SelectTrigger className="h-9 w-[160px] rounded-full border-slate-200 bg-white">
          <SelectValue placeholder="Phẩm cấp" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="all">Tất cả phẩm cấp</SelectItem>
          {PRICE_BOARD_GRADES.map((g) => (
            <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={isActiveFilter} onValueChange={(v) => { setIsActiveFilter(v); setPage(1); }}>
        <SelectTrigger className="h-9 w-[160px] rounded-full border-slate-200 bg-white">
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="all">Tất cả trạng thái</SelectItem>
          <SelectItem value="true">Hoạt động</SelectItem>
          <SelectItem value="false">Tạm dừng</SelectItem>
        </SelectContent>
      </Select>

      {(search || gradeFilter !== 'all' || isActiveFilter !== 'all') && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setSearch(''); setGradeFilter('all'); setIsActiveFilter('all'); setPage(1); }}
          className="h-9 rounded-full px-3 text-muted-foreground hover:bg-slate-100"
        >
          <FilterX className="size-3.5 mr-1" />
          Xóa lọc
        </Button>
      )}
    </div>
  );

  return (
    <div className="h-full min-h-0 flex flex-col gap-5 p-4 sm:p-6 font-manrope">
      {/* Header Card - Admin Style */}
      <Card className="border-dashed border-emerald-400/50 bg-white">
        <CardContent className="p-4 sm:p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <Coins className="size-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Thiết lập Bảng giá gốc
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Quản lý và điều phối giá mua/bán nông sản
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-full border-slate-200"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCcw className={cn("size-4", isFetching && "animate-spin")} />
            </Button>
            <PriceBoardFormDialog 
              mode="create" 
              onSubmit={async (payload) => { await createMutation.mutateAsync(payload); }}
              isLoading={createMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* DataTable Container */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          filterToolbar={filterToolbar}
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
          tableClassName="rounded-xl border border-slate-200 shadow-sm overflow-hidden"
          noResults={
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <PackageSearch className="size-10 text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-600">Không tìm thấy bảng giá</p>
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
