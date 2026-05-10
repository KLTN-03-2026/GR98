import type { ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Order } from '@/client/types';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: 'COD',
  VNPAY: 'VNPay',
  MOMO: 'MoMo',
};

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
      accessorFn: (row) => row.orderNo,
      header: 'Mã đơn',
      meta: { title: 'Mã đơn' },
      cell: ({ row }) => (
        <span className="font-mono font-semibold">{row.original.orderNo}</span>
      ),
    },
    {
      id: 'customer',
      accessorFn: (row) => row.client?.user?.fullName ?? '',
      header: 'Khách hàng',
      meta: { title: 'Khách hàng' },
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
      id: 'phone',
      accessorFn: (row) => row.shippingAddr?.phone ?? row.client?.user?.phone ?? '',
      header: 'SĐT',
      meta: { title: 'Số điện thoại' },
      cell: ({ row }) => {
        const phone = row.original.shippingAddr?.phone || row.original.client?.user?.phone;
        return <span className="text-sm">{phone || '—'}</span>;
      },
    },
    {
      id: 'paymentMethod',
      accessorFn: (row) => row.paymentMethod,
      header: 'PT Thanh toán',
      meta: { title: 'Phương thức TT' },
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {PAYMENT_METHOD_LABELS[row.original.paymentMethod] ?? row.original.paymentMethod}
        </span>
      ),
    },
    {
      id: 'paymentStatus',
      accessorFn: (row) => row.paymentStatus,
      header: 'Thanh toán',
      meta: { title: 'Trạng thái TT' },
      cell: ({ row }) => renderPaymentStatus(row.original.paymentStatus),
    },
    {
      id: 'fulfillStatus',
      accessorFn: (row) => row.fulfillStatus,
      header: 'Giao hàng',
      meta: { title: 'Trạng thái giao' },
      cell: ({ row }) => renderFulfillStatus(row.original.fulfillStatus),
    },
    {
      id: 'total',
      accessorFn: (row) => row.total,
      header: () => <div className="text-right">Tổng tiền</div>,
      meta: { title: 'Tổng tiền' },
      cell: ({ row }) => (
        <div className="text-right font-mono font-semibold text-primary">
          {formatCurrency(row.original.total)}
        </div>
      ),
    },
    {
      id: 'subtotal',
      accessorFn: (row) => row.subtotal,
      header: () => <div className="text-right">Tạm tính</div>,
      meta: { title: 'Tạm tính' },
      cell: ({ row }) => (
        <div className="text-right text-sm text-muted-foreground">
          {formatCurrency(row.original.subtotal)}
        </div>
      ),
    },
    {
      id: 'shippingFee',
      accessorFn: (row) => row.shippingFee,
      header: () => <div className="text-right">Phí ship</div>,
      meta: { title: 'Phí vận chuyển' },
      cell: ({ row }) => (
        <div className="text-right text-sm">
          {row.original.shippingFee === 0 ? (
            <span className="text-green-600">Miễn phí</span>
          ) : (
            formatCurrency(row.original.shippingFee)
          )}
        </div>
      ),
    },
    {
      id: 'itemCount',
      accessorFn: (row) => row.orderItems?.length ?? 0,
      header: 'SP',
      meta: { title: 'Số sản phẩm' },
      cell: ({ row }) => (
        <span className="text-sm">{row.original.orderItems?.length ?? 0}</span>
      ),
    },
    {
      id: 'shippingAddress',
      accessorFn: (row) => row.shippingAddr?.addressLine ?? '',
      header: 'Địa chỉ',
      meta: { title: 'Địa chỉ giao' },
      cell: ({ row }) => {
        const addr = row.original.shippingAddr;
        if (!addr) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="text-sm max-w-[200px] truncate" title={`${addr.addressLine}, ${addr.district ?? ''}, ${addr.province}`}>
            {addr.addressLine}, {addr.district && `${addr.district}, `}{addr.province}
          </div>
        );
      },
    },
    {
      id: 'trackingCode',
      accessorFn: (row) => row.trackingCode ?? '',
      header: 'Mã vận đơn',
      meta: { title: 'Mã vận đơn' },
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.trackingCode || '—'}</span>
      ),
    },
    {
      id: 'orderedAt',
      accessorFn: (row) => row.orderedAt,
      header: () => <div className="text-right">Ngày đặt</div>,
      meta: { title: 'Ngày đặt' },
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
      id: 'note',
      accessorFn: (row) => row.note ?? '',
      header: 'Ghi chú',
      meta: { title: 'Ghi chú' },
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground max-w-[150px] truncate block">
          {row.original.note || '—'}
        </span>
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
