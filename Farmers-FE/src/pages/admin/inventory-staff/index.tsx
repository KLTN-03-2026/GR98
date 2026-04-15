import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Mail,
  Phone,
  Plus,
  Save,
  Search,
  Trash2,
  Warehouse,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  useInventoryStaff,
  useCreateInventoryStaff,
  useUpdateInventoryStaff,
  useDeleteInventoryStaff,
  type InventoryStaffResponse,
} from './api';
import { cn } from '@/lib/utils';

type InventoryStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

type InventoryForm = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  status: InventoryStatus;
};

const PAGE_LIMIT = 15;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(\+84|0)[0-9]{9,10}$/;

const defaultForm: InventoryForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  status: 'ACTIVE',
};

function getStatusLabel(status: InventoryStatus) {
  const map: Record<InventoryStatus, string> = {
    ACTIVE: 'Hoạt động',
    INACTIVE: 'Không hoạt động',
    SUSPENDED: 'Tạm ngưng',
  };
  return map[status];
}

function getStatusVariant(status: InventoryStatus) {
  if (status === 'ACTIVE') return 'success' as const;
  if (status === 'SUSPENDED') return 'destructive' as const;
  return 'secondary' as const;
}

function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('vi-VN');
}

export default function AdminInventoryStaffPage() {
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | InventoryStatus>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // ─── TanStack Query / Mutation hooks ─────────────────────────────────────
  const { data: queryData, isLoading } = useInventoryStaff({
    page: currentPage,
    limit: PAGE_LIMIT,
    search: debouncedKeyword || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });
  const staffs = useMemo(() => queryData?.data ?? [], [queryData]);
  const total = queryData?.total ?? 0;
  const totalPages = Math.max(1, queryData?.totalPages ?? 1);

  const createMutation = useCreateInventoryStaff();
  const updateMutation = useUpdateInventoryStaff();
  const deleteMutation = useDeleteInventoryStaff();
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [selected, setSelected] = useState<InventoryStaffResponse | null>(null);
  const [form, setForm] = useState<InventoryForm>(defaultForm);
  const [deleteTarget, setDeleteTarget] = useState<InventoryStaffResponse | null>(null);
  const [shouldRestoreSheet, setShouldRestoreSheet] = useState(false);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof InventoryForm, string>>
  >({});

  const activeCount = useMemo(
    () => staffs.filter((item) => item.status === 'ACTIVE').length,
    [staffs],
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

  const openEditSheet = (row: InventoryStaffResponse) => {
    setMode('edit');
    setSelected(row);
    setForm({
      fullName: row.fullName,
      email: row.email,
      phone: row.phone ?? '',
      password: '',
      status: row.status,
    });
    setFormErrors({});
    setShouldRestoreSheet(false);
    setSheetOpen(true);
  };

  const validateForm = () => {
    const errors: Partial<Record<keyof InventoryForm, string>> = {};

    if (!form.fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ tên';
    }

    if (!form.email.trim()) {
      errors.email = 'Vui lòng nhập email';
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      errors.email = 'Email không hợp lệ';
    }

    if (form.phone.trim() && !PHONE_REGEX.test(form.phone.trim())) {
      errors.phone = 'Số điện thoại không hợp lệ';
    }

    if (mode === 'create') {
      const password = form.password;
      if (!password.trim()) {
        errors.password = 'Vui lòng nhập mật khẩu';
      } else if (password.length < 6) {
        errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      } else if (!/^[A-Z]/.test(password)) {
        errors.password = 'Ký tự đầu tiên phải là chữ in hoa';
      } else if (!/[^A-Za-z0-9]/.test(password)) {
        errors.password = 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt';
      }
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
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim() || undefined,
        });
      } else if (selected) {
        await updateMutation.mutateAsync({
          id: selected.id,
          data: {
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || '',
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

  return (
    <div className="h-full min-h-0 flex flex-col gap-5 p-4 sm:p-6">
      <Card className="border-dashed border-orange-300/60">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="h-10 rounded-full border-muted pl-9"
                placeholder="Tìm theo tên, email, SĐT, mã nhân viên..."
              />
            </div>
            <Button onClick={openCreateSheet} className="rounded-full">
              <Plus className="h-4 w-4" />
              Thêm nhân viên kho
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === 'ALL' ? 'primary' : 'outline'}
              className="rounded-full"
              onClick={() => setStatusFilter('ALL')}
            >
              Tất cả
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
            <Button
              variant={statusFilter === 'SUSPENDED' ? 'primary' : 'outline'}
              className="rounded-full"
              onClick={() => setStatusFilter('SUSPENDED')}
            >
              Tạm ngưng
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Hiển thị {staffs.length} / {total} nhân viên kho.</span>
            <span>Đang hoạt động: {activeCount}</span>
            <span>Giới hạn mỗi trang: {PAGE_LIMIT}</span>
          </div>
        </CardContent>
      </Card>

      <div className="min-h-0 flex flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {isLoading ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Đang tải danh sách nhân viên kho...
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {staffs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openEditSheet(item)}
                  className={cn(
                    'rounded-2xl border border-l-4 border-l-orange-500 bg-linear-to-br from-white to-orange-50/40 p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md',
                    selected?.id === item.id && 'border-orange-500 ring-2 ring-orange-200',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-900">
                        {item.fullName}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {item.inventoryProfile?.employeeCode ?? 'Chưa có mã'}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(item.status)}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <p className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{item.email}</span>
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {item.phone || 'Chưa cập nhật'}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <Warehouse className="h-4 w-4" />
                      {item.inventoryProfile?._count.warehouses ?? 0} kho phụ trách
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isLoading && staffs.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Không có nhân viên kho phù hợp với bộ lọc hiện tại.
              </CardContent>
            </Card>
          )}
        </div>

        {!isLoading && total > 0 && (
          <div className="mt-3 border-t bg-background pt-3">
            <div className="flex flex-col gap-2 rounded-lg border bg-card px-3 py-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                Hiển thị {pageFrom}-{pageTo} / {total} nhân viên kho
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
          className="w-full overflow-y-auto px-0 sm:max-w-xl"
        >
          <SheetHeader className="border-b bg-linear-to-br from-orange-50 via-white to-amber-50 px-5 py-5">
            <SheetTitle className="flex items-center gap-2 text-orange-900">
              <Warehouse className="h-4 w-4 text-orange-600" />
              {mode === 'create'
                ? 'Tạo nhân viên kho'
                : 'Thông tin nhân viên kho'}
            </SheetTitle>
            <SheetDescription>
              {mode === 'create'
                ? 'Tạo tài khoản role INVENTORY trong tenant hiện tại'
                : selected
                  ? `${selected.inventoryProfile?.employeeCode ?? 'N/A'} • Cập nhật ${formatDate(selected.updatedAt)}`
                  : 'Chi tiết nhân viên kho'}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-5 py-5">
            {selected && mode === 'edit' && (
              <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4">
                <p className="text-sm font-semibold text-orange-900">
                  {selected.fullName}
                </p>
                <div className="mt-2 grid gap-2 text-sm text-orange-800 sm:grid-cols-2">
                  <p>Mã NV: {selected.inventoryProfile?.employeeCode ?? 'N/A'}</p>
                  <p>
                    Hired at:{' '}
                    {formatDate(selected.inventoryProfile?.hiredAt ?? null)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline">
                    Kho phụ trách: {selected.inventoryProfile?._count.warehouses ?? 0}
                  </Badge>
                  {(selected.inventoryProfile?.warehouses ?? []).slice(0, 2).map((w) => (
                    <Badge key={w.id} variant="outline">
                      {w.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 rounded-xl border bg-card p-4 shadow-xs">
              <div className="space-y-2">
                <Label htmlFor="inv-fullName">Họ tên</Label>
                <Input
                  id="inv-fullName"
                  value={form.fullName}
                  className={cn(
                    formErrors.fullName &&
                      'border-destructive focus-visible:ring-destructive/20',
                  )}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, fullName: event.target.value }))
                  }
                />
                {formErrors.fullName && (
                  <p className="text-xs text-destructive">{formErrors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="inv-email">Email</Label>
                <Input
                  id="inv-email"
                  type="email"
                  value={form.email}
                  className={cn(
                    formErrors.email &&
                      'border-destructive focus-visible:ring-destructive/20',
                  )}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                />
                {formErrors.email && (
                  <p className="text-xs text-destructive">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="inv-phone">Số điện thoại</Label>
                <Input
                  id="inv-phone"
                  value={form.phone}
                  className={cn(
                    formErrors.phone &&
                      'border-destructive focus-visible:ring-destructive/20',
                  )}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                />
                {formErrors.phone && (
                  <p className="text-xs text-destructive">{formErrors.phone}</p>
                )}
              </div>

              {mode === 'create' && (
                <div className="space-y-2">
                  <Label htmlFor="inv-password">Mật khẩu</Label>
                  <Input
                    id="inv-password"
                    type="password"
                    value={form.password}
                    className={cn(
                      formErrors.password &&
                        'border-destructive focus-visible:ring-destructive/20',
                    )}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    placeholder="Ví dụ: Abcdef@123"
                  />
                  {formErrors.password && (
                    <p className="text-xs text-destructive">{formErrors.password}</p>
                  )}
                </div>
              )}

              {mode === 'edit' && (
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={form.status === 'ACTIVE' ? 'primary' : 'outline'}
                      onClick={() => setForm((prev) => ({ ...prev, status: 'ACTIVE' }))}
                    >
                      Hoạt động
                    </Button>
                    <Button
                      type="button"
                      variant={form.status === 'INACTIVE' ? 'primary' : 'outline'}
                      onClick={() => setForm((prev) => ({ ...prev, status: 'INACTIVE' }))}
                    >
                      Không HĐ
                    </Button>
                    <Button
                      type="button"
                      variant={form.status === 'SUSPENDED' ? 'primary' : 'outline'}
                      onClick={() => setForm((prev) => ({ ...prev, status: 'SUSPENDED' }))}
                    >
                      Tạm ngưng
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <SheetFooter className="border-t bg-background px-5 py-4">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="destructive"
                disabled={mode === 'create'}
                onClick={openDeleteConfirm}
              >
                <Trash2 className="h-4 w-4" />
                Xóa nhân viên kho
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSheetOpen(false)}>
                  Đóng
                </Button>
                <Button onClick={submitForm} disabled={isSaving}>
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (open) return;
          setDeleteTarget(null);
          if (shouldRestoreSheet && !isDeleting) {
            setSheetOpen(true);
          }
          setShouldRestoreSheet(false);
        }}
      >
        <AlertDialogContent variant="error" className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa nhân viên kho</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn chắc chắn muốn xóa <strong>{deleteTarget?.fullName}</strong>?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
