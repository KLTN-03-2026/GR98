import type { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DailyReportResponse, DailyReportStatus } from './api';

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN');
}

function statusLabel(status: DailyReportStatus) {
  const map: Record<DailyReportStatus, string> = {
    DRAFT: 'Nháp',
    SUBMITTED: 'Đã gửi',
    REVIEWED: 'Đã xem',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
  };
  return map[status] ?? status;
}

function statusVariant(status: DailyReportStatus) {
  if (status === 'SUBMITTED') return 'default' as const;
  if (status === 'REVIEWED') return 'secondary' as const;
  if (status === 'APPROVED') return 'emerald' as const;
  if (status === 'REJECTED') return 'destructive' as const;
  return 'outline' as const;
}

export function createAdminDailyReportColumns(onOpenDetail: (row: DailyReportResponse) => void) {
  const columns: ColumnDef<DailyReportResponse>[] = [
    {
      accessorKey: 'reportedAt',
      header: 'Thời gian',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm">{formatDateTime(row.original.reportedAt)}</span>
      ),
    },
    {
      id: 'supervisorName',
      header: 'Giám sát',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm">{row.original.supervisor?.user?.fullName ?? '—'}</span>
      ),
    },
    {
      id: 'plotCode',
      header: 'Lô',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.plot?.plotCode ?? '—'}</span>
      ),
    },
    {
      id: 'farmerName',
      header: 'Nông dân',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm">{row.original.plot?.farmer?.fullName ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.status)}>{statusLabel(row.original.status)}</Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(row.original);
          }}
        >
          <Eye className="h-4 w-4 mr-1" />
          Chi tiết
        </Button>
      ),
    },
  ];
  return columns;
}
