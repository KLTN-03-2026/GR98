import type { ColumnDef } from '@tanstack/react-table';
import { Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DailyReportResponse, DailyReportStatus } from '@/pages/admin/daily-reports/api';

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
  };
  return map[status] ?? status;
}

function statusVariant(status: DailyReportStatus) {
  if (status === 'SUBMITTED') return 'default' as const;
  if (status === 'REVIEWED') return 'secondary' as const;
  return 'outline' as const;
}

export function createSupervisorDailyReportColumns(
  onEdit: (row: DailyReportResponse) => void,
  onView: (row: DailyReportResponse) => void,
) {
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
      cell: ({ row }) => {
        const isDraft = row.original.status === 'DRAFT';
        return (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (isDraft) onEdit(row.original);
              else onView(row.original);
            }}
          >
            {isDraft ? (
              <>
                <Pencil className="h-4 w-4 mr-1" />
                Sửa
              </>
            ) : (
              'Xem'
            )}
          </Button>
        );
      },
    },
  ];
  return columns;
}
