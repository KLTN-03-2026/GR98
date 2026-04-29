import { useMemo } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CompactDataTable } from './CompactDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import type { PendingOrderResponse } from '../api/types';
import { cn } from '@/lib/utils';

const FULFILL_BADGE: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  PENDING: { label: 'Chờ xử lý', variant: 'destructive' },
  PACKING: { label: 'Đang đóng gói', variant: 'warning' },
  SHIPPED: { label: 'Đang giao', variant: 'secondary' },
  DELIVERED: { label: 'Đã giao', variant: 'success' },
  CANCELLED: { label: 'Đã hủy', variant: 'secondary' },
};

interface OrderTableProps {
  data: PendingOrderResponse[];
  isLoading: boolean;
}

export function OrderTable({ data, isLoading }: OrderTableProps) {
  const columns = useMemo<ColumnDef<PendingOrderResponse>[]>(() => [
    {
      accessorKey: 'orderCode',
      header: 'Mã đơn',
      cell: ({ row }) => <span className="font-bold text-xs text-slate-900 tracking-tight">{row.original.orderCode}</span>,
    },
    {
      accessorKey: 'client.user.fullName',
      header: 'Khách hàng',
      cell: ({ row }) => (
        <span className="text-xs font-medium text-slate-600">
          {row.original.client?.user.fullName ?? 'Khách lẻ'}
        </span>
      ),
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Thanh toán',
      cell: ({ row }) => (
        <Badge
          variant={row.original.paymentStatus === 'PAID' ? 'success' : 'secondary'}
          className="text-[9px] font-bold rounded-full px-2"
        >
          {row.original.paymentStatus === 'PAID' ? 'ĐÃ TRẢ' : 'CHƯA TRẢ'}
        </Badge>
      ),
    },
    {
      accessorKey: 'fulfillStatus',
      header: 'Trạng thái',
      cell: ({ row }) => {
        const config = FULFILL_BADGE[row.original.fulfillStatus] ?? { label: row.original.fulfillStatus, variant: 'default' };
        return (
          <Badge variant={config.variant} className="text-[9px] font-bold uppercase rounded-full px-2">
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'total',
      header: 'Tổng tiền',
      cell: ({ row }) => (
        <div className="text-right font-bold text-xs tabular-nums text-emerald-600">
          {row.original.total.toLocaleString()}đ
        </div>
      ),
    },
  ], []);

  return (
    <Card className="rounded-[2rem] border border-slate-200/60 overflow-hidden shadow-sm bg-white transition-all hover:shadow-md">
      <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/30">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[10px] font-bold uppercase tracking-tight text-slate-400">
            Yêu cầu mới
          </h3>
          <p className="text-[10px] font-medium text-slate-400">Các đơn hàng cần xử lý ngay</p>
        </div>
        <Badge variant="outline" className="text-[10px] rounded-full px-2.5 py-0.5 border-slate-200 bg-white text-slate-600 font-bold shadow-xs">
          {data.length}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <CompactDataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          noResults={
            <div className="flex flex-col items-center justify-center py-16 text-slate-300">
              <ShoppingCart className="size-12 mb-3 opacity-20" />
              <p className="text-[11px] font-bold uppercase tracking-widest opacity-50">Không có đơn hàng nào</p>
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}
