import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
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
  getCropBadgeVariant,
  getGradeBadgeVariant,
} from '@/pages/contracts/components/contract-ui';

const PAGE_LIMIT = 12;

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
  const waitingApprovalCount = useMemo(
    () => contracts.filter((item) => item.status === 'SIGNED').length,
    [contracts],
  );
  const draftCount = useMemo(
    () => contracts.filter((item) => item.status === 'DRAFT').length,
    [contracts],
  );
  const activeCount = useMemo(
    () => contracts.filter((item) => item.status === 'ACTIVE').length,
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

  const openContract = (contract: ContractResponse) => {
    navigate(`${listBasePath.replace(/\/$/, '')}/${contract.id}`);
  };

  return (
    <DataGrid<ContractResponse>
      items={contracts}
      title="Quản lý hợp đồng"
      titleIcon={<FileText className="size-4 text-primary" />}
      description="Danh sách hợp đồng theo bộ lọc hiện tại. Mở chi tiết để xem thông tin nông dân, lô đất và trạng thái phê duyệt."
      keyExtractor={(contract) => contract.id}
      renderCard={(contract) => (
        <button
          type="button"
          onClick={() => openContract(contract)}
          className={cn(
            'flex h-full w-full min-h-0 flex-col rounded-2xl border border-l-4 border-l-primary bg-linear-to-br from-white to-primary/5 p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md',
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-900">
                  {contract.contractNo}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {contract.farmer.fullName} • {contract.plot.plotCode}
                </p>
              </div>
              <Badge variant={getContractStatusBadgeVariant(contract.status)}>
                {getContractStatusLabel(contract.status)}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={getCropBadgeVariant(contract.cropType)}>
                {contract.cropType}
              </Badge>
              <Badge variant={getGradeBadgeVariant(contract.grade)}>
                Grade {contract.grade}
              </Badge>
            </div>
            <div className="mt-auto space-y-1 text-sm text-muted-foreground">
              <p>Diện tích: {contract.plotDraftAreaHa ?? contract.plot?.areaHa ?? '—'} ha</p>
              <p>Lô đất: {contract.plot.plotCode}</p>
            </div>
          </div>
        </button>
      )}
      isLoading={isLoading}
      isAwaitingResults={isFetching && isPlaceholderData}
      error={contractsError ? (contractsError as Error).message : undefined}
      onRetry={() => refetch()}
      manualPagination
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
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as 'ALL' | ContractStatus)
              }
              className="h-9 min-w-[190px] rounded-full border border-input bg-background px-3 text-sm"
            >
              <option value="ALL">Tất cả trạng thái</option>
              {mode === 'supervisor' && <option value="DRAFT">Bản nháp</option>}
              <option value="SIGNED">Chờ phê duyệt</option>
              <option value="REJECTED">Bị từ chối</option>
              <option value="ACTIVE">Đang hiệu lực</option>
              <option value="EXPIRED">Hết hiệu lực</option>
            </select>
          </div>
        ),
        customActions:
          mode === 'supervisor' ? (
            <Button
              className="rounded-full"
              onClick={() => navigate(`${listBasePath.replace(/\/$/, '')}/new`)}
            >
              <Plus className="h-4 w-4" />
              Tạo hợp đồng
            </Button>
          ) : null,
        summary: (
          <>
            <span>
              Hiển thị {contracts.length} / {total} hợp đồng.
            </span>
            <span>Chờ phê duyệt: {waitingApprovalCount}</span>
            <span>Giới hạn mỗi trang: {PAGE_LIMIT}</span>
          </>
        ),
        quickStats: (
          <>
            <Badge variant="soft-success">Đang hiệu lực: {activeCount}</Badge>
            <Badge variant="soft-warning">Chờ duyệt: {waitingApprovalCount}</Badge>
            <Badge variant="soft-destructive">Bị từ chối: {rejectedCount}</Badge>
            <Badge variant="secondary">Hết hiệu lực: {expiredCount}</Badge>
            {mode === 'supervisor' && (
              <Badge variant="soft-info">Bản nháp: {draftCount}</Badge>
            )}
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
      classNames={{ root: 'h-full min-h-0', content: 'min-h-0 flex-1' }}
    />
  );
}
