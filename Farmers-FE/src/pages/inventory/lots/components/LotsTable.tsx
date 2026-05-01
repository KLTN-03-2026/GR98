import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { InventoryLot } from '../api/types';

interface LotsTableProps {
  lots: InventoryLot[];
  isLoading: boolean;
}

export function LotsTable({ lots, isLoading }: LotsTableProps) {
  if (isLoading) return <div>Đang tải dữ liệu...</div>;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã Lô</TableHead>
            <TableHead>Sản phẩm</TableHead>
            <TableHead>Phẩm cấp</TableHead>
            <TableHead>Số lượng (kg)</TableHead>
            <TableHead>Kho</TableHead>
            <TableHead>Ngày nhập</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lots.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Không có lô hàng nào.
              </TableCell>
            </TableRow>
          ) : (
            lots.map((lot) => (
              <TableRow key={lot.id}>
                <TableCell className="font-mono text-xs">{lot.id.slice(-8).toUpperCase()}</TableCell>
                <TableCell>
                  <div className="font-medium">{lot.product.name}</div>
                  <div className="text-xs text-muted-foreground">{lot.product.sku}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={lot.qualityGrade === 'REJECT' ? 'destructive' : 'outline'}>
                    Loại {lot.qualityGrade}
                  </Badge>
                </TableCell>
                <TableCell>{lot.quantityKg.toLocaleString()}</TableCell>
                <TableCell>{lot.warehouse.name}</TableCell>
                <TableCell>{format(new Date(lot.createdAt), 'dd/MM/yyyy')}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
