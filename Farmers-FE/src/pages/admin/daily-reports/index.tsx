import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Search } from 'lucide-react';
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
  type IncidentHandlingStatus,
  INCIDENT_HANDLING_LABEL,
} from './api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminDailyReportDetailDialog } from './admin-daily-report-detail-dialog';
import { cn } from '@/lib/utils';
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
  const [handlingStatus, setHandlingStatus] = useState<IncidentHandlingStatus | 'ALL'>('ALL');
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
    incidentHandlingStatus:
      reportType === 'INCIDENT' && handlingStatus !== 'ALL' ? handlingStatus : undefined,
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
  }, [
    debouncedKeyword,
    supervisorId,
    from,
    to,
    apiDateRange.from,
    apiDateRange.to,
    reportType,
    handlingStatus,
  ]);

  // Reset filter xử lý sự cố mỗi khi rời khỏi tab Sự cố.
  useEffect(() => {
    if (reportType !== 'INCIDENT' && handlingStatus !== 'ALL') {
      setHandlingStatus('ALL');
    }
  }, [reportType, handlingStatus]);

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
    <div className="space-y-5 p-4 md:p-6">
      <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-xs md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary shadow-xs">
                <CalendarDays className="size-4" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Báo cáo hàng ngày</h1>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Danh sách báo cáo đã gửi từ giám sát viên. Mở chi tiết để xem nội dung và ảnh đính kèm.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
            <Badge variant="secondary" className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-primary">
              {isSummaryTodayMode
                ? `Đã nộp hôm nay: ${summaryData?.submittedCount ?? 0}`
                : `Đã nộp trong khoảng: ${summaryData?.submittedCount ?? 0}`}
            </Badge>
            <Badge variant="destructive" className="rounded-full px-3 py-1">
              {isSummaryTodayMode
                ? `Chưa gửi hôm nay: ${summaryData?.missingPlots ?? 0} lô`
                : `Chưa gửi (lô): ${summaryData?.missingPlots ?? 0}`}
            </Badge>
          </div>
        </div>
      </div>
      <Card className="rounded-2xl border-border/70 bg-white shadow-xs">
        <CardContent className="p-4 md:p-5">
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
              <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                <div
                  className={cn(
                    "grid min-w-0 flex-1 gap-3 md:grid-cols-2 xl:items-end",
                    reportType === 'INCIDENT'
                      ? "xl:grid-cols-[minmax(200px,1.1fr)_minmax(200px,0.85fr)_minmax(150px,0.7fr)_repeat(2,minmax(140px,0.55fr))_auto]"
                      : "xl:grid-cols-[minmax(220px,1.2fr)_minmax(220px,0.9fr)_repeat(2,minmax(150px,0.55fr))_auto]",
                  )}
                >
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">Tìm theo nội dung</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="h-9 rounded-lg border-border/70 bg-white pl-9 shadow-xs focus-visible:ring-primary/20"
                        placeholder="Từ khóa..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">Giám sát viên</Label>
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
                  {reportType === 'INCIDENT' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-600">Trạng thái xử lý</Label>
                      <Select
                        value={handlingStatus}
                        onValueChange={(v) => setHandlingStatus(v as IncidentHandlingStatus | 'ALL')}
                      >
                        <SelectTrigger className="h-9 rounded-lg border-border/70 bg-white shadow-xs focus:ring-primary/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Tất cả</SelectItem>
                          <SelectItem value="PENDING">{INCIDENT_HANDLING_LABEL.PENDING}</SelectItem>
                          <SelectItem value="IN_PROGRESS">
                            {INCIDENT_HANDLING_LABEL.IN_PROGRESS}
                          </SelectItem>
                          <SelectItem value="RESOLVED">{INCIDENT_HANDLING_LABEL.RESOLVED}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label className={`text-xs font-medium ${onlyToday ? 'text-muted-foreground' : 'text-slate-600'}`}>Từ ngày</Label>
                    <Input
                      type="date"
                      className={`h-9 rounded-lg border-border/70 bg-white shadow-xs focus-visible:ring-primary/20 ${isInvalidDateRange ? 'border-destructive' : ''}`}
                      value={from}
                      max={to || undefined}
                      disabled={onlyToday}
                      onChange={(e) => setFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={`text-xs font-medium ${onlyToday ? 'text-muted-foreground' : 'text-slate-600'}`}>Đến ngày</Label>
                    <Input
                      type="date"
                      className={`h-9 rounded-lg border-border/70 bg-white shadow-xs focus-visible:ring-primary/20 ${isInvalidDateRange ? 'border-destructive' : ''}`}
                      value={to}
                      min={from || undefined}
                      disabled={onlyToday}
                      onChange={(e) => setTo(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="flex h-9 items-center gap-2 rounded-lg border border-border/70 bg-white px-3 shadow-xs">
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
                      <Label htmlFor="admin-daily-reports-only-today" className="cursor-pointer whitespace-nowrap text-xs font-medium text-slate-700">
                        Chỉ hôm nay
                      </Label>
                    </div>
                  </div>
                </div>

                <Tabs
                  value={reportType}
                  onValueChange={(v) => setReportType(v as DailyReportType | 'ALL')}
                  className="flex w-full shrink-0 justify-start xl:w-auto xl:justify-end"
                >
                  <TabsList className="grid h-9 w-full grid-cols-2 gap-1 rounded-lg border border-border/70 bg-white p-1 shadow-xs sm:flex xl:w-auto">
                    <TabsTrigger
                      value="ALL"
                      className="rounded-md border border-transparent px-3 py-1 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                    >
                      Tất cả
                    </TabsTrigger>
                    <TabsTrigger
                      value="ROUTINE"
                      className="relative rounded-md border border-transparent px-3 py-1 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                    >
                      Định kỳ
                      {!!countsData?.ROUTINE && countsData.ROUTINE > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-background px-1.5 py-0 text-[10px] shadow-sm"
                        >
                          {countsData.ROUTINE}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="INCIDENT"
                      className="relative rounded-md border border-transparent px-3 py-1 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                    >
                      Sự cố
                      {!!countsData?.INCIDENT && countsData.INCIDENT > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-background px-1.5 py-0 text-[10px] shadow-sm"
                        >
                          {countsData.INCIDENT}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="HARVEST"
                      className="relative rounded-md border border-transparent px-3 py-1 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                    >
                      Thu hoạch
                      {!!countsData?.HARVEST && countsData.HARVEST > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-background px-1.5 py-0 text-[10px] shadow-sm"
                        >
                          {countsData.HARVEST}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {isInvalidDateRange && (
                  <div className="w-full rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive xl:basis-full">
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
