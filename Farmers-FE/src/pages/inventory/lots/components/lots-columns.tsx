import type { ColumnDef } from '@tanstack/react-table';
import { Eye, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/data-table';
import type { InventoryLot } from '../api/types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export function createLotColumns(handlers: {
  onViewDetail: (lot: InventoryLot) => void;
}) {
  const columns: ColumnDef<InventoryLot>[] = [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Mã Lô" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.id.slice(-6).toUpperCase()}
        </span>
      ),
    },
    {
      id: 'product',
      header: 'Sản phẩm',
      accessorFn: (row) => `${row.product.name} ${row.product.sku}`,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.product.name}</div>
          <div className="text-sm text-muted-foreground">{row.original.product.sku}</div>
        </div>
      ),
    },
    {
      accessorKey: 'qualityGrade',
      header: 'Phẩm cấp',
      enableSorting: false,
      cell: ({ row }) => {
        const grade = row.original.qualityGrade;
        if (grade === 'REJECT') {
          return <Badge variant="destructive">Reject</Badge>;
        }
        return (
          <Badge variant={grade === 'A' ? 'success' : grade === 'B' ? 'outline' : 'secondary'}>
            Loại {grade}
          </Badge>
        );
      },
    },
    {
      id: 'status',
      header: 'Trạng thái',
      enableSorting: false,
      cell: ({ row }) => {
        const { isUpcoming, isExpired, isExpiringSoon } = row.original;
        if (isUpcoming) {
          return <Badge variant="secondary">Dự kiến</Badge>;
        }
        if (isExpired) {
          return <Badge variant="destructive">Hết hạn</Badge>;
        }
        if (isExpiringSoon) {
          return <Badge variant="warning">Sắp hết hạn</Badge>;
        }
        return <Badge variant="success">Trong kho</Badge>;
      },
    },
    {
      accessorKey: 'quantityKg',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Số lượng (kg)" />
      ),
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {row.original.quantityKg.toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      id: 'warehouse',
      header: 'Kho chứa',
      enableSorting: false,
      accessorFn: (row) => row.warehouse.name,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="size-3.5" />
          <span className="text-sm">{row.original.warehouse.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ngày nhập" />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {format(new Date(row.original.createdAt), 'dd/MM/yyyy', { locale: vi })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handlers.onViewDetail(row.original);
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            Chi tiết
          </Button>
        </div>
      ),
    },
  ];
  return columns;
}
