import type { ColumnDef } from '@tanstack/react-table';
import { Eye, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/data-table';
import type { InventoryLot } from '../api/types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function createLotColumns(handlers: {
  onViewDetail: (lot: InventoryLot) => void;
  onConfirm: (lot: InventoryLot) => void;
  mode?: 'in-stock' | 'pending' | 'upcoming';
}) {
  const { mode = 'in-stock' } = handlers;
  
  const columns: ColumnDef<InventoryLot>[] = [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Mã Lô" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-primary/80 bg-primary/5 px-2 py-1 rounded-md">
          #{row.original.id.slice(-6).toUpperCase()}
        </span>
      ),
    },
    {
      id: 'product',
      header: 'Sản phẩm',
      accessorFn: (row) => `${row.product.name} ${row.product.sku}`,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 leading-tight">{row.original.product.name}</span>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">{row.original.product.sku}</span>
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
          return <Badge variant="destructive" className="font-bold uppercase tracking-tighter">Reject</Badge>;
        }
        return (
          <Badge 
            variant="outline" 
            className={cn(
              "font-bold px-2.5 py-0.5 rounded-full border-2",
              grade === 'A' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
              grade === 'B' ? "bg-blue-50 text-blue-700 border-blue-100" :
              "bg-slate-50 text-slate-700 border-slate-200"
            )}
          >
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
          return <Badge variant="outline" className="bg-blue-50/50 text-blue-600 border-blue-100/50 rounded-lg">Đơn hàng dự kiến</Badge>;
        }
        if (lot.status === 'ARRIVED') {
          return <Badge variant="outline" className="bg-amber-50/50 text-amber-600 border-amber-100/50 rounded-lg">Chờ nhập kho</Badge>;
        }
        if (lot.status === 'RECEIVED') {
          return <Badge variant="outline" className="bg-emerald-50/50 text-emerald-600 border-emerald-100/50 rounded-lg">Đã nhập kho</Badge>;
        }
        
        const { isExpired, isExpiringSoon } = lot;
        if (isExpired) {
          return <Badge variant="destructive" className="rounded-lg shadow-sm">Hết hạn</Badge>;
        }
        if (isExpiringSoon) {
          return <Badge variant="warning" className="rounded-lg shadow-sm text-amber-800">Sắp hết hạn</Badge>;
        }
        
        return <Badge variant="outline" className="rounded-lg">{lot.status}</Badge>;
      },
    },
    {
      accessorKey: 'quantityKg',
      header: ({ column }) => (
        <DataTableColumnHeader 
          column={column} 
          title={mode === 'upcoming' ? "Sản lượng dự tính" : "Số lượng (kg)"} 
        />
      ),
      cell: ({ row }) => (
        <div className="flex items-baseline gap-1">
          <span className="text-base font-bold text-slate-900 tabular-nums">
            {row.original.quantityKg.toLocaleString('vi-VN')}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase">kg</span>
        </div>
      ),
    },
    {
      id: 'warehouse',
      header: 'Kho chứa',
      enableSorting: false,
      accessorFn: (row) => row.warehouse.name,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 group cursor-default">
          <div className="size-7 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <MapPin className="size-3.5 text-slate-500 group-hover:text-primary transition-colors" />
          </div>
          <span className="text-sm font-medium text-slate-700">{row.original.warehouse.name}</span>
        </div>
      ),
    },
    {
      id: 'date',
      header: ({ column }) => (
        <DataTableColumnHeader 
          column={column} 
          title={mode === 'upcoming' ? "Ngày nhập dự kiến" : "Ngày nhập"} 
        />
      ),
      cell: ({ row }) => {
        const dateValue = mode === 'upcoming' ? row.original.harvestDate : row.original.createdAt;
        if (!dateValue) return <span className="text-muted-foreground italic text-xs">Chưa cập nhật</span>;
        
        return (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-800">
              {format(new Date(dateValue), 'dd/MM/yyyy', { locale: vi })}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(dateValue), 'HH:mm', { locale: vi })}
            </span>
          </div>
        );
      },
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
              className="bg-emerald-600 hover:bg-emerald-700 h-8 rounded-lg shadow-sm shadow-emerald-200"
              onClick={(e) => {
                e.stopPropagation();
                handlers.onConfirm(row.original);
              }}
            >
              Xác nhận
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-slate-200 hover:bg-slate-50 hover:text-primary transition-all"
            onClick={(e) => {
              e.stopPropagation();
              handlers.onViewDetail(row.original);
            }}
          >
            <Eye className="h-4 w-4 mr-2 text-primary/70" />
            Chi tiết
          </Button>
        </div>
      ),
    },
  ];
  return columns;
}
