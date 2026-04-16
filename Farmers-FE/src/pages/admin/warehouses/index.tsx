import { useEffect, useMemo, useState } from "react";
import { MapPin, Phone, Plus, Save, Trash2, UserRound, Wheat } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataGrid } from "@/components/data-grid";
import { cn } from "@/lib/utils";
import { useAllSupervisors } from "@/pages/admin/supervisors/api/use-supervisors";
import {
  useCreateFarmer,
  useDeleteFarmer,
  useFarmers,
  useUpdateFarmer,
  type FarmerResponse,
  type FarmerStatus,
} from "@/pages/admin/farmers/api";

type FarmerForm = {
  fullName: string;
  phone: string;
  cccd: string;
  province: string;
  address: string;
  bankAccount: string;
  supervisorId: string;
  status: FarmerStatus;
};

const DEFAULT_PAGE_SIZE = 15;
const PAGE_SIZE_OPTIONS = [10, 15, 20, 30];
const PHONE_REGEX = /^(\+84|0)[0-9]{9,10}$/;
const CCCD_REGEX = /^\d{12}$/;
const UNASSIGNED_SUPERVISOR = "__NONE__";

const defaultForm: FarmerForm = {
  fullName: "",
  phone: "",
  cccd: "",
  province: "",
  address: "",
  bankAccount: "",
  supervisorId: UNASSIGNED_SUPERVISOR,
  status: "ACTIVE",
};

function getStatusLabel(status: FarmerStatus) {
  return status === "ACTIVE" ? "Hoạt động" : "Không hoạt động";
}

function getStatusVariant(status: FarmerStatus) {
  return status === "ACTIVE" ? ("success" as const) : ("secondary" as const);
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("vi-VN");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((chunk) => chunk[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
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

export default function AdminWarehousesPage() {
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | FarmerStatus>("ALL");
  const [supervisorFilter, setSupervisorFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const { data: supervisors = [] } = useAllSupervisors();
  const {
    data: queryData,
    isLoading,
    isError,
    error,
    refetch,
  } = useFarmers({
    page: currentPage,
    limit: pageSize,
    search: keyword.trim() || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    supervisorId: supervisorFilter === "ALL" ? undefined : supervisorFilter,
  });

  const farmers = useMemo(() => queryData?.data ?? [], [queryData]);
  const total = queryData?.total ?? 0;
  const totalPages = Math.max(1, queryData?.totalPages ?? 1);

  const createMutation = useCreateFarmer();
  const updateMutation = useUpdateFarmer();
  const deleteMutation = useDeleteFarmer();
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("edit");
  const [selected, setSelected] = useState<FarmerResponse | null>(null);
  const [form, setForm] = useState<FarmerForm>(defaultForm);
  const [deleteTarget, setDeleteTarget] = useState<FarmerResponse | null>(null);
  const [shouldRestoreSheet, setShouldRestoreSheet] = useState(false);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof FarmerForm, string>>
  >({});

  const activeCount = useMemo(
    () => farmers.filter((item) => item.status === "ACTIVE").length,
    [farmers],
  );

  useEffect(() => {
    if (!isLoading && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages, isLoading]);

  const openCreateSheet = () => {
    setMode("create");
    setSelected(null);
    setForm(defaultForm);
    setFormErrors({});
    setShouldRestoreSheet(false);
    setSheetOpen(true);
  };

  const openEditSheet = (row: FarmerResponse) => {
    setMode("edit");
    setSelected(row);
    setForm({
      fullName: row.fullName,
      phone: row.phone,
      cccd: row.cccd,
      province: row.province ?? "",
      address: row.address ?? "",
      bankAccount: row.bankAccount ?? "",
      supervisorId: row.supervisorId ?? UNASSIGNED_SUPERVISOR,
      status: row.status,
    });
    setFormErrors({});
    setShouldRestoreSheet(false);
    setSheetOpen(true);
  };

  const validateForm = () => {
    const errors: Partial<Record<keyof FarmerForm, string>> = {};

    if (!form.fullName.trim()) {
      errors.fullName = "Vui lòng nhập họ tên";
    }
    if (!form.phone.trim()) {
      errors.phone = "Vui lòng nhập số điện thoại";
    } else if (!PHONE_REGEX.test(form.phone.trim())) {
      errors.phone = "Số điện thoại không hợp lệ";
    }
    if (!form.cccd.trim()) {
      errors.cccd = "Vui lòng nhập CCCD";
    } else if (!CCCD_REGEX.test(form.cccd.trim())) {
      errors.cccd = "CCCD phải gồm đúng 12 chữ số";
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
      toast.error("Vui lòng kiểm tra lại thông tin đã nhập");
      return;
    }

    const supervisorId =
      form.supervisorId === UNASSIGNED_SUPERVISOR ? null : form.supervisorId;

    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          cccd: form.cccd.trim(),
          province: form.province.trim() || undefined,
          address: form.address.trim() || undefined,
          bankAccount: form.bankAccount.trim() || undefined,
          supervisorId: supervisorId || undefined,
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
            bankAccount: form.bankAccount,
            supervisorId,
            status: form.status,
          },
        });
      }
      setSheetOpen(false);
    } catch {
      // Hook onError đã xử lý toast.
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
      // Hook onError đã xử lý toast.
    }
  };

  const resetFilters = () => {
    setKeyword("");
    setStatusFilter("ALL");
    setSupervisorFilter("ALL");
    setCurrentPage(1);
  };

  return (
    <>
      <DataGrid<FarmerResponse>
        title="Quản lý nông dân (test trên Warehouses)"
        description="Bản quản lý nông dân số 2 để kiểm thử DataGrid, không ảnh hưởng trang Farmers chính."
        appearance="management"
        items={farmers}
        isLoading={isLoading}
        error={
          isError
            ? typeof error?.message === "string"
              ? error.message
              : "Không tải được danh sách nông dân."
            : undefined
        }
        onRetry={() => {
          void refetch();
        }}
        keyExtractor={(item) => item.id}
        renderCard={(row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => openEditSheet(row)}
            className={cn(
              "h-full min-h-[188px] w-full rounded-2xl border border-l-4 border-l-emerald-500 bg-linear-to-br from-white to-emerald-50/60 p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md",
              selected?.id === row.id && "ring-2 ring-emerald-200",
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

            <div className="mt-3 flex items-start gap-3">
              <Avatar className="h-11 w-11 rounded-lg">
                <AvatarImage
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    row.fullName,
                  )}&background=dcfce7&color=166534&size=96`}
                  alt={row.fullName}
                />
                <AvatarFallback className="rounded-lg bg-emerald-100 text-emerald-800">
                  {getInitials(row.fullName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 space-y-1.5 text-sm text-muted-foreground">
                <p className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {row.phone}
                </p>
                <p className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">
                    {row.province || "Chưa cập nhật tỉnh"}
                  </span>
                </p>
                <p className="inline-flex items-center gap-2">
                  <UserRound className="h-4 w-4" />
                  <span className="truncate">
                    {row.supervisor?.user.fullName || "Chưa gán giám sát viên"}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">Lô đất: {row._count.plots}</Badge>
              <Badge variant="outline">Hợp đồng: {row._count.contracts}</Badge>
            </div>
          </button>
        )}
        toolbar={{
          search: {
            value: keyword,
            onChange: (value) => {
              setKeyword(value);
              setCurrentPage(1);
            },
            placeholder: "Tìm theo tên, SĐT, CCCD, tỉnh, giám sát viên...",
          },
          filters: (
            <>
              <Button
                variant={statusFilter === "ALL" ? "primary" : "outline"}
                className="rounded-full"
                onClick={() => {
                  setStatusFilter("ALL");
                  setCurrentPage(1);
                }}
              >
                Tất cả trạng thái
              </Button>
              <Button
                variant={statusFilter === "ACTIVE" ? "primary" : "outline"}
                className="rounded-full"
                onClick={() => {
                  setStatusFilter("ACTIVE");
                  setCurrentPage(1);
                }}
              >
                Hoạt động
              </Button>
              <Button
                variant={statusFilter === "INACTIVE" ? "primary" : "outline"}
                className="rounded-full"
                onClick={() => {
                  setStatusFilter("INACTIVE");
                  setCurrentPage(1);
                }}
              >
                Không hoạt động
              </Button>

              <select
                value={supervisorFilter}
                onChange={(event) => {
                  setSupervisorFilter(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 min-w-56 rounded-full border border-input bg-background px-3 text-sm"
              >
                <option value="ALL">Tất cả giám sát viên</option>
                {supervisors.map((item) => (
                  <option
                    key={item.supervisorProfile?.id ?? item.id}
                    value={item.supervisorProfile?.id ?? item.id}
                  >
                    {item.fullName}
                  </option>
                ))}
              </select>
            </>
          ),
          summary: (
            <>
              <span>
                Hiển thị {farmers.length} / {total} nông dân.
              </span>
              <span>Giới hạn mỗi trang: {pageSize}</span>
            </>
          ),
          quickStats: (
            <Badge variant="soft-success">Đang hoạt động: {activeCount}</Badge>
          ),
          customActions: (
            <Button onClick={openCreateSheet} className="rounded-full">
              <Plus className="h-4 w-4" />
              Thêm nông dân
            </Button>
          ),
          onRefresh: () => {
            void refetch();
          },
          onResetFilters: resetFilters,
        }}
        pagination={{
          page: currentPage,
          pageSize,
          totalItems: total,
          totalPages,
          onPageChange: setCurrentPage,
          onPageSizeChange: (nextPageSize) => {
            setPageSize(nextPageSize);
            setCurrentPage(1);
          },
          pageSizeOptions: PAGE_SIZE_OPTIONS,
        }}
        skeleton={{
          count: Math.min(pageSize, 12),
          renderSkeletonCard: (index) => (
            <FarmerCardSkeleton key={`warehouse-farmer-skeleton-${index}`} />
          ),
        }}
        emptyState={{
          title: "Không có nông dân phù hợp",
          description: "Không có nông dân khớp với bộ lọc hiện tại.",
        }}
        layout={{
          minCardWidth: 300,
          equalHeightCards: true,
        }}
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle>
              {mode === "create" ? "Thêm nông dân" : "Cập nhật nông dân"}
            </SheetTitle>
            <SheetDescription>
              Bản quản lý nông dân thứ 2 trên trang Warehouses để kiểm thử DataGrid.
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
                <p className="text-xs text-destructive">{formErrors.fullName}</p>
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
              <Label>Giám sát viên phụ trách</Label>
              <select
                value={form.supervisorId}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    supervisorId: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value={UNASSIGNED_SUPERVISOR}>Chưa phân công</option>
                {supervisors.map((item) => {
                  const supervisorId = item.supervisorProfile?.id;
                  if (!supervisorId) return null;
                  return (
                    <option key={supervisorId} value={supervisorId}>
                      {item.fullName}
                      {item.supervisorProfile?.employeeCode
                        ? ` (${item.supervisorProfile.employeeCode})`
                        : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={form.status === "ACTIVE" ? "primary" : "outline"}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, status: "ACTIVE" }))
                  }
                >
                  Hoạt động
                </Button>
                <Button
                  type="button"
                  variant={form.status === "INACTIVE" ? "primary" : "outline"}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, status: "INACTIVE" }))
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
            {mode === "edit" && selected && (
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
              {isSaving ? "Đang lưu..." : "Lưu thông tin"}
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
              Bạn có chắc muốn xóa nông dân "{deleteTarget?.fullName}"? Nếu hồ sơ
              đã phát sinh lô đất/hợp đồng, hệ thống sẽ từ chối xóa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
