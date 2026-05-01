import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { PackageOpen } from 'lucide-react';
import type { PendingHarvest } from '../api/types';

interface PendingHarvestsTableProps {
  harvests: PendingHarvest[];
  isLoading: boolean;
  onReceive: (harvest: PendingHarvest) => void;
}

export function PendingHarvestsTable({ harvests, isLoading, onReceive }: PendingHarvestsTableProps) {
  if (isLoading) return <div>Đang tải dữ liệu...</div>;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã BC</TableHead>
            <TableHead>Nông dân / Lô đất</TableHead>
            <TableHead>Sản phẩm</TableHead>
            <TableHead>Dự kiến (kg)</TableHead>
            <TableHead>Supervisor</TableHead>
            <TableHead>Ngày báo cáo</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {harvests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Không có báo cáo thu hoạch nào chờ đối soát.
              </TableCell>
            </TableRow>
          ) : (
            harvests.map((h) => (
              <TableRow key={h.id}>
                <TableCell className="font-mono text-xs">{h.id.slice(-6).toUpperCase()}</TableCell>
                <TableCell>
                  <div className="font-medium">{h.plot.farmer.fullName}</div>
                  <div className="text-xs text-muted-foreground">Lô: {h.plot.plotCode}</div>
                </TableCell>
                <TableCell>{h.plot.cropType}</TableCell>
                <TableCell className="font-semibold text-primary">
                  {h.yieldEstimateKg.toLocaleString()}
                </TableCell>
                <TableCell>{h.supervisor.user.fullName}</TableCell>
                <TableCell>{format(new Date(h.reportedAt), 'dd/MM/yyyy')}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" onClick={() => onReceive(h)}>
                    <PackageOpen className="w-4 h-4 mr-2" />
                    Nhận hàng
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
