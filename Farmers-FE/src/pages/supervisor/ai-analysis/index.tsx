import { useCallback, useMemo, useState } from 'react';
import type { PaginationState, Updater } from '@tanstack/react-table';
import { ScanSearch, Bug, Leaf, AlertTriangle, RefreshCw, Camera } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlantScans, type PlantScanRecord, type PlantScanQueryParams } from './api';
import { createAiAnalysisColumns, AiAnalysisDetailSheet, AiAnalysisCharts } from './components';

const PAGE_LIMIT = 15;

type DangerFilter = 'ALL' | 'Cao' | 'Rất cao' | 'Trung bình' | 'Thấp';
type CategoryFilter = 'ALL' | 'fungal' | 'bacterial' | 'viral' | 'algal' | 'healthy';

// ─── Stat Card ───────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
  colorClass: string;
  isLoading: boolean;
}

function StatCard({ label, value, icon, colorClass, isLoading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`p-3 rounded-full ${colorClass}`}>{icon}</div>
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            {label}
          </span>
          {isLoading ? (
            <Skeleton className="h-7 w-16 mt-1" />
          ) : (
            <span className="text-2xl font-bold text-foreground">{value ?? 0}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────

export default function SupervisorAIAnalysisPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_LIMIT);
  const [dangerFilter, setDangerFilter] = useState<DangerFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<PlantScanRecord | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const queryParams = useMemo((): PlantScanQueryParams => ({
    page: currentPage,
    limit,
    ...(dangerFilter !== 'ALL' ? { dangerLevel: dangerFilter } : {}),
    ...(categoryFilter !== 'ALL' ? { category: categoryFilter } : {}),
  }), [currentPage, limit, dangerFilter, categoryFilter]);

  const { data, isLoading, isFetching, refetch } = usePlantScans(queryParams);
  const { data: chartData, isLoading: chartLoading } = usePlantScans({ limit: 50 });

  const rows = data?.data ?? [];
  const chartRows = chartData?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const meta = data?.meta;

  const handleView = useCallback((record: PlantScanRecord) => {
    setSelectedRecord(record);
    setSheetOpen(true);
  }, []);

  const columns = useMemo(() => createAiAnalysisColumns(handleView), [handleView]);

  const handlePaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      const prev: PaginationState = { pageIndex: currentPage - 1, pageSize: limit };
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setCurrentPage(next.pageIndex + 1);
      setLimit(next.pageSize);
    },
    [currentPage, limit],
  );

  const paginationState = useMemo(
    () => ({ pageIndex: currentPage - 1, pageSize: limit }),
    [currentPage, limit],
  );

  const resetFilters = () => {
    setDangerFilter('ALL');
    setCategoryFilter('ALL');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/8">
              <ScanSearch className="size-4 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Giám sát bệnh cây trồng AI</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Tổng hợp kết quả phân tích bệnh từ thực địa — dữ liệu tự động từ Farmer App.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200"
            onClick={() => window.open('http://localhost:5174', '_blank')}
          >
            <Camera className="h-4 w-4 mr-2" />
            Máy quét AI thực địa
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Tổng lượt quét"
          value={meta?.totalScans}
          icon={<ScanSearch className="h-5 w-5 text-purple-600" />}
          colorClass="bg-purple-100"
          isLoading={isLoading}
        />
        <StatCard
          label="Phát hiện bệnh"
          value={meta?.diseaseCount}
          icon={<Bug className="h-5 w-5 text-red-600" />}
          colorClass="bg-red-100"
          isLoading={isLoading}
        />
        <StatCard
          label="Cây khỏe mạnh"
          value={meta?.healthyCount}
          icon={<Leaf className="h-5 w-5 text-green-600" />}
          colorClass="bg-green-100"
          isLoading={isLoading}
        />
        <StatCard
          label="Cảnh báo nghiêm trọng"
          value={meta?.dangerHighCount}
          icon={<AlertTriangle className="h-5 w-5 text-orange-600" />}
          colorClass="bg-orange-100"
          isLoading={isLoading}
        />
      </div>

      {/* Charts */}
      <AiAnalysisCharts records={chartRows} isLoading={chartLoading} />

      {/* Table */}
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
            pageSizeOptions={[10, 15, 20, 30]}
            onRowClick={handleView}
            onReload={() => void refetch()}
            noResults={
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <ScanSearch className="h-10 w-10 opacity-30" />
                <span className="text-sm">Chưa có dữ liệu quét AI.</span>
                <span className="text-xs">Kết quả sẽ xuất hiện tự động khi supervisor dùng Farmer App ngoài thực địa.</span>
              </div>
            }
            filterToolbar={
              <div className="flex flex-wrap gap-2 items-center">
                {/* Category filters */}
                {(
                  [
                    { key: 'ALL' as const, label: 'Tất cả' },
                    { key: 'fungal' as const, label: 'Nấm' },
                    { key: 'bacterial' as const, label: 'Vi khuẩn' },
                    { key: 'viral' as const, label: 'Virus' },
                    { key: 'healthy' as const, label: 'Khỏe mạnh' },
                  ] satisfies { key: CategoryFilter; label: string }[]
                ).map((t) => (
                  <Button
                    key={t.key}
                    type="button"
                    variant={categoryFilter === t.key ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => { setCategoryFilter(t.key); setCurrentPage(1); }}
                  >
                    {t.label}
                  </Button>
                ))}

                <span className="text-muted-foreground text-xs px-1">|</span>

                {/* Danger level filters */}
                {(
                  [
                    { key: 'ALL' as const, label: 'Tất cả mức' },
                    { key: 'Cao' as const, label: '🔴 Cao' },
                    { key: 'Rất cao' as const, label: '🚨 Rất cao' },
                    { key: 'Trung bình' as const, label: '🟡 Trung bình' },
                    { key: 'Thấp' as const, label: '🟢 Thấp' },
                  ] satisfies { key: DangerFilter; label: string }[]
                ).map((t) => (
                  <Button
                    key={t.key}
                    type="button"
                    variant={dangerFilter === t.key ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => { setDangerFilter(t.key); setCurrentPage(1); }}
                  >
                    {t.label}
                  </Button>
                ))}

                {(dangerFilter !== 'ALL' || categoryFilter !== 'ALL') && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="text-muted-foreground"
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <AiAnalysisDetailSheet
        record={selectedRecord}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
