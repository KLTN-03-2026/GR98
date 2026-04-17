import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
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

function getCoordinateText(value?: string | null) {
  if (!value?.trim()) return 'Chưa có tọa độ';
  const points = value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
  if (!points.length) return 'Chưa có tọa độ';
  return points.join(' · ');
}

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
  const pageFrom = total === 0 ? 0 : (currentPage - 1) * PAGE_LIMIT + 1;
  const pageTo = Math.min(currentPage * PAGE_LIMIT, total);
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

  const openContract = (contract: ContractResponse) => {
    navigate(`${listBasePath.replace(/\/$/, '')}/${contract.id}`);
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-4 p-4 sm:p-6">
      <Card className="border-dashed border-primary/40">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 lg:max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="h-10 rounded-full border-muted pl-9"
                placeholder="Tìm theo số hợp đồng, nông dân, lô đất..."
              />
            </div>
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
                <option value="ACTIVE">Đang hiệu lực</option>
                <option value="SETTLED">Đã tất toán</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>

              {mode === 'supervisor' && (
                <Button
                  className="rounded-full"
                  onClick={() => navigate(`${listBasePath.replace(/\/$/, '')}/new`)}
                >
                  <Plus className="h-4 w-4" />
                  Tạo hợp đồng
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>
              Hiển thị {contracts.length} / {total} hợp đồng.
            </span>
            <span>Chờ phê duyệt: {waitingApprovalCount}</span>
            <span>Giới hạn mỗi trang: {PAGE_LIMIT}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="soft-success">Đang hiệu lực: {activeCount}</Badge>
            <Badge variant="soft-warning">Chờ duyệt: {waitingApprovalCount}</Badge>
            {mode === 'supervisor' && (
              <Badge variant="soft-info">Bản nháp: {draftCount}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="min-h-0 flex-1 flex flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {contractsError ? (
            <Card>
              <CardContent className="flex items-center justify-center gap-2 py-10">
                <p className="text-sm text-destructive">
                  {(contractsError as Error).message}
                </p>
                <Button variant="ghost" size="sm" onClick={() => refetch()}>
                  Thử lại
                </Button>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
              {Array.from({ length: Math.min(PAGE_LIMIT, 12) }).map((_, index) => (
                <ContractCardSkeleton key={`contract-skeleton-${index}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
              {contracts.map((contract) => (
                <button
                  key={contract.id}
                  type="button"
                  onClick={() => openContract(contract)}
                  className={cn(
                    'rounded-2xl border border-l-4 border-l-primary bg-linear-to-br from-white to-primary/5 p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md',
                  )}
                >
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
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Badge variant={getCropBadgeVariant(contract.cropType)}>
                      {contract.cropType}
                    </Badge>
                    <Badge variant={getGradeBadgeVariant(contract.grade)}>
                      Grade {contract.grade}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    <p>Diện tích chuẩn: {contract.plotDraftAreaHa ?? contract.plot.areaHa} ha</p>
                    <p className="font-medium text-foreground">Grade: {contract.grade}</p>
                    <p className="break-all">Tọa độ: {getCoordinateText(contract.plotDraftCoordinatesText)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isLoading && !contractsError && contracts.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Chưa có hợp đồng phù hợp với bộ lọc hiện tại.
              </CardContent>
            </Card>
          )}
        </div>

        {!isLoading && total > 0 && (
          <div className="mt-3 border-t bg-background pt-3">
            <div className="flex flex-col gap-2 rounded-lg border bg-card px-3 py-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-muted-foreground">
                Hiển thị {pageFrom}-{pageTo} / {total} hợp đồng
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Trang {currentPage} / {totalPages}
                </span>
                <div className="h-3 w-px bg-border" />
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
