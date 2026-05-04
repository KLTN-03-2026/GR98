import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/data-table';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Client } from '../api/hooks';

export const clientColumns: ColumnDef<Client>[] = [
  {
    accessorKey: 'user.fullName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Khách hàng" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={row.original.user.avatar || ''} />
          <AvatarFallback>{row.original.user.fullName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.original.user.fullName}</span>
          <span className="text-xs text-muted-foreground">{row.original.user.email}</span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'user.phone',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Số điện thoại" />
    ),
    cell: ({ row }) => (
      <span className="text-sm">{row.original.user.phone || '—'}</span>
    ),
  },
  {
    accessorKey: '_count.orders',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Đơn hàng" className="justify-end" />
    ),
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {row.original._count.orders.toLocaleString('vi-VN')}
      </div>
    ),
  },
  {
    accessorKey: 'user.status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trạng thái" />
    ),
    cell: ({ row }) => {
      const status = row.original.user.status;
      return (
        <Badge variant={status === 'ACTIVE' ? 'success' : 'secondary'}>
          {status === 'ACTIVE' ? 'Hoạt động' : status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'user.createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ngày tham gia" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {format(new Date(row.original.user.createdAt), 'dd/MM/yyyy', { locale: vi })}
      </span>
    ),
  },
];
