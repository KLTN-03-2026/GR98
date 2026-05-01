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
        <span className="font-mono font-medium text-slate-900 text-xs">
          {row.original.id.slice(-6).toUpperCase()}
        </span>
      ),
    },
    {
      id: 'product',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sản phẩm & SKU" />
      ),
      accessorFn: (row) => `${row.product.name} ${row.product.sku}`,
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-slate-900">{row.original.product.name}</span>
          <span className="text-xs text-muted-foreground">{row.original.product.sku}</span>
        </div>
      ),
    },
    {
      accessorKey: 'qualityGrade',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phẩm cấp" />
      ),
      cell: ({ row }) => {
        const grade = row.original.qualityGrade;
        return (
          <Badge 
            variant="outline" 
            className={
              grade === 'A' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
              grade === 'B' ? "bg-blue-50 text-blue-600 border-blue-100" :
              "bg-amber-50 text-amber-600 border-amber-100"
            }
          >
            Loại {grade}
          </Badge>
        );
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
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Kho chứa" />
      ),
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
        <span className="text-sm text-muted-foreground">
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
            <Eye className="size-4 mr-2" />
            Chi tiết
          </Button>
        </div>
      ),
    },
  ];
  return columns;
}
