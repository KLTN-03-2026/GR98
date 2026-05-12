import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  CalendarClock,
  Coffee,
  FileText,
  Leaf,
  MapPin,
  Plus,
  Ruler,
  UserRound,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { DataGrid } from '@/components/data-grid';
import {
  useContracts,
  type ContractResponse,
  type ContractStatus,
} from '@/pages/admin/contracts/api';
import {
  getContractStatusBadgeVariant,
  getContractStatusLabel,
  getContractGradeLabel,
  getCropBadgeVariant,
  getCropTypeLabel,
  getGradeBadgeVariant,
} from '@/pages/contracts/components/contract-ui';

const PAGE_LIMIT = 12;

type StatusFilterOption = {
  value: 'ALL' | ContractStatus;
  label: string;
};

const STATUS_FILTERS: StatusFilterOption[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Hiệu lực' },
  { value: 'SIGNED', label: 'Chờ duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'EXPIRED', label: 'Hết hạn' },
];

const SUPERVISOR_STATUS_FILTERS: StatusFilterOption[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'ACTIVE', label: 'Hiệu lực' },
  { value: 'SIGNED', label: 'Chờ duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'EXPIRED', label: 'Hết hạn' },
];

type ContractsManagementViewProps = {
  mode: 'admin' | 'supervisor';
  listBasePath: string;
};

function ContractCardSkeleton() {
  return (
    <Card className="animate-pulse border-l-4 border-l-primary/30">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-44" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </CardContent>
    </Card>
  );
}

/** Crop icon cho badge compact */
function CropIcon({ cropType }: { cropType?: string | null }) {
  const key = (cropType || '').toLowerCase();
  if (key.includes('ca-phe') || key.includes('ca phe') || key.includes('cà phê')) {
    return <Coffee className="h-3 w-3" />;
  }
  return <Leaf className="h-3 w-3" />;
}

export default function ContractsManagementView({
  mode,
  listBasePath,
}: ContractsManagementViewProps) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ContractStatus>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: contractsData,
    isLoading,
    isFetching,
    isPlaceholderData,
    error: contractsError,
    refetch,
  } = useContracts({
    page: currentPage,
    limit: PAGE_LIMIT,
    search: debouncedKeyword || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedKeyword, statusFilter]);

  const contracts = contractsData?.data ?? [];
  const total = contractsData?.total ?? 0;
  const totalPages = Math.max(1, contractsData?.totalPages ?? 1);

  const activeCount = useMemo(
    () => contracts.filter((item) => item.status === 'ACTIVE').length,
    [contracts],
  );
  const waitingApprovalCount = useMemo(
    () => contracts.filter((item) => item.status === 'SIGNED').length,
    [contracts],
  );
  const rejectedCount = useMemo(
    () => contracts.filter((item) => item.status === 'REJECTED').length,
    [contracts],
  );
  const expiredCount = useMemo(
    () => contracts.filter((item) => item.status === 'EXPIRED').length,
    [contracts],
  );
  const draftCount = useMemo(
    () => contracts.filter((item) => item.status === 'DRAFT').length,
    [contracts],
  );

  const openContract = (contract: ContractResponse) => {
    navigate(`${listBasePath.replace(/\/$/, '')}/${contract.id}`);
  };

  const filterOptions = mode === 'supervisor' ? SUPERVISOR_STATUS_FILTERS : STATUS_FILTERS;

  return (
    <DataGrid<ContractResponse>
      items={contracts}
      title="Quản lý hợp đồng"
      titleIcon={<FileText className="size-4 text-primary" />}
      description="Danh sách hợp đồng theo bộ lọc hiện tại. Mở chi tiết để xem thông tin nông dân, lô đất và trạng thái phê duyệt."
      keyExtractor={(contract) => contract.id}
      titleRight={
        <>
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
            <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
            <span>Hiệu lực:</span>
            <span className="font-bold">{activeCount}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
            <span>Chờ duyệt:</span>
            <span className="font-bold">{waitingApprovalCount}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-800">
            <XCircle className="h-3.5 w-3.5 shrink-0" />
            <span>Từ chối:</span>
            <span className="font-bold">{rejectedCount}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span>Hết hạn:</span>
            <span className="font-bold">{expiredCount}</span>
          </div>
        </>
      }
      renderCard={(contract) => (
        <button
          type="button"
          onClick={() => openContract(contract)}
          className={cn(
            'group flex h-full w-full flex-col rounded-2xl border border-l-4 border-l-primary bg-gradient-to-br from-white to-primary/5 p-4 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-l-primary/80 hover:shadow-md',
          )}
        >
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-slate-900">
                {contract.contractNo}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {contract.farmer.fullName} • {contract.plot.plotCode}
              </p>
            </div>
            <Badge variant={getContractStatusBadgeVariant(contract.status)} className="shrink-0">
              {getContractStatusLabel(contract.status)}
            </Badge>
          </div>

          {/* Body */}
          <div className="mt-3 flex-1 space-y-1.5 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <UserRound className="h-4 w-4 shrink-0 text-emerald-600" />
              <span className="truncate">{contract.farmer.fullName}</span>
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-rose-400" />
              <span className="truncate">{contract.plot.plotCode}</span>
            </p>
            <p className="flex items-center gap-2">
              <Ruler className="h-4 w-4 shrink-0 text-sky-400" />
              <span>{contract.plotDraftAreaHa ?? contract.plot?.areaHa ?? '—'} ha</span>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-3 flex shrink-0 flex-wrap items-center gap-1.5 border-t border-dashed border-primary/20 pt-3">
            <Badge variant={getCropBadgeVariant(contract.cropType)} className="inline-flex items-center gap-1">
              <CropIcon cropType={contract.cropType} />
              {getCropTypeLabel(contract.cropType)}
            </Badge>
            <Badge variant={getGradeBadgeVariant(contract.grade)}>
              {getContractGradeLabel(contract.grade)}
            </Badge>
          </div>
        </button>
      )}
      isLoading={isLoading}
      isAwaitingResults={isFetching && isPlaceholderData}
      error={contractsError ? (contractsError as Error).message : undefined}
      onRetry={() => refetch()}
      manualPagination
      manualFiltering
      pagination={{
        page: currentPage,
        pageSize: PAGE_LIMIT,
        totalItems: total,
        totalPages,
        onPageChange: setCurrentPage,
      }}
      toolbar={{
        search: {
          value: keyword,
          onChange: setKeyword,
          debounceMs: 0,
          placeholder: 'Tìm theo số hợp đồng, nông dân, lô đất...',
        },
        filters: (
          <>
            {/* Status segment control */}
            <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-border/60 bg-muted/50 p-1">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-150 whitespace-nowrap',
                    statusFilter === opt.value
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        ),
        customActions:
          mode === 'supervisor' ? (
            <Button
              className="rounded-full shrink-0"
              onClick={() => navigate(`${listBasePath.replace(/\/$/, '')}/new`)}
            >
              <Plus className="h-4 w-4" />
              Tạo hợp đồng
            </Button>
          ) : null,
        summary: (
          <>
            <span>Hiển thị {contracts.length} / {total} hợp đồng.</span>
            <span>Giới hạn mỗi trang: {PAGE_LIMIT}</span>
          </>
        ),
      }}
      emptyState={{
        description: 'Chưa có hợp đồng phù hợp với bộ lọc hiện tại.',
      }}
      skeleton={{
        count: Math.min(PAGE_LIMIT, 12),
        renderSkeletonCard: (index) => (
          <ContractCardSkeleton key={`contract-skeleton-${index}`} />
        ),
      }}
      layout={{
        minCardWidth: 280,
        equalHeightCards: true,
        itemWrapperClassName: 'items-stretch',
      }}
      classNames={{ root: '', content: '' }}
    />
  );
}
