import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Search, Scale } from 'lucide-react';
import type { PaginationState, Updater } from '@tanstack/react-table';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/custom/combobox';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/data-table';
import { extractData } from '@/client/lib/api-client';
import { plotApi, type PaginatedPlotsResponse } from '@/pages/admin/plots/api';
import { useAllSupervisors } from '@/pages/admin/supervisors/api/use-supervisors';
import {
  dailyReportApi,
  useDailyReport,
  useDailyReports,
  type PaginatedDailyReportsResponse,
  type DailyReportResponse,
  type DailyReportStatus,
  type DailyReportType,
} from './api';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminDailyReportDetailDialog } from './admin-daily-report-detail-dialog';
import { getLocalDayEndIso, getLocalDayStartIso, getTodayLocalIsoDate } from '@/lib/local-day-range';
import { createAdminDailyReportColumns } from './daily-reports-columns';

const PAGE_LIMIT = 15;
const REPORT_PAGE_LIMIT = 16;
const PLOT_PAGE_LIMIT = 20;

export default function AdminDailyReportsPage() {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => new Date());
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [supervisorId, setSupervisorId] = useState<string>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [onlyToday, setOnlyToday] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_LIMIT);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [reportType, setReportType] = useState<DailyReportType | 'ALL'>('ALL');
  const todayIso = getTodayLocalIsoDate(now);
  const isInvalidDateRange = Boolean(from && to && from > to);
  const apiDateRange = useMemo(() => {
    if (isInvalidDateRange || !from?.trim() || !to?.trim()) {
      return { from: undefined as string | undefined, to: undefined as string | undefined };
    }
    return {
      from: getLocalDayStartIso(from.trim()),
      to: getLocalDayEndIso(to.trim()),
    };
  }, [from, to, isInvalidDateRange]);
  const summaryFrom = apiDateRange.from ?? getLocalDayStartIso(todayIso);
  const summaryTo = apiDateRange.to ?? getLocalDayEndIso(todayIso);
  const isSummaryTodayMode = !apiDateRange.from || !apiDateRange.to || onlyToday;

  const { data: supervisorsData } = useAllSupervisors({ status: 'ACTIVE' });
  const supervisors = supervisorsData ?? [];

  const supervisorOptions = useMemo(
    () =>
      supervisors
        .map((s) => {
          const pid = s.supervisorProfile?.id;
          if (!pid) return null;
          return {
            value: pid,
            label: `${s.fullName} (${s.supervisorProfile?.employeeCode ?? pid.slice(0, 6)})`,
          };
        })
        .filter(Boolean) as { value: string; label: string }[],
    [supervisors],
  );

  const { data: listData, isLoading, isFetching } = useDailyReports({
    page: currentPage,
    limit,
    search: debouncedKeyword || undefined,
    supervisorId: supervisorId || undefined,
    from: apiDateRange.from,
    to: apiDateRange.to,
    type: reportType === 'ALL' ? undefined : reportType,
  });

  const { data: detailRow, isFetching: detailLoading } = useDailyReport(detailId ?? '');
  const { data: summaryData } = useQuery({
    queryKey: [
      'daily-reports',
      'admin-summary',
      {
        supervisorId: supervisorId || null,
        from: summaryFrom,
        to: summaryTo,
      },
    ],
    queryFn: async () => {
      const plotIds = new Set<string>();
      let plotPage = 1;
      let plotTotalPages = 1;
      do {
        const response = await plotApi.list({
          page: plotPage,
          limit: PLOT_PAGE_LIMIT,
          id_suppervisor: supervisorId || undefined,
        });
        const payload = extractData<PaginatedPlotsResponse>(response);
        payload.data.forEach((plot) => plotIds.add(plot.id));
        plotTotalPages = Math.max(1, payload.totalPages ?? 1);
        plotPage += 1;
      } while (plotPage <= plotTotalPages);

      const submittedPlotIds = new Set<string>();
      let submittedCount = 0;
      const doneStatuses: DailyReportStatus[] = ['SUBMITTED', 'REVIEWED'];

      for (const status of doneStatuses) {
        let reportPage = 1;
        let reportTotalPages = 1;
        do {
          const response = await dailyReportApi.list({
            page: reportPage,
            limit: REPORT_PAGE_LIMIT,
            status,
            supervisorId: supervisorId || undefined,
            from: summaryFrom,
            to: summaryTo,
          });
          const payload = extractData<PaginatedDailyReportsResponse>(response);
          if (status === 'SUBMITTED') {
            submittedCount += payload.data.length;
          }
          payload.data.forEach((row) => {
            if (plotIds.has(row.plotId)) {
              submittedPlotIds.add(row.plotId);
            }
          });
          reportTotalPages = Math.max(1, payload.totalPages ?? 1);
          reportPage += 1;
        } while (reportPage <= reportTotalPages);
      }

      return {
        totalPlots: plotIds.size,
        submittedCount,
        missingPlots: Math.max(plotIds.size - submittedPlotIds.size, 0),
      };
    },
  });
  const { data: countsData } = useQuery({
    queryKey: ['daily-reports', 'submitted-counts', { supervisorId }],
    queryFn: async () => {
      const [r, i, h] = await Promise.all([
        dailyReportApi.list({
          status: 'SUBMITTED',
          type: 'ROUTINE',
          limit: 1,
          supervisorId: supervisorId || undefined,
        }),
        dailyReportApi.list({
          status: 'SUBMITTED',
          type: 'INCIDENT',
          limit: 1,
          supervisorId: supervisorId || undefined,
        }),
        dailyReportApi.list({
          status: 'SUBMITTED',
          type: 'HARVEST',
          limit: 1,
          supervisorId: supervisorId || undefined,
        }),
      ]);
      return {
        ROUTINE: extractData<PaginatedDailyReportsResponse>(r).total,
        INCIDENT: extractData<PaginatedDailyReportsResponse>(i).total,
        HARVEST: extractData<PaginatedDailyReportsResponse>(h).total,
      };
    },
  });

  const rows = listData?.data ?? [];
  const total = listData?.total ?? 0;
  const totalPages = Math.max(1, listData?.totalPages ?? 1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedKeyword, supervisorId, from, to, apiDateRange.from, apiDateRange.to, reportType]);

  useEffect(() => {
    if (!isLoading && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages, isLoading]);

  const openDetail = useCallback((row: DailyReportResponse) => setDetailId(row.id), []);
  const closeDetail = () => setDetailId(null);

  useEffect(() => {
    if (onlyToday && (from !== todayIso || to !== todayIso)) {
      setFrom(todayIso);
      setTo(todayIso);
    }
  }, [from, to, onlyToday, todayIso]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const columns = useMemo(() => createAdminDailyReportColumns(openDetail), [openDetail]);

  const handlePaginationChange = useCallback((updater: Updater<PaginationState>) => {
    const prev: PaginationState = { pageIndex: currentPage - 1, pageSize: limit };
    const next = typeof updater === 'function' ? updater(prev) : updater;
    setCurrentPage(next.pageIndex + 1);
    setLimit(next.pageSize);
  }, [currentPage, limit]);

  const paginationState = useMemo(
    () => ({ pageIndex: currentPage - 1, pageSize: limit }),
    [currentPage, limit],
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/8">
            <CalendarDays className="size-4 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Báo cáo hàng ngày</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Danh sách báo cáo đã gửi từ giám sát viên. Mở chi tiết để xem nội dung và ảnh đính kèm.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {isSummaryTodayMode
              ? `Đã nộp hôm nay: ${summaryData?.submittedCount ?? 0}`
              : `Đã nộp trong khoảng: ${summaryData?.submittedCount ?? 0}`}
          </Badge>
          <Badge variant="destructive">
            {isSummaryTodayMode
              ? `Chưa gửi hôm nay: ${summaryData?.missingPlots ?? 0} lô`
              : `Chưa gửi (lô): ${summaryData?.missingPlots ?? 0}`}
          </Badge>
        </div>
      </div>

      <Tabs
        value={reportType}
        onValueChange={(v) => setReportType(v as DailyReportType | 'ALL')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:flex gap-1 bg-transparent p-0 h-auto">
          <TabsTrigger
            value="ALL"
            className="rounded-lg border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Tất cả
          </TabsTrigger>
          <TabsTrigger
            value="ROUTINE"
            className="relative rounded-lg border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Định kỳ
            {!!countsData?.ROUTINE && countsData.ROUTINE > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] shadow-sm border-2 border-background"
              >
                {countsData.ROUTINE}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="INCIDENT"
            className="relative rounded-lg border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Sự cố
            {!!countsData?.INCIDENT && countsData.INCIDENT > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] shadow-sm border-2 border-background"
              >
                {countsData.INCIDENT}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="HARVEST"
            className="relative rounded-lg border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Thu hoạch
            {!!countsData?.HARVEST && countsData.HARVEST > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] shadow-sm border-2 border-background"
              >
                {countsData.HARVEST}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {reportType === 'HARVEST' && (
        <Card className="border-emerald-100 bg-emerald-50/50">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Scale className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-900/70">Tổng sản lượng thu hoạch dự kiến</p>
              <p className="text-2xl font-bold text-emerald-700">
                {(listData?.meta?.totalYield ?? 0).toLocaleString('vi-VN')} <span className="text-sm font-normal text-emerald-600/80">kg</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={rows}
            isLoading={isLoading || isFetching}
            hiddenSearch
            enableSorting={false}
            manualPagination
            pageCount={totalPages}
            totalItems={total}
            onPaginationChange={handlePaginationChange}
            state={{ pagination: paginationState }}
            pageSizeOptions={[10, 15, 20, 30, 50]}
            onRowClick={openDetail}
            onReload={() => queryClient.invalidateQueries({ queryKey: ['daily-reports'] })}
            noResults={<span className="text-muted-foreground">Chưa có báo cáo phù hợp.</span>}
            filterToolbar={
              <div className="flex flex-wrap items-end gap-4 w-full">
                <div className="space-y-2 min-w-[200px] flex-1">
                  <Label className="text-xs">Tìm theo nội dung</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-8 h-9"
                      placeholder="Từ khóa..."
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2 min-w-[220px] flex-1 max-w-xs">
                  <Label className="text-xs">Giám sát viên</Label>
                  <Combobox
                    label="Tất cả GSV"
                    dataArr={supervisorOptions}
                    value={supervisorId}
                    onChange={(v) => {
                      if (typeof v !== 'string' || v === 'null') setSupervisorId('');
                      else setSupervisorId(v);
                    }}
                    isNullableSelect
                  />
                </div>
                <div className="space-y-2">
                  <Label className={`text-xs ${onlyToday ? 'text-muted-foreground' : ''}`}>Từ ngày</Label>
                  <Input
                    type="date"
                    className={`h-9 w-[150px] ${isInvalidDateRange ? 'border-destructive' : ''}`}
                    value={from}
                    max={to || undefined}
                    disabled={onlyToday}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={`text-xs ${onlyToday ? 'text-muted-foreground' : ''}`}>Đến ngày</Label>
                  <Input
                    type="date"
                    className={`h-9 w-[150px] ${isInvalidDateRange ? 'border-destructive' : ''}`}
                    value={to}
                    min={from || undefined}
                    disabled={onlyToday}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>
                <div className="flex items-end gap-2 pb-0.5">
                  <div className="flex items-center gap-2 rounded-md border px-3 h-9 bg-background">
                    <Checkbox
                      id="admin-daily-reports-only-today"
                      checked={onlyToday}
                      onCheckedChange={(checked) => {
                        if (checked === true) {
                          const t = getTodayLocalIsoDate();
                          setFrom(t);
                          setTo(t);
                          setOnlyToday(true);
                          setCurrentPage(1);
                        } else {
                          setFrom('');
                          setTo('');
                          setOnlyToday(false);
                          setCurrentPage(1);
                        }
                      }}
                    />
                    <Label htmlFor="admin-daily-reports-only-today" className="text-xs cursor-pointer">
                      Chỉ hôm nay
                    </Label>
                  </div>
                </div>
                {isInvalidDateRange && (
                  <div className="text-xs text-destructive pb-1">
                    Khoảng ngày không hợp lệ: &quot;Từ ngày&quot; phải nhỏ hơn hoặc bằng &quot;Đến ngày&quot;.
                  </div>
                )}
              </div>
            }
          />
        </CardContent>
      </Card>

      <AdminDailyReportDetailDialog
        open={!!detailId}
        onClose={closeDetail}
        report={detailRow}
        loading={detailLoading}
      />
    </div>
  );
}
