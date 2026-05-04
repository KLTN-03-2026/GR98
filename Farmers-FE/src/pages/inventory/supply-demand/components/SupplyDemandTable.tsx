import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent } from '@/components/ui/card';
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
        <span className="font-medium text-sm text-slate-900">
          {row.original.cropType}
        </span>
      ),
    },
    {
      accessorKey: 'expectedKg',
      header: () => <div className="text-right w-full">Dự kiến (kg)</div>,
      cell: ({ row }) => (
        <div className="text-right text-sm tabular-nums text-slate-600">
          {(row.original.expectedKg ?? 0).toLocaleString('vi-VN')}
        </div>
      ),
    },
    {
      accessorKey: 'actualStockKg',
      header: () => <div className="text-right w-full">Thực tồn (kg)</div>,
      cell: ({ row }) => (
        <div className="text-right text-sm font-medium text-slate-900 tabular-nums">
          {(row.original.actualStockKg ?? 0).toLocaleString('vi-VN')}
        </div>
      ),
    },
    {
      accessorKey: 'pendingOrderKg',
      header: () => <div className="text-right w-full">Nhu cầu (kg)</div>,
      cell: ({ row }) => (
        <div className="text-right text-sm tabular-nums text-rose-600 font-medium">
          {(row.original.pendingOrderKg ?? 0).toLocaleString('vi-VN')}
        </div>
      ),
    },
    {
      id: 'balance',
      header: () => <div className="text-right w-full">Cán cân</div>,
      cell: ({ row }) => {
        const balance = (row.original.actualStockKg ?? 0) - (row.original.pendingOrderKg ?? 0);
        return (
          <div className="flex justify-end">
            <Badge
              variant={balance >= 0 ? 'default' : 'destructive'}
              className="font-bold tabular-nums text-[10px] px-2 py-0"
            >
              {balance >= 0 ? '+' : ''}
              {balance.toLocaleString('vi-VN')}
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
          enableSorting={false}
        />
      </CardContent>
    </Card>
  );
}
