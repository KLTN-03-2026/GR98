import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MapPin,
  Phone,
  Plus,
  Save,
  Search,
  Trash2,
  UserRound,
  Wheat,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMe } from '@/client/api/auth/use-me';
import { cn } from '@/lib/utils';
import {
  useCreateSupervisorFarmer,
  useDeleteSupervisorFarmer,
  useSupervisorFarmers,
  useUpdateSupervisorFarmer,
  type FarmerResponse,
  type FarmerStatus,
} from './api';

type FarmerForm = {
  fullName: string;
  phone: string;
  cccd: string;
  province: string;
  address: string;
  bankName: string;
  bankBranch: string;
  bankAccount: string;
  status: FarmerStatus;
};

const PAGE_LIMIT = 15;
const PHONE_REGEX = /^(\+84|0)[0-9]{9,10}$/;
const CCCD_REGEX = /^\d{12}$/;

const defaultForm: FarmerForm = {
  fullName: '',
  phone: '',
  cccd: '',
  province: '',
  address: '',
  bankName: '',
  bankBranch: '',
  bankAccount: '',
  status: 'ACTIVE',
};

function getStatusLabel(status: FarmerStatus) {
  return status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động';
}

function getStatusVariant(status: FarmerStatus) {
  return status === 'ACTIVE' ? ('success' as const) : ('secondary' as const);
}

function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('vi-VN');
}

function FarmerCardSkeleton() {
  return (
    <Card className="animate-pulse border-l-4 border-l-emerald-400/40">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function SupervisorFarmersPage() {
  const { data: me } = useMe();
  const supervisorProfileId = me?.supervisorProfile?.id ?? '';

  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | FarmerStatus>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: queryData, isLoading } = useSupervisorFarmers({
    page: currentPage,
    limit: PAGE_LIMIT,
    search: debouncedKeyword || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    enabled: !!supervisorProfileId,
  });

  const farmers = useMemo(() => queryData?.data ?? [], [queryData]);
  const total = queryData?.total ?? 0;
  const totalPages = Math.max(1, queryData?.totalPages ?? 1);

  const createMutation = useCreateSupervisorFarmer();
  const updateMutation = useUpdateSupervisorFarmer();
  const deleteMutation = useDeleteSupervisorFarmer();
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [selected, setSelected] = useState<FarmerResponse | null>(null);
  const [form, setForm] = useState<FarmerForm>(defaultForm);
  const [deleteTarget, setDeleteTarget] = useState<FarmerResponse | null>(null);
  const [shouldRestoreSheet, setShouldRestoreSheet] = useState(false);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof FarmerForm, string>>
  >({});

  const activeCount = useMemo(
    () => farmers.filter((item) => item.status === 'ACTIVE').length,
    [farmers],
  );
  const pageFrom = total === 0 ? 0 : (currentPage - 1) * PAGE_LIMIT + 1;
  const pageTo = Math.min(currentPage * PAGE_LIMIT, total);

  const goFirstPage = () => setCurrentPage(1);
  const goPrevPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const goNextPage = () =>
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  const goLastPage = () => setCurrentPage(totalPages);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedKeyword, statusFilter]);

  useEffect(() => {
    if (!isLoading && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages, isLoading]);

  const openCreateSheet = () => {
    setMode('create');
    setSelected(null);
    setForm(defaultForm);
    setFormErrors({});
    setShouldRestoreSheet(false);
    setSheetOpen(true);
  };

  const openEditSheet = (row: FarmerResponse) => {
    setMode('edit');
    setSelected(row);
    setForm({
      fullName: row.fullName,
      phone: row.phone,
      cccd: row.cccd,
      province: row.province ?? '',
      address: row.address ?? '',
      bankName: row.bankName ?? '',
      bankBranch: row.bankBranch ?? '',
      bankAccount: row.bankAccount ?? '',
      status: row.status,
    });
    setFormErrors({});
    setShouldRestoreSheet(false);
    setSheetOpen(true);
  };

  const validateForm = () => {
    const errors: Partial<Record<keyof FarmerForm, string>> = {};

    if (!form.fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ tên';
    }
    if (!form.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!PHONE_REGEX.test(form.phone.trim())) {
      errors.phone = 'Số điện thoại không hợp lệ';
    }
    if (!form.cccd.trim()) {
      errors.cccd = 'Vui lòng nhập CCCD';
    } else if (!CCCD_REGEX.test(form.cccd.trim())) {
      errors.cccd = 'CCCD phải gồm đúng 12 chữ số';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openDeleteConfirm = () => {
    if (!selected) return;
    setShouldRestoreSheet(true);
    setSheetOpen(false);
    setDeleteTarget(selected);
  };

  const submitForm = async () => {
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin đã nhập');
      return;
    }

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync({
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          cccd: form.cccd.trim(),
          province: form.province.trim() || undefined,
          address: form.address.trim() || undefined,
          bankName: form.bankName.trim() || undefined,
          bankBranch: form.bankBranch.trim() || undefined,
          bankAccount: form.bankAccount.trim() || undefined,
          status: form.status,
        });
      } else if (selected) {
        await updateMutation.mutateAsync({
          id: selected.id,
          data: {
            fullName: form.fullName.trim(),
            phone: form.phone.trim(),
            cccd: form.cccd.trim(),
            province: form.province,
            address: form.address,
            bankName: form.bankName,
            bankBranch: form.bankBranch,
            bankAccount: form.bankAccount,
            status: form.status,
          },
        });
      }
      setSheetOpen(false);
    } catch {
      // Hook's onError already shows toast
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setShouldRestoreSheet(false);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      if (selected?.id === deleteTarget.id) {
        setSelected(null);
      }
    } catch {
      // Hook's onError already shows toast
    }
  };

  if (!supervisorProfileId) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Không xác định được hồ sơ giám sát viên. Vui lòng đăng nhập lại.
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col gap-5 p-4 sm:p-6">
      <Card className="border-dashed border-emerald-400/50">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="h-10 rounded-full border-muted pl-9"
                placeholder="Tìm theo tên, SĐT, CCCD, tỉnh..."
              />
            </div>
            <Button onClick={openCreateSheet} className="rounded-full">
              <Plus className="h-4 w-4" />
              Thêm nông dân
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={statusFilter === 'ALL' ? 'primary' : 'outline'}
              className="rounded-full"
              onClick={() => setStatusFilter('ALL')}
            >
              Tất cả trạng thái
            </Button>
            <Button
              variant={statusFilter === 'ACTIVE' ? 'primary' : 'outline'}
              className="rounded-full"
              onClick={() => setStatusFilter('ACTIVE')}
            >
              Hoạt động
            </Button>
            <Button
              variant={statusFilter === 'INACTIVE' ? 'primary' : 'outline'}
              className="rounded-full"
              onClick={() => setStatusFilter('INACTIVE')}
            >
              Không hoạt động
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              Hiển thị {farmers.length} / {total} nông dân.
            </span>
            <span>Đang hoạt động: {activeCount}</span>
            <span>Giới hạn mỗi trang: {PAGE_LIMIT}</span>
          </div>
        </CardContent>
      </Card>

      <div className="min-h-0 flex flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
              {Array.from({ length: Math.min(PAGE_LIMIT, 12) }).map((_, index) => (
                <FarmerCardSkeleton key={`supervisor-farmer-skeleton-${index}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
              {farmers.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => openEditSheet(row)}
                  className={cn(
                    'rounded-2xl border border-l-4 border-l-emerald-500 bg-linear-to-br from-white to-emerald-50/60 p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md',
                    selected?.id === row.id && 'ring-2 ring-emerald-200',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-900">
                        {row.fullName}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        CCCD: {row.cccd}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(row.status)}>
                      {getStatusLabel(row.status)}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    <p className="inline-flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {row.phone}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">
                        {row.province || 'Chưa cập nhật tỉnh'}
                      </span>
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <UserRound className="h-4 w-4" />
                      <span className="truncate">
                        {row.supervisor?.user.fullName || 'Bạn đang phụ trách'}
                      </span>
                    </p>
                    <p className="truncate text-xs">
                      NH: {row.bankName || 'Chưa cập nhật'} {row.bankBranch ? `- ${row.bankBranch}` : ''}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">Lô đất: {row._count.plots}</Badge>
                    <Badge variant="outline">
                      Hợp đồng: {row._count.contracts}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isLoading && farmers.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Bạn chưa có nông dân nào trong phạm vi phụ trách.
              </CardContent>
            </Card>
          )}
        </div>

        {!isLoading && totalPages > 0 && (
          <div className="mt-3 border-t bg-background pt-3">
            <div className="flex flex-col gap-2 rounded-lg border bg-card px-3 py-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">
                  Hiển thị {pageFrom}-{pageTo} / {total} nông dân
                </span>
              </div>

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
                    onClick={goFirstPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={goPrevPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={goNextPage}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={goLastPage}
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>
              {mode === 'create' ? 'Thêm nông dân' : 'Cập nhật nông dân'}
            </SheetTitle>
            <SheetDescription>
              Bạn chỉ quản lý nông dân thuộc phạm vi phụ trách của chính mình.
              Khi tạo mới hệ thống tự gán cho hồ sơ supervisor hiện tại.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4 pb-4">
            <div className="space-y-2">
              <Label>Họ tên</Label>
              <Input
                value={form.fullName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, fullName: event.target.value }))
                }
                placeholder="Nguyễn Văn A"
              />
              {formErrors.fullName && (
                <p className="text-xs text-destructive">
                  {formErrors.fullName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Số điện thoại</Label>
              <Input
                value={form.phone}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, phone: event.target.value }))
                }
                placeholder="0987654321"
              />
              {formErrors.phone && (
                <p className="text-xs text-destructive">{formErrors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>CCCD</Label>
              <Input
                value={form.cccd}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, cccd: event.target.value }))
                }
                placeholder="012345678901"
              />
              {formErrors.cccd && (
                <p className="text-xs text-destructive">{formErrors.cccd}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tỉnh/Thành phố</Label>
              <Input
                value={form.province}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, province: event.target.value }))
                }
                placeholder="Đắk Lắk"
              />
            </div>

            <div className="space-y-2">
              <Label>Địa chỉ</Label>
              <Input
                value={form.address}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, address: event.target.value }))
                }
                placeholder="Thôn ..., xã ..., huyện ..."
              />
            </div>

            <div className="space-y-2">
              <Label>Tên ngân hàng</Label>
              <Input
                value={form.bankName}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    bankName: event.target.value,
                  }))
                }
                placeholder="VD: BIDV"
              />
            </div>

            <div className="space-y-2">
              <Label>Chi nhánh ngân hàng</Label>
              <Input
                value={form.bankBranch}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    bankBranch: event.target.value,
                  }))
                }
                placeholder="VD: Chi nhánh Đắk Lắk"
              />
            </div>

            <div className="space-y-2">
              <Label>Số tài khoản ngân hàng</Label>
              <Input
                value={form.bankAccount}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    bankAccount: event.target.value,
                  }))
                }
                placeholder="9704..."
              />
            </div>

            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={form.status === 'ACTIVE' ? 'primary' : 'outline'}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, status: 'ACTIVE' }))
                  }
                >
                  Hoạt động
                </Button>
                <Button
                  type="button"
                  variant={form.status === 'INACTIVE' ? 'primary' : 'outline'}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, status: 'INACTIVE' }))
                  }
                >
                  Không hoạt động
                </Button>
              </div>
            </div>

            {selected && (
              <div className="rounded-xl border border-dashed border-emerald-200 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-emerald-900">
                  <Wheat className="mr-1 inline h-3.5 w-3.5" />
                  Tổng lô đất: {selected._count.plots}
                </p>
                <p>Tổng hợp đồng: {selected._count.contracts}</p>
                <p>Ngày tạo hồ sơ: {formatDate(selected.createdAt)}</p>
              </div>
            )}
          </div>

          <SheetFooter className="gap-2 border-t px-4 pt-4">
            {mode === 'edit' && selected && (
              <Button
                variant="destructive"
                onClick={openDeleteConfirm}
                disabled={isSaving || isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                Xóa nông dân
              </Button>
            )}
            <Button onClick={() => void submitForm()} disabled={isSaving}>
              <Save className="h-4 w-4" />
              {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            if (shouldRestoreSheet) {
              setSheetOpen(true);
              setShouldRestoreSheet(false);
            }
          }
        }}
      >
        <AlertDialogContent variant="error">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa nông dân</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa nông dân "{deleteTarget?.fullName}"? Nếu hồ
              sơ đã phát sinh lô đất/hợp đồng, hệ thống sẽ từ chối xóa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
