import type { ColumnDef } from '@tanstack/react-table';
import { Eye, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { InventoryLot } from '../api/types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function createLotColumns(handlers: {
  onViewDetail: (lot: InventoryLot) => void;
  onConfirm: (lot: InventoryLot) => void;
  onReject: (lot: InventoryLot) => void;
  onUpdateGrade: (lot: InventoryLot) => void;
  mode?: 'in-stock' | 'pending' | 'upcoming';
}) {
  const { mode = 'in-stock' } = handlers;
  
  const columns: ColumnDef<InventoryLot>[] = [
    {
      accessorKey: 'id',
      header: 'Mã lô',
      cell: ({ row }) => (
        <span className="text-sm font-medium uppercase text-muted-foreground">
          #{row.original.id.slice(-8)}
        </span>
      ),
    },
    {
      id: 'product',
      header: 'Sản phẩm',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-900">{row.original.product.name}</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase">{row.original.product.sku}</span>
        </div>
      ),
    },
    {
      accessorKey: 'qualityGrade',
      header: 'Phẩm cấp',
      cell: ({ row }) => {
        const grade = row.original.qualityGrade;
        if (grade === 'REJECT') {
          return <Badge variant="destructive">Reject</Badge>;
        }
        
        const canUpdate = row.original.status === 'ARRIVED' || row.original.status === 'RECEIVED';

        return (
          <div 
            className={cn(canUpdate && "cursor-pointer")}
            onClick={(e) => {
              if (canUpdate) {
                e.stopPropagation();
                handlers.onUpdateGrade(row.original);
              }
            }}
          >
            <Badge 
              variant={grade === 'A' ? 'default' : grade === 'B' ? 'secondary' : 'outline'}
              className="font-bold uppercase text-[10px] px-2"
            >
              Loại {grade}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'warehouse',
      header: 'Kho chứa',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.warehouse.name}</span>
      ),
    },
    {
      id: 'date',
      header: mode === 'upcoming' ? 'Dự kiến' : 'Ngày nhập',
      cell: ({ row }) => {
        const dateValue = mode === 'upcoming' ? row.original.harvestDate : row.original.createdAt;
        if (!dateValue) return <span className="text-muted-foreground text-sm">—</span>;
        
        return (
          <span className="text-sm whitespace-nowrap">
             {format(new Date(dateValue), 'dd/MM/yyyy', { locale: vi })}
          </span>
        );
      },
    },
    {
      accessorKey: 'quantityKg',
      header: 'Số lượng',
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {row.original.quantityKg.toLocaleString('vi-VN')} kg
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          {row.original.status === 'ARRIVED' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handlers.onReject(row.original);
                }}
              >
                <XCircle className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handlers.onConfirm(row.original);
                }}
              >
                <CheckCircle2 className="size-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs font-medium"
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
