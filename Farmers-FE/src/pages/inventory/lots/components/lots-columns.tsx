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
  onConfirm: (lot: InventoryLot) => void;
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
        const lot = row.original;
        
        if (lot.status === 'SCHEDULED') {
          return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50">Đơn hàng dự kiến</Badge>;
        }
        if (lot.status === 'ARRIVED') {
          return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-50">Chờ nhập kho</Badge>;
        }
        if (lot.status === 'RECEIVED') {
          return <Badge variant="success">Đã nhập kho</Badge>;
        }
        
        // Cảnh báo hết hạn (chỉ cho hàng đã nhập kho)
        const { isExpired, isExpiringSoon } = lot;
        if (isExpired) {
          return <Badge variant="destructive">Hết hạn</Badge>;
        }
        if (isExpiringSoon) {
          return <Badge variant="warning">Sắp hết hạn</Badge>;
        }
        
        return <Badge variant="outline">{lot.status}</Badge>;
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
        <div className="flex justify-end gap-2">
          {row.original.status === 'ARRIVED' && (
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 h-8"
              onClick={(e) => {
                e.stopPropagation();
                handlers.onConfirm(row.original);
              }}
            >
              Xác nhận
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
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
