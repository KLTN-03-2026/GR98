import { useMemo } from 'react';
import { format } from 'date-fns';
import { Package2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CompactDataTable } from './CompactDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import type { TransactionResponse } from '../api/types';
import { cn } from '@/lib/utils';

const TRANSACTION_BADGE: Record<string, { label: string; className: string }> = {
  inbound: { label: 'Nhập kho', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  outbound: { label: 'Xuất kho', className: 'bg-rose-50 text-rose-700 border-rose-100' },
  adjustment: { label: 'Điều chỉnh', className: 'bg-blue-50 text-blue-700 border-blue-100' },
};

interface TransactionTableProps {
  data: TransactionResponse[];
  isLoading: boolean;
}

export function TransactionTable({ data, isLoading }: TransactionTableProps) {
  const columns = useMemo<ColumnDef<TransactionResponse>[]>(() => [
    {
      accessorKey: 'createdAt',
      header: 'Ngày giờ',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-slate-900 font-bold text-xs">
            {format(new Date(row.original.createdAt), 'dd/MM')}
          </span>
          <span className="text-slate-400 text-[10px]">
            {format(new Date(row.original.createdAt), 'HH:mm')}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'warehouse.name',
      header: 'Kho hàng',
      cell: ({ row }) => (
        <span className="font-bold text-xs text-slate-900 uppercase tracking-tight">
          {row.original.warehouse.name}
        </span>
      ),
    },
    {
      accessorKey: 'product.name',
      header: 'Sản phẩm',
      cell: ({ row }) => (
        <span className="text-xs font-medium text-slate-600 truncate max-w-[150px] inline-block">
          {row.original.product.name}
        </span>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Loại',
      cell: ({ row }) => {
        const type = row.original.type;
        const config = TRANSACTION_BADGE[type] ?? { label: type, className: '' };
        return (
          <Badge variant="outline" className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold uppercase", config.className)}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'quantityKg',
      header: 'Số lượng',
      cell: ({ row }) => (
        <div className="text-right font-bold text-xs tabular-nums text-slate-900">
          {row.original.quantityKg.toLocaleString()} <span className="text-slate-400 font-medium">kg</span>
        </div>
      ),
    },
  ], []);

  return (
    <Card className="rounded-[2rem] border border-slate-200/60 overflow-hidden shadow-sm bg-white transition-all hover:shadow-md">
      <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/30">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[10px] font-bold uppercase tracking-tight text-slate-400">
            Nhật ký gần đây
          </h3>
          <p className="text-[10px] font-medium text-slate-400">Giao dịch xuất nhập kho mới nhất</p>
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
              <Package2 className="size-12 mb-3 opacity-20" />
              <p className="text-[11px] font-bold uppercase tracking-widest opacity-50">Không có giao dịch nào</p>
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}
