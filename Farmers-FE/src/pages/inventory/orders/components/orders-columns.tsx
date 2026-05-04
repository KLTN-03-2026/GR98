import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Clock, Package, Truck, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Order, FulfillStatus, PaymentStatus } from '@/client/types';
import { FULFILL_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/client/types';

const FULFILL_COLORS: Record<FulfillStatus, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  PACKING: 'border-blue-200 bg-blue-50 text-blue-700',
  SHIPPED: 'border-purple-200 bg-purple-50 text-purple-700',
  DELIVERED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CANCELLED: 'border-slate-200 bg-slate-50 text-slate-500',
};

const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  PAID: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  FAILED: 'border-rose-200 bg-rose-50 text-rose-700',
  REFUNDED: 'border-slate-200 bg-slate-50 text-slate-500',
};

function FulfillStatusBadge({ status }: { status: FulfillStatus }) {
  const icons: Record<string, React.ReactNode> = {
    PENDING: <Clock className="h-3 w-3" />,
    PACKING: <Package className="h-3 w-3" />,
    SHIPPED: <Truck className="h-3 w-3" />,
    DELIVERED: <CheckCircle2 className="h-3 w-3" />,
    CANCELLED: <XCircle className="h-3 w-3" />,
  };
  return (
    <Badge variant="outline" className={cn('gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-none', FULFILL_COLORS[status])}>
      {icons[status]}
      {FULFILL_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant="outline" className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-none', PAYMENT_COLORS[status])}>
      {PAYMENT_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export const createOrderColumns = (handlers: {
  onViewDetail: (id: string) => void;
  onUpdateStatus: (id: string) => void;
}): ColumnDef<Order>[] => [
  {
    accessorKey: 'orderNo',
    header: 'Đơn hàng',
    cell: ({ row }) => (
      <span className="font-mono font-bold text-emerald-600 group-hover:underline transition-all">
        #{row.original.orderNo}
      </span>
    ),
  },
  {
    id: 'client',
    header: 'Khách hàng',
    cell: ({ row }) => {
      const client = row.original.client;
      if (!client?.user) return <span className="text-slate-400 italic text-[10px] font-medium">Khách lẻ</span>;
      return (
        <div className="space-y-0.5">
          <p className="font-bold text-slate-900 text-sm line-clamp-1">{client.user.fullName}</p>
          <p className="text-[10px] text-slate-400 font-medium">{client.user.email}</p>
        </div>
      );
    },
  },
  {
    accessorKey: 'paymentStatus',
    header: 'Thanh toán',
    cell: ({ row }) => <PaymentStatusBadge status={row.original.paymentStatus} />,
  },
  {
    accessorKey: 'fulfillStatus',
    header: 'Vận hành',
    cell: ({ row }) => <FulfillStatusBadge status={row.original.fulfillStatus} />,
  },
  {
    accessorKey: 'total',
    header: () => <div className="text-right w-full">Tổng tiền</div>,
    cell: ({ row }) => (
      <div className="text-right font-bold text-sm text-emerald-600 tabular-nums">
        {row.original.total.toLocaleString('vi-VN')} đ
      </div>
    ),
  },
  {
    accessorKey: 'orderedAt',
    header: () => <div className="text-right w-full">Ngày đặt</div>,
    cell: ({ row }) => (
      <div className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
        {new Date(row.original.orderedAt).toLocaleDateString('vi-VN', {
          day: '2-digit', month: '2-digit', year: 'numeric',
        })}
      </div>
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 rounded-lg text-emerald-600 hover:bg-emerald-50" 
          onClick={(e) => {
            e.stopPropagation();
            handlers.onViewDetail(row.original.id);
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          Chi tiết
        </Button>
      </div>
    ),
  },
];
