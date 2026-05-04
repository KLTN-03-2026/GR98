import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TransactionResponse } from '../api/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react';

export function InventoryActivityTable({
  transactions,
  isLoading,
}: {
  transactions: TransactionResponse[] | undefined;
  isLoading: boolean;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-b from-card to-primary/[0.03] shadow-sm dark:to-primary/[0.06]">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-lg font-semibold tracking-tight">Biến động kho mới nhất</CardTitle>
        <p className="text-sm text-muted-foreground">
          Các giao dịch nhập, xuất và điều chỉnh kho theo thời gian thực
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <Skeleton className="h-36 w-full rounded-lg" />
        ) : !transactions?.length ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-muted-foreground font-medium">Không có giao dịch nào gần đây.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <Table className="text-sm">
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/20">
                  <TableHead className="h-10 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Loại</TableHead>
                  <TableHead className="h-10 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Sản phẩm</TableHead>
                  <TableHead className="h-10 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground text-right">Khối lượng</TableHead>
                  <TableHead className="h-10 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Nhà kho</TableHead>
                  <TableHead className="h-10 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((row) => {
                  const config = {
                    inbound: { label: 'Nhập', icon: ArrowDownLeft, color: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400' },
                    outbound: { label: 'Xuất', icon: ArrowUpRight, color: 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400' },
                    adjustment: { label: 'Sửa', icon: Scale, color: 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400' },
                  }[row.type as 'inbound' | 'outbound' | 'adjustment'] || { label: row.type, icon: Scale, color: '' };

                  return (
                    <TableRow key={row.id} className="h-12 hover:bg-muted/30">
                      <TableCell className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className={cn("flex size-6 items-center justify-center rounded-md border", config.color)}>
                            <config.icon className="size-3.5" />
                          </div>
                          <span className="font-semibold text-xs">{config.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2 font-medium text-foreground">
                        {row.product.name}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-right font-semibold tabular-nums text-foreground">
                        {row.quantityKg.toLocaleString('vi-VN')} kg
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Badge variant="outline" className="rounded-md h-6 px-2 text-[10px] font-medium border-border/60">
                          {row.warehouse.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(row.createdAt), 'dd/MM HH:mm', { locale: vi })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
