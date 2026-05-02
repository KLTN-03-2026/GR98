import type { ComponentProps } from 'react';
import { Link } from 'react-router-dom';
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
import type { ContractStatus } from '@/pages/admin/contracts/api';
import { getContractStatusBadgeVariant } from '@/pages/contracts/components/contract-ui';
import type { DashboardActivity } from '../api/types';
import { SupervisorEmptyState } from './supervisor-empty-state';

const typeLabel: Record<DashboardActivity['type'], string> = {
  contract: 'Hợp đồng',
  daily_report: 'Báo cáo',
  order: 'Đơn hàng',
};

function activityBadgeVariant(
  activity: DashboardActivity,
): ComponentProps<typeof Badge>['variant'] {
  if (activity.type === 'contract') {
    return getContractStatusBadgeVariant(activity.status as ContractStatus);
  }
  if (activity.type === 'daily_report') {
    if (activity.status === 'SUBMITTED') return 'default';
    if (activity.status === 'REVIEWED') return 'success';
    return 'secondary';
  }
  return 'outline';
}

function formatAt(iso: string) {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function OverviewActivityTable({
  activities,
  isLoading,
}: {
  activities: DashboardActivity[] | undefined;
  isLoading: boolean;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border-primary/15 shadow-sm">
      <CardHeader className="border-b border-primary/10 bg-primary/[0.06] pb-4 pt-5 dark:bg-primary/15">
        <CardTitle className="text-lg font-semibold tracking-tight">Nhật ký hoạt động</CardTitle>
        <p className="text-sm text-muted-foreground">
          Hợp đồng và báo cáo
          {activities?.some((a) => a.type === 'order') ? ', đơn hàng' : ''} gần nhất trong phạm vi của bạn.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
        ) : !activities?.length ? (
          <div className="p-4">
            <SupervisorEmptyState message="Chưa có hoạt động nào trong khoảng thời gian đã chọn." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="text-sm">
              <TableHeader>
                <TableRow className="border-primary/10 hover:bg-transparent">
                  <TableHead className="h-11 w-[100px] bg-muted/30 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Loại
                  </TableHead>
                  <TableHead className="h-11 bg-muted/30 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Tiêu đề
                  </TableHead>
                  <TableHead className="h-11 w-[168px] bg-muted/30 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Thời gian
                  </TableHead>
                  <TableHead className="h-11 w-[140px] bg-muted/30 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Trạng thái
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((row) => (
                  <TableRow
                    key={`${row.type}-${row.id}`}
                    className="border-border/50 transition-colors hover:bg-primary/[0.04]"
                  >
                    <TableCell className="px-4 py-3 text-sm font-medium text-muted-foreground">
                      {typeLabel[row.type]}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        {row.href ? (
                          <Link
                            to={row.href}
                            className="text-sm font-semibold text-primary hover:underline"
                          >
                            {row.title}
                          </Link>
                        ) : (
                          <span className="text-sm font-semibold">{row.title}</span>
                        )}
                        {row.subtitle ? (
                          <span className="text-xs text-muted-foreground">{row.subtitle}</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {formatAt(row.at)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant={activityBadgeVariant(row)}
                        className="rounded-md px-2 py-0.5 text-xs"
                      >
                        {row.statusLabel}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
