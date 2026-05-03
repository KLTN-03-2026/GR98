import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SupplyDemandItem } from '../api/types';
import { DataTable } from '@/components/data-table/data-table';

interface SupplyDemandTableProps {
  items: SupplyDemandItem[] | undefined;
  isLoading: boolean;
  onReload?: () => void;
  filterToolbar?: React.ReactNode;
}

export function SupplyDemandTable({ 
  items, 
  isLoading,
  onReload,
  filterToolbar,
}: SupplyDemandTableProps) {
  
  const columns = useMemo<ColumnDef<SupplyDemandItem>[]>(() => [
    {
      accessorKey: 'cropType',
      header: 'Mặt hàng',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm text-slate-900">
            {row.original.cropType}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nông sản</span>
        </div>
      ),
    },
    {
      accessorKey: 'expectedKg',
      header: 'Dự kiến (kg)',
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {(row.original.expectedKg ?? 0).toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      accessorKey: 'actualStockKg',
      header: 'Thực tồn (kg)',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-slate-900 tabular-nums">
          {(row.original.actualStockKg ?? 0).toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      accessorKey: 'pendingOrderKg',
      header: 'Nhu cầu (kg)',
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-rose-600 font-medium">
          {(row.original.pendingOrderKg ?? 0).toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      id: 'balance',
      header: 'Cán cân dự phòng',
      cell: ({ row }) => {
        const balance = (row.original.actualStockKg ?? 0) - (row.original.pendingOrderKg ?? 0);
        return (
          <Badge
            variant={balance >= 0 ? 'default' : 'destructive'}
            className="font-bold tabular-nums"
          >
            {balance >= 0 ? '+' : ''}
            {balance.toLocaleString('vi-VN')} kg
          </Badge>
        );
      },
    },
  ], []);

  return (
    <Card className="border-border/60 shadow-xs overflow-hidden">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/50">
        <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">Dữ liệu chi tiết theo mặt hàng</CardTitle>
        <p className="text-xs text-muted-foreground font-medium italic">So sánh đối chiếu số liệu tồn kho thực tế và đơn hàng thị trường.</p>
      </CardHeader>
      <CardContent className="p-0">
        <DataTable
          columns={columns}
          data={items ?? []}
          isLoading={isLoading}
          onReload={onReload}
          hiddenSearch={true}
          filterToolbar={filterToolbar}
          enableCheckbox={false}
          enableSorting={false}
          className="border-none"
          tableClassName="border-x-0 border-b-0 rounded-none"
          noResults={<span className="text-muted-foreground">Chưa có dữ liệu phân tích phù hợp.</span>}
        />
      </CardContent>
    </Card>
  );
}
