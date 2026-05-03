import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/data-table';
import { ImageIcon, CheckCircle2, AlertCircle, Clock, Pencil, Trash2, ExternalLink } from 'lucide-react';
import type { Product } from '@/client/types';
import { Button } from '@/components/ui/button';

export const productColumns: ColumnDef<Product>[] = [
  {
    accessorKey: 'thumbnailUrl',
    header: 'Ảnh',
    cell: ({ row }) => (
      <div className="relative h-10 w-14 rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
        {row.original.imageUrls?.[0] ? (
          <img 
            src={row.original.imageUrls[0]} 
            alt={row.original.name} 
            className="h-full w-full object-cover" 
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ImageIcon className="h-4 w-4 text-slate-200" />
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sản phẩm" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-bold text-sm text-slate-900">{row.original.name}</span>
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tight">
          {row.original.sku || 'N/A'}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'cropType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Loại & Hạng" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-700">{row.original.cropType}</span>
        <Badge variant="outline" className="w-fit text-[9px] h-4 px-1 border-emerald-200 text-emerald-600 font-bold">
          HẠNG {row.original.grade}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: 'pricePerKg',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Giá niêm yết" className="justify-end" />
    ),
    cell: ({ row }) => (
      <div className="text-right">
        <span className="font-bold text-sm text-slate-900">
          {row.original.pricePerKg.toLocaleString('vi-VN')} đ
        </span>
        <span className="text-[10px] text-slate-400 block">/ {row.original.unit}</span>
      </div>
    ),
  },
  {
    id: 'stock',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tồn kho" className="justify-center" />
    ),
    cell: ({ row }) => {
      const actual = row.original.actualStockKg ?? row.original.stockKg ?? 0;
      return (
        <div className="flex flex-col items-center">
          <Badge variant="outline" className="bg-emerald-50 border-emerald-100 text-emerald-700 font-bold">
            {actual.toLocaleString('vi-VN')} kg
          </Badge>
        </div>
      );
    }
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trạng thái" />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      switch (status) {
        case 'PUBLISHED':
          return (
            <Badge variant="success" className="gap-1 px-2 py-0.5 font-medium text-[10px]">
              <CheckCircle2 className="size-3" /> CÔNG KHAI
            </Badge>
          );
        case 'OUT_OF_STOCK':
          return (
            <Badge variant="destructive" className="gap-1 px-2 py-0.5 font-medium text-[10px]">
              <AlertCircle className="size-3" /> HẾT HÀNG
            </Badge>
          );
        case 'ARCHIVED':
          return (
            <Badge variant="outline" className="gap-1 px-2 py-0.5 font-medium text-[10px] bg-slate-100 text-slate-500 border-slate-200">
              <Trash2 className="size-3" /> ĐÃ XÓA
            </Badge>
          );
        default:
          return (
            <Badge variant="secondary" className="gap-1 px-2 py-0.5 font-medium text-[10px]">
              <Clock className="size-3" /> ĐANG SOẠN
            </Badge>
          );
      }
    },
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const product = row.original;
      const meta = table.options.meta as any;

      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full hover:bg-emerald-50 hover:text-emerald-600"
            onClick={() => meta?.onEdit?.(product)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
            onClick={() => meta?.onDelete?.(product.id)}
            disabled={product.status === 'ARCHIVED'}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-600"
            asChild
          >
            <a href={`/products/${product.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      );
    },
  },
];
