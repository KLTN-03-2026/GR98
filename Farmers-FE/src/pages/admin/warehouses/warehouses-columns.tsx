import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/data-table';
import type { AdminWarehouseRow } from './api/types';

export const WAREHOUSE_MANAGER_UNASSIGNED = '__NONE__';

function formatDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN');
}

export function createAdminWarehouseColumns(handlers: {
  onOpenDetail: (row: AdminWarehouseRow) => void;
  onEdit: (row: AdminWarehouseRow) => void;
}) {
  const columns: ColumnDef<AdminWarehouseRow>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tên kho" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      id: 'location',
      header: 'Địa chỉ',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground line-clamp-2 max-w-[240px] text-sm">
          {row.original.locationAddress ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Trạng thái',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge variant="success">Hoạt động</Badge>
        ) : (
          <Badge variant="secondary">Ngưng</Badge>
        ),
    },
    {
      id: 'manager',
      header: 'Nhân viên phụ trách',
      enableSorting: false,
      cell: ({ row }) => {
        const { managerFullName, managerEmployeeCode, managedBy } = row.original;
        if (!managedBy) {
          return <span className="text-muted-foreground text-sm">Chưa gán</span>;
        }
        return (
          <div className="text-sm">
            <div>{managerFullName ?? '—'}</div>
            {managerEmployeeCode ? (
              <div className="text-muted-foreground text-xs">{managerEmployeeCode}</div>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: 'lotCount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Số lô hàng" />
      ),
      cell: ({ row }) => (
        <span
          className="cursor-help tabular-nums underline decoration-dotted decoration-muted-foreground/50 underline-offset-2"
          title={
            'Số lượng lô hàng tồn kho (InventoryLot) trong kho này: mỗi lô = một dòng tồn theo sản phẩm ' +
            '(kg, phân hạng chất lượng…). Khác với “lô đất” trên đồng; không phải số giao dịch xuất/nhập.'
          }
        >
          {row.original.lotCount}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ngày tạo" />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handlers.onOpenDetail(row.original);
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            Chi tiết
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handlers.onEdit(row.original);
            }}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Sửa
          </Button>
        </div>
      ),
    },
  ];
  return columns;
}
