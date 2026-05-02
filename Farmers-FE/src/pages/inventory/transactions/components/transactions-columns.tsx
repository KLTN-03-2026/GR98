import type { ColumnDef } from '@tanstack/react-table';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Settings2 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/data-table';
import type { WarehouseTransaction } from '../api/types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const createTransactionColumns = () => {
  const columns: ColumnDef<WarehouseTransaction>[] = [
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Thời gian" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
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
        switch (type) {
          case 'inbound':
            return (
              <Badge variant="success" className="gap-1 px-2 py-0.5 font-medium">
                <ArrowDownLeft className="size-3" />
                Nhập kho
              </Badge>
            );
          case 'outbound':
            return (
              <Badge variant="destructive" className="gap-1 px-2 py-0.5 font-medium">
                <ArrowUpRight className="size-3" />
                Xuất kho
              </Badge>
            );
          case 'adjustment':
            return (
              <Badge variant="warning" className="gap-1 px-2 py-0.5 font-medium">
                <Settings2 className="size-3" />
                Điều chỉnh
              </Badge>
            );
          default:
            return <Badge variant="outline">{type}</Badge>;
        }
      },
    },
    {
      id: 'product',
      header: 'Sản phẩm',
      accessorFn: (row) => `${row.product.name} ${row.product.sku}`,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.original.product.name}</span>
          <span className="text-xs text-muted-foreground uppercase">{row.original.product.sku}</span>
        </div>
      ),
    },
    {
      accessorKey: 'quantityKg',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Số lượng" className="justify-end" />
      ),
      cell: ({ row }) => {
        const type = row.original.type;
        const isNegative = type === 'outbound';
        return (
          <div className={`text-right font-semibold tabular-nums ${isNegative ? 'text-destructive' : 'text-emerald-600'}`}>
            {isNegative ? '-' : '+'}{row.original.quantityKg.toLocaleString('vi-VN')} {row.original.product.unit}
          </div>
        );
      },
    },
    {
      id: 'warehouse',
      header: 'Kho thực hiện',
      accessorFn: (row) => row.warehouse.name,
      cell: ({ row }) => (
        <span className="text-sm">{row.original.warehouse.name}</span>
      ),
    },
    {
      id: 'actor',
      header: 'Người tạo',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.actor?.fullName || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'note',
      header: "Ghi chú",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground truncate max-w-[200px] block" title={row.original.note || ''}>
          {row.original.note || '—'}
        </span>
      ),
    },
  ];
  return columns;
};
