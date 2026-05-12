import type { ComponentProps } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowUpRight } from 'lucide-react';
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
    <Card className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/75 py-0 shadow-[0_18px_56px_rgba(47,93,80,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-card/75">
      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/[0.08] via-transparent to-secondary/[0.08] px-5 py-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
            <Activity className="size-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-[-0.02em]">Hoạt động gần đây</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Hợp đồng, báo cáo{activities?.some((a) => a.type === 'order') ? ', đơn hàng' : ''} mới nhất
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        {isLoading ? (
          <Skeleton className="h-44 w-full rounded-2xl" />
        ) : !activities?.length ? (
          <OverviewEmptyState message="Không có hoạt động nào khớp bộ lọc hiện tại." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70">
            <div className="overflow-x-auto">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow className="border-border/60 bg-muted/35 hover:bg-muted/35">
                    <TableHead className="h-11 w-[110px] px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Loại</TableHead>
                    <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tiêu đề</TableHead>
                    <TableHead className="h-11 w-[180px] px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Thời gian</TableHead>
                    <TableHead className="h-11 w-[150px] px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((row) => (
                    <TableRow
                      key={`${row.type}-${row.id}`}
                      className="h-14 border-border/50 transition-colors hover:bg-primary/[0.04]"
                    >
                      <TableCell className="px-4 py-3 text-sm font-semibold text-muted-foreground">
                        {typeLabel[row.type]}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {row.href ? (
                            <Link
                              to={row.href}
                              className="group/link inline-flex w-fit items-center gap-1 text-sm font-semibold text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
                            >
                              {row.title}
                              <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover/link:opacity-100" />
                            </Link>
                          ) : (
                            <span className="text-sm font-semibold text-foreground">{row.title}</span>
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
                        <Badge variant={activityBadgeVariant(row)} className="h-7 rounded-full px-2.5 text-xs font-semibold">
                          {row.statusLabel}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
