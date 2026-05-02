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
import type { AdminDashboardActivity } from '../api/types';
import { OverviewEmptyState } from './overview-empty-state';

const typeLabel: Record<AdminDashboardActivity['type'], string> = {
  contract: 'Hợp đồng',
  daily_report: 'Báo cáo',
  order: 'Đơn hàng',
};

function activityBadgeVariant(
  activity: AdminDashboardActivity,
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
  activities: AdminDashboardActivity[] | undefined;
  isLoading: boolean;
}) {
  return (
    <Card className="rounded-xl border border-border/70 shadow-none">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-base font-semibold tracking-tight">Hoạt động gần đây</CardTitle>
        <p className="text-sm text-muted-foreground">
          Hợp đồng, báo cáo{activities?.some((a) => a.type === 'order') ? ', đơn hàng' : ''} mới nhất
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <Skeleton className="h-36 w-full rounded-lg" />
        ) : !activities?.length ? (
          <OverviewEmptyState message="Không có hoạt động nào khớp bộ lọc hiện tại." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <Table className="text-sm">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-10 w-[100px] px-3 text-xs font-medium">Loại</TableHead>
                  <TableHead className="h-10 px-3 text-xs font-medium">Tiêu đề</TableHead>
                  <TableHead className="h-10 w-[160px] px-3 text-xs font-medium">Thời gian</TableHead>
                  <TableHead className="h-10 w-[140px] px-3 text-xs font-medium">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((row) => (
                  <TableRow
                    key={`${row.type}-${row.id}`}
                    className="h-11 hover:bg-muted/30"
                  >
                    <TableCell className="px-3 py-2 text-sm font-medium text-muted-foreground">
                      {typeLabel[row.type]}
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <div className="flex flex-col gap-0.5">
                        {row.href ? (
                          <Link
                            to={row.href}
                            className="text-sm font-medium text-foreground hover:text-primary"
                          >
                            {row.title}
                          </Link>
                        ) : (
                          <span className="text-sm font-medium text-foreground">{row.title}</span>
                        )}
                        {row.subtitle ? (
                          <span className="text-xs text-muted-foreground">{row.subtitle}</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-3 py-2 text-sm text-muted-foreground">
                      {formatAt(row.at)}
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <Badge variant={activityBadgeVariant(row)} className="h-6 rounded-md px-2 text-xs">
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
