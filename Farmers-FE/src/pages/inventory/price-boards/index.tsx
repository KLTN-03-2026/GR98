import { useState, useMemo } from 'react';
import { 
    PackageSearch, 
    Coins, 
    Tag, 
    RefreshCw, 
    FilterX, 
    MoreVertical, 
    Edit2, 
    Trash2, 
    Power, 
    Search,
    Plus,
    X
} from 'lucide-react';
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
import { Label } from '@/components/ui/label';

// Sub-components
import { PriceBoardGradeBadge, PRICE_BOARD_GRADES } from './components/grade-badge';
import { PriceBoardFormDialog } from './components/price-board-form-dialog';
import { DeletePriceBoardDialog } from './components/delete-price-board-dialog';
import { DataTable } from '@/components/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

export default function PriceBoardsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');

  const [isAddOpen, setIsAddOpen] = useState(false);
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

  const columns = useMemo<ColumnDef<PriceBoardResponse>[]>(() => [
    {
      accessorKey: 'cropType',
      header: 'Loại nông sản',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/8 text-primary">
            <Tag className="size-4" />
          </div>
          <span className="font-semibold text-sm text-slate-900">{row.original.cropType}</span>
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
      header: () => <div className="text-right w-full">Giá mua đề xuất</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold tabular-nums text-emerald-600">
          {row.original.buyPrice.toLocaleString('vi-VN')} đ
        </div>
      ),
    },
    {
      accessorKey: 'sellPrice',
      header: () => <div className="text-right w-full">Giá bán niêm yết</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold tabular-nums text-primary">
          {row.original.sellPrice.toLocaleString('vi-VN')} đ
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: () => <div className="text-center w-full">Trạng thái</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge
            variant="outline"
            className={cn(
              "rounded-lg border-transparent font-bold uppercase text-[9px] tracking-widest px-2 py-0.5",
              row.original.isActive 
                ? "bg-emerald-50 text-emerald-700" 
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
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0 rounded-lg hover:bg-slate-100">
                <MoreVertical className="size-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-200 shadow-xl p-1">
              <DropdownMenuItem 
                onClick={() => setEditItem(row.original)}
                className="gap-2.5 cursor-pointer rounded-lg py-2 font-semibold text-xs"
              >
                <Edit2 className="size-3.5 text-blue-600" />
                <span>Chỉnh sửa bảng giá</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => toggleMutation.mutateAsync(row.original.id)}
                className="gap-2.5 cursor-pointer rounded-lg py-2 font-semibold text-xs"
                disabled={toggleMutation.isPending}
              >
                <Power className={cn("size-3.5", row.original.isActive ? "text-amber-500" : "text-emerald-500")} />
                <span>{row.original.isActive ? 'Tạm dừng hoạt động' : 'Kích hoạt hoạt động'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setDeleteItem(row.original)}
                className="gap-2.5 cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 rounded-lg py-2 font-semibold text-xs"
              >
                <Trash2 className="size-3.5" />
                <span>Xóa bảng giá</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [toggleMutation]);

  const filterToolbar = (
    <div className="flex flex-wrap items-end gap-3 w-full">
      <div className="space-y-1.5 min-w-[240px] flex-1 max-w-sm">
        <Label className="text-xs font-medium">Loại nông sản</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên..."
            className="pl-8 h-9 rounded-md text-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="space-y-1.5 min-w-[150px]">
        <Label className="text-xs font-medium">Phẩm cấp</Label>
        <Select value={gradeFilter} onValueChange={(v) => { setGradeFilter(v); setPage(1); }}>
          <SelectTrigger className="h-9 rounded-md text-xs">
            <SelectValue placeholder="Tất cả phẩm cấp" />
          </SelectTrigger>
          <SelectContent className="rounded-md">
            <SelectItem value="all">Tất cả phẩm cấp</SelectItem>
            {PRICE_BOARD_GRADES.map((g) => (
              <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 min-w-[150px]">
        <Label className="text-xs font-medium">Trạng thái</Label>
        <Select value={isActiveFilter} onValueChange={(v) => { setIsActiveFilter(v); setPage(1); }}>
          <SelectTrigger className="h-9 rounded-md text-xs">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent className="rounded-md">
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
          className="h-9 px-3 text-xs text-muted-foreground hover:text-rose-600"
          onClick={() => {
            setSearch('');
            setGradeFilter('all');
            setIsActiveFilter('all');
            setPage(1);
          }}
        >
          <X className="mr-2 h-4 w-4" />
          Xóa lọc
        </Button>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto font-manrope animate-in fade-in duration-500">
      {/* Header Section - Admin Style */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/8 text-primary">
                    <Coins className="size-4" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    Bảng giá Nông sản
                </h1>
            </div>
            <p className="text-sm text-muted-foreground">
                Quản lý và điều phối giá mua/bán nông sản niêm yết trên hệ thống.
            </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-9 rounded-xl border-slate-200"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn("size-4 text-slate-400", isFetching && "animate-spin")} />
          </Button>
          <Button
            size="sm"
            className="h-9 rounded-xl px-4 font-bold"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="size-4 mr-2" />
            Tạo bảng giá
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={items}
            isLoading={isLoading || isFetching}
            onReload={() => refetch()}
            hiddenSearch
            enableSorting={false}
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
            filterToolbar={filterToolbar}
            noResults={<span className="text-muted-foreground">Không tìm thấy dữ liệu bảng giá phù hợp.</span>}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <PriceBoardFormDialog 
        mode="create"
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSubmit={async (payload) => {
            // Logic for creation
            console.log('Create price board', payload);
            setIsAddOpen(false);
        }}
      />

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
