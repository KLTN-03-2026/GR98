import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SupplyDemandItem } from '../api/types';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';

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
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Mặt hàng" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {row.original.cropType}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">Nông sản</span>
        </div>
      ),
    },
    {
      accessorKey: 'expectedKg',
      header: ({ column }) => (
        <div className="flex justify-end w-full">
          <DataTableColumnHeader column={column} title="Sản lượng dự kiến" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right text-sm tabular-nums">
          {(row.original.expectedKg ?? 0).toLocaleString('vi-VN')} kg
        </div>
      ),
    },
    {
      accessorKey: 'actualStockKg',
      header: ({ column }) => (
        <div className="flex justify-end w-full">
          <DataTableColumnHeader column={column} title="Tồn kho thực tế" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium text-sm tabular-nums">
          {(row.original.actualStockKg ?? 0).toLocaleString('vi-VN')} kg
        </div>
      ),
    },
    {
      accessorKey: 'pendingOrderKg',
      header: ({ column }) => (
        <div className="flex justify-end w-full">
          <DataTableColumnHeader column={column} title="Nhu cầu (Đơn hàng)" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right text-sm tabular-nums">
          {(row.original.pendingOrderKg ?? 0).toLocaleString('vi-VN')} kg
        </div>
      ),
    },
    {
      id: 'balance',
      header: ({ column }) => (
        <div className="flex justify-end w-full">
          <DataTableColumnHeader column={column} title="Cán cân dự phòng" />
        </div>
      ),
      cell: ({ row }) => {
        const balance = (row.original.actualStockKg ?? 0) - (row.original.pendingOrderKg ?? 0);
        return (
          <div className="text-right">
            <Badge
              variant={balance >= 0 ? 'success' : 'destructive'}
            >
              {balance >= 0 ? '+' : ''}
              {balance.toLocaleString('vi-VN')} kg
            </Badge>
          </div>
        );
      },
    },
  ], []);

  return (
    <Card>
      <CardContent className="pt-6">
        <DataTable
          columns={columns}
          data={items ?? []}
          isLoading={isLoading}
          onReload={onReload}
          hiddenSearch={true}
          filterToolbar={filterToolbar}
          enableCheckbox={false}
          enableSorting={true}
        />
      </CardContent>
    </Card>
  );
}
