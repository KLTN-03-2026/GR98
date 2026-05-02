import React, { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Settings2
} from 'lucide-react';
import type { WarehouseTransaction } from '../api/types';

interface TransactionTableProps {
  data: WarehouseTransaction[];
  isLoading: boolean;
}

const TYPE_CONFIG = {
  inbound: { label: 'Nhập kho', color: 'success', icon: ArrowDownLeft },
  outbound: { label: 'Xuất kho', color: 'destructive', icon: ArrowUpRight },
  adjustment: { label: 'Điều chỉnh', color: 'warning', icon: Settings2 },
};

export function TransactionTable({ data, isLoading }: TransactionTableProps) {
  const columns = useMemo<ColumnDef<WarehouseTransaction>[]>(() => [
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Thời gian" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {format(new Date(row.original.createdAt), 'dd/MM/yyyy', { locale: vi })}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(row.original.createdAt), 'HH:mm')}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Loại giao dịch" />
      ),
      cell: ({ row }) => {
        const type = row.original.type;
        const config = TYPE_CONFIG[type] || { label: type, color: 'outline', icon: Settings2 };
        const Icon = config.icon;
        
        return (
          <Badge variant={config.color as any} className="gap-1 px-2 py-0.5 font-normal">
            <Icon className="size-3" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'product.name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sản phẩm" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{row.original.product.name}</span>
          <span className="text-xs text-muted-foreground uppercase">{row.original.product.sku}</span>
        </div>
      ),
    },
    {
      accessorKey: 'quantityKg',
      header: ({ column }) => (
        <div className="flex justify-end w-full">
          <DataTableColumnHeader column={column} title="Số lượng" />
        </div>
      ),
      cell: ({ row }) => {
        const type = row.original.type;
        const isNegative = type === 'outbound';
        return (
          <div className={`text-right font-medium tabular-nums ${isNegative ? 'text-destructive' : 'text-emerald-600'}`}>
            {isNegative ? '-' : '+'}{row.original.quantityKg.toLocaleString('vi-VN')} {row.original.product.unit}
          </div>
        );
      },
    },
    {
      accessorKey: 'warehouse.name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Kho thực hiện" />
      ),
    },
    {
      accessorKey: 'note',
      header: "Ghi chú",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
          {row.original.note || '-'}
        </span>
      ),
    },
  ], []);

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      hiddenSearch={true}
    />
  );
}
