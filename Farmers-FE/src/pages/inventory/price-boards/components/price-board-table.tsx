import { format } from 'date-fns';
import { Power, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PriceBoardGradeBadge } from './grade-badge';
import type { PriceBoardResponse } from '../api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from '@/components/ui/card';

interface PriceBoardTableProps {
  items: PriceBoardResponse[];
  onToggleActive: (id: string) => void;
  isToggling: boolean;
  onEdit: (item: PriceBoardResponse) => void;
  onDelete: (item: PriceBoardResponse) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(value);
};

export function PriceBoardTable({ 
  items, 
  onToggleActive, 
  isToggling, 
  onEdit, 
  onDelete 
}: PriceBoardTableProps) {
  return (
    <Card className="border shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="font-semibold">Loại nông sản</TableHead>
              <TableHead className="font-semibold w-[140px]">Phẩm cấp</TableHead>
              <TableHead className="font-semibold text-right w-[160px]">Giá mua vào</TableHead>
              <TableHead className="font-semibold text-right w-[160px]">Giá bán ra</TableHead>
              <TableHead className="font-semibold text-right w-[180px]">Chênh lệch</TableHead>
              <TableHead className="font-semibold text-center w-[150px]">Hiệu lực từ</TableHead>
              <TableHead className="font-semibold w-[150px]">Trạng thái</TableHead>
              <TableHead className="font-semibold text-right w-[120px]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const margin = item.sellPrice - item.buyPrice;
              const marginPercent = ((margin / item.buyPrice) * 100).toFixed(1);

              return (
                <TableRow key={item.id} className="group">
                  <TableCell className="font-medium text-slate-900">
                    {item.cropType}
                  </TableCell>
                  <TableCell>
                    <PriceBoardGradeBadge grade={item.grade} />
                  </TableCell>
                  <TableCell className="text-right font-mono text-emerald-600 font-medium">
                    {formatCurrency(item.buyPrice)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-blue-600 font-medium">
                    {formatCurrency(item.sellPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col">
                      <span className="font-mono text-slate-600 font-medium">+{formatCurrency(margin)}</span>
                      <span className="text-[11px] text-muted-foreground">Lợi nhuận: {marginPercent}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-slate-500 text-sm">
                    {format(new Date(item.effectiveDate), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? 'success' : 'secondary'} className="whitespace-nowrap font-medium px-2 py-0.5">
                      {item.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onEdit(item)}
                        className="size-8"
                      >
                        <Pencil className="size-4 text-slate-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onToggleActive(item.id)}
                        disabled={isToggling}
                        className={cn("size-8", item.isActive ? "text-slate-400" : "text-emerald-600")}
                      >
                        <Power className="size-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onDelete(item)}
                        className="size-8 hover:text-destructive"
                      >
                        <Trash2 className="size-4 text-slate-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
