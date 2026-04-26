import { useMemo, useState } from 'react';
import {
  Plus,
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
  Settings2,
  Search,
  RefreshCcw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGetTransactions } from './api';
import { useGetWarehouses } from '../warehouses/api';
import { format } from 'date-fns';
import CreateTransactionDialog from './components/CreateTransactionDialog';
import { DataTable } from '@/components/data-table/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import type { WarehouseTransaction } from './api/types';
import { cn } from '@/lib/utils';

export default function InventoryTransactionsPage() {
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch data
  const { data: transactions, isLoading, refetch, isRefetching } = useGetTransactions({
    warehouseId: warehouseFilter !== 'all' ? warehouseFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
  });

  const { data: warehouses } = useGetWarehouses();

  const columns = useMemo<ColumnDef<WarehouseTransaction>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Thời gian',
        cell: ({ row }) => (
          <div className="flex flex-col text-xs text-muted-foreground">
            <span className="font-bold text-slate-900">{format(new Date(row.original.createdAt), 'dd/MM/yyyy')}</span>
            <span className="text-[10px] opacity-70 tabular-nums">{format(new Date(row.original.createdAt), 'HH:mm')}</span>
          </div>
        ),
      },
      {
        accessorKey: 'productName',
        header: 'Sản phẩm & Kho',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold text-sm text-slate-900">
              {row.original.product?.name}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1.5 mt-0.5">
              <span className="font-semibold text-emerald-600">{row.original.warehouse?.name}</span>
              <span className="opacity-30">•</span>
              <span>Lô: {row.original.inventoryLotId.slice(-8).toUpperCase()}</span>
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Loại',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            {row.original.type === 'inbound' && (
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100">
                <TrendingUp className="size-3" />
                NHẬP KHO
              </div>
            )}
            {row.original.type === 'outbound' && (
              <div className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-rose-100">
                <TrendingDown className="size-3" />
                XUẤT KHO
              </div>
            )}
            {row.original.type === 'adjustment' && (
              <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-blue-100">
                <Settings2 className="size-3" />
                ĐIỀU CHỈNH
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'quantityKg',
        header: 'Số lượng',
        cell: ({ row }) => (
          <span className={`font-manrope text-sm font-bold tabular-nums ${
            row.original.type === 'inbound' ? 'text-emerald-600' : 
            row.original.type === 'outbound' ? 'text-rose-600' : 'text-slate-900'
          }`}>
            {row.original.type === 'outbound' ? '-' : '+'}{Math.abs(row.original.quantityKg).toLocaleString('vi-VN')} <span className="text-[11px] font-medium opacity-70">kg</span>
          </span>
        ),
      },
      {
        accessorKey: 'note',
        header: 'Ghi chú',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground italic max-w-[150px] truncate block">
            {row.original.note || '—'}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="h-full min-h-0 flex flex-col gap-5 p-4 sm:p-6 font-manrope">
      {/* Header & Filter Card - Admin Style */}
      <Card className="border-dashed border-emerald-400/50 shadow-sm bg-white">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <ArrowLeftRight className="size-4" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Nhật ký Giao dịch
                </h1>
              </div>
              <p className="text-xs text-muted-foreground">
                {isLoading ? 'Đang tải dữ liệu...' : `Hiển thị ${transactions?.length ?? 0} giao dịch gần đây`}
              </p>
            </div>

            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-10 px-6"
            >
              <Plus className="size-4" />
              <span className="font-bold text-sm">Ghi nhận giao dịch</span>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-emerald-100/50">
            <div className="relative group min-w-[240px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-600 transition-colors" />
              <Input
                placeholder="Tìm kiếm giao dịch..."
                className="h-10 rounded-full border-slate-200 pl-9 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
              />
            </div>

            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger className="h-10 w-[200px] rounded-full border-slate-200 bg-white">
                <SelectValue placeholder="Tất cả kho" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Tất cả kho</SelectItem>
                {warehouses?.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-10 w-[180px] rounded-full border-slate-200 bg-white">
                <SelectValue placeholder="Loại giao dịch" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="inbound">Nhập kho</SelectItem>
                <SelectItem value="outbound">Xuất kho</SelectItem>
                <SelectItem value="adjustment">Điều chỉnh</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-full border-slate-200"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCcw className={cn("size-4", isRefetching && "animate-spin")} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DataTable Container */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <DataTable
          columns={columns}
          data={transactions ?? []}
          isLoading={isLoading}
          hiddenSearch={true} // Already have custom search in header card
          className="h-full flex flex-col"
          tableClassName="rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        />
      </div>

      <CreateTransactionDialog 
        isOpen={isCreateDialogOpen} 
        onClose={() => setIsCreateDialogOpen(false)} 
      />
    </div>
  );
}
