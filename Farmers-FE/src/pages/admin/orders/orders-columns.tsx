import type { ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Order } from '@/client/types';

type CreateOrdersColumnsOptions = {
  formatCurrency: (value: number) => string;
  renderPaymentStatus: (status: string) => ReactNode;
  renderFulfillStatus: (status: string) => ReactNode;
  renderActions: (order: Order) => ReactNode;
};

export function createOrdersColumns({
  formatCurrency,
  renderPaymentStatus,
  renderFulfillStatus,
  renderActions,
}: CreateOrdersColumnsOptions): ColumnDef<Order>[] {
  return [
    {
      id: 'orderNo',
      header: 'Mã đơn',
      cell: ({ row }) => (
        <span className="font-mono font-semibold">{row.original.orderNo}</span>
      ),
    },
    {
      id: 'customer',
      header: 'Khách hàng',
      cell: ({ row }) => {
        const client = row.original.client?.user;
        if (!client) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="text-sm">
            <p className="font-medium">{client.fullName}</p>
            <p className="text-muted-foreground">{client.email}</p>
          </div>
        );
      },
    },
    {
      id: 'paymentStatus',
      header: 'Thanh toán',
      cell: ({ row }) => renderPaymentStatus(row.original.paymentStatus),
    },
    {
      id: 'fulfillStatus',
      header: 'Giao hàng',
      cell: ({ row }) => renderFulfillStatus(row.original.fulfillStatus),
    },
    {
      id: 'total',
      header: () => <div className="text-right">Tổng tiền</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono font-semibold text-primary">
          {formatCurrency(row.original.total)}
        </div>
      ),
    },
    {
      id: 'orderedAt',
      header: () => <div className="text-right">Ngày đặt</div>,
      cell: ({ row }) => (
        <div className="text-right text-muted-foreground">
          {new Date(row.original.orderedAt).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </div>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Thao tác</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          {renderActions(row.original)}
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
