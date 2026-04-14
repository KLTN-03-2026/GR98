import { useCallback, useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Search,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  supervisorApi,
  type SupervisorResponse,
} from "@/client/lib/api-client";
import { cn } from "@/lib/utils";

type SupervisorStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

type SupervisorForm = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  zoneId: string;
  status: SupervisorStatus;
};

const PAGE_LIMIT = 20;

const defaultForm: SupervisorForm = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  zoneId: "",
  status: "ACTIVE",
};

function getStatusLabel(status: SupervisorStatus) {
  const map: Record<SupervisorStatus, string> = {
    ACTIVE: "Hoạt động",
    INACTIVE: "Không hoạt động",
    SUSPENDED: "Tạm ngưng",
  };
  return map[status];
}

function getStatusVariant(status: SupervisorStatus) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "SUSPENDED") return "destructive" as const;
  return "secondary" as const;
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("vi-VN");
}

export default function AdminSupervisorsPage() {
  const [supervisors, setSupervisors] = useState<SupervisorResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"ALL" | SupervisorStatus>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("edit");
  const [selected, setSelected] = useState<SupervisorResponse | null>(null);
  const [form, setForm] = useState<SupervisorForm>(defaultForm);
  const [deleteTarget, setDeleteTarget] = useState<SupervisorResponse | null>(
    null,
  );
  const [shouldRestoreSheet, setShouldRestoreSheet] = useState(false);

  const goFirstPage = () => setCurrentPage(1);
  const goPrevPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const goNextPage = () =>
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  const goLastPage = () => setCurrentPage(totalPages);

  const activeLabel = useMemo(
    () => supervisors.filter((item) => item.status === "ACTIVE").length,
    [supervisors],
  );

  const pageFrom = total === 0 ? 0 : (currentPage - 1) * PAGE_LIMIT + 1;
  const pageTo = Math.min(currentPage * PAGE_LIMIT, total);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedKeyword, statusFilter]);

  const fetchSupervisors = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await supervisorApi.list({
        page: currentPage,
        limit: PAGE_LIMIT,
        search: debouncedKeyword || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });

      const payload = response.data.data;
      setSupervisors(payload.data);
      setTotal(payload.total);
      setTotalPages(Math.max(1, payload.totalPages));
    } catch (error: unknown) {
      const axiosErr = error as AxiosError<{
        error?: { message?: string };
        message?: string;
      }>;
      const message =
        axiosErr.response?.data?.error?.message ||
        axiosErr.response?.data?.message ||
        axiosErr.message ||
        "Tải danh sách giám sát viên thất bại";
      toast.error(message);
      setSupervisors([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedKeyword, statusFilter]);

  useEffect(() => {
    void fetchSupervisors();
  }, [fetchSupervisors]);

  useEffect(() => {
    if (!isLoading && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages, isLoading]);

  const openCreateSheet = () => {
    setMode("create");
    setSelected(null);
    setForm(defaultForm);
    setShouldRestoreSheet(false);
    setSheetOpen(true);
  };

  const openEditSheet = (row: SupervisorResponse) => {
    setMode("edit");
    setSelected(row);
    setForm({
      fullName: row.fullName,
      email: row.email,
      phone: row.phone ?? "",
      password: "",
      zoneId: row.supervisorProfile?.zoneId ?? "",
      status: row.status,
    });
    setShouldRestoreSheet(false);
    setSheetOpen(true);
  };

  const openDeleteConfirm = () => {
    if (!selected) return;
    setShouldRestoreSheet(true);
    setSheetOpen(false);
    setDeleteTarget(selected);
  };

  const submitForm = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      toast.error("Vui lòng nhập họ tên và email");
      return;
    }

    if (mode === "create" && !form.password.trim()) {
      toast.error("Vui lòng nhập mật khẩu cho giám sát viên mới");
      return;
    }

    setIsSaving(true);
    try {
      if (mode === "create") {
        await supervisorApi.create({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim() || undefined,
          zoneId: form.zoneId.trim() || undefined,
        });
        toast.success("Đã tạo giám sát viên mới");
      } else if (selected) {
        await supervisorApi.update(selected.id, {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || "",
          zoneId: form.zoneId.trim() || null,
          status: form.status,
        });
        toast.success("Đã cập nhật giám sát viên");
      }

      setSheetOpen(false);
      await fetchSupervisors();
    } catch (error: unknown) {
      const axiosErr = error as AxiosError<{
        error?: { message?: string };
        message?: string;
      }>;
      const message =
        axiosErr.response?.data?.error?.message ||
        axiosErr.response?.data?.message ||
        axiosErr.message ||
        "Lưu giám sát viên thất bại";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setShouldRestoreSheet(false);
    try {
      await supervisorApi.delete(deleteTarget.id);
      toast.success(`Đã xóa ${deleteTarget.fullName}`);
      setDeleteTarget(null);
      if (selected?.id === deleteTarget.id) {
        setSheetOpen(false);
        setSelected(null);
      }
      await fetchSupervisors();
    } catch (error: unknown) {
      const axiosErr = error as AxiosError<{
        error?: { message?: string };
        message?: string;
      }>;
      const message =
        axiosErr.response?.data?.error?.message ||
        axiosErr.response?.data?.message ||
        axiosErr.message ||
        "Xóa giám sát viên thất bại";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-full space-y-5 overflow-y-auto p-4 sm:p-6">
      <Card className="border-dashed border-primary/40">
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
              Thêm giám sát viên
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === "ALL" ? "primary" : "outline"}
              className="rounded-full"
              onClick={() => setStatusFilter("ALL")}
            >
              Tất cả
            </Button>
            <Button
              variant={statusFilter === "ACTIVE" ? "primary" : "outline"}
              className="rounded-full"
              onClick={() => setStatusFilter("ACTIVE")}
            >
              Hoạt động
            </Button>
            <Button
              variant={statusFilter === "INACTIVE" ? "primary" : "outline"}
              className="rounded-full"
              onClick={() => setStatusFilter("INACTIVE")}
            >
              Không hoạt động
            </Button>
            <Button
              variant={statusFilter === "SUSPENDED" ? "primary" : "outline"}
              className="rounded-full"
              onClick={() => setStatusFilter("SUSPENDED")}
            >
              Tạm ngưng
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Hiển thị {supervisors.length} / {total} giám sát viên.</span>
            <span>Đang hoạt động: {activeLabel}</span>
            <span>Giới hạn mỗi trang: {PAGE_LIMIT}</span>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Đang tải danh sách giám sát viên...
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {supervisors.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openEditSheet(item)}
              className={cn(
                "rounded-2xl border border-l-4 border-l-primary bg-linear-to-br from-white to-slate-50 p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md",
                selected?.id === item.id && "border-emerald-500 ring-2 ring-emerald-200",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-900">
                    {item.fullName}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {item.supervisorProfile?.employeeCode ?? "Chưa có mã"}
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
                  {item.phone || "Chưa cập nhật"}
                </p>
                <p className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {item.supervisorProfile?.zone?.name || "Chưa gán khu vực"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {!isLoading && supervisors.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Không có giám sát viên phù hợp với bộ lọc hiện tại.
          </CardContent>
        </Card>
      )}

      {!isLoading && total > 0 && (
        <div className="mt-1">
          <div className="flex flex-col gap-2 rounded-lg border bg-card px-3 py-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              Hiển thị {pageFrom}-{pageTo} / {total} giám sát viên
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto px-0 sm:max-w-xl"
        >
          <SheetHeader className="border-b bg-linear-to-br from-emerald-50 via-white to-lime-50 px-5 py-5">
            <SheetTitle className="flex items-center gap-2 text-emerald-900">
              <Users className="h-4 w-4 text-emerald-600" />
              {mode === "create"
                ? "Tạo giám sát viên"
                : "Thông tin giám sát viên"}
            </SheetTitle>
            <SheetDescription>
              {mode === "create"
                ? "Tạo tài khoản role SUPERVISOR trong tenant hiện tại"
                : selected
                  ? `${selected.supervisorProfile?.employeeCode ?? "N/A"} • Cập nhật ${formatDate(selected.updatedAt)}`
                  : "Chi tiết giám sát viên"}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-5 py-5">
            {selected && mode === "edit" && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="text-sm font-semibold text-emerald-900">
                  {selected.fullName}
                </p>
                <div className="mt-2 grid gap-2 text-sm text-emerald-800 sm:grid-cols-2">
                  <p className="inline-flex items-center gap-2">
                    <UserRound className="h-4 w-4" />
                    {selected.supervisorProfile?.employeeCode ?? "N/A"}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {selected.supervisorProfile?.zone
                      ? `${selected.supervisorProfile.zone.name} (${selected.supervisorProfile.zone.district}, ${selected.supervisorProfile.zone.province})`
                      : "Chưa gán zone"}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline">
                    Farmers: {selected.supervisorProfile?._count.farmers ?? 0}
                  </Badge>
                  <Badge variant="outline">
                    Assignments: {selected.supervisorProfile?._count.assignments ?? 0}
                  </Badge>
                  <Badge variant="outline">
                    Reports: {selected.supervisorProfile?._count.dailyReports ?? 0}
                  </Badge>
                </div>
              </div>
            )}

            <div className="space-y-4 rounded-xl border bg-card p-4 shadow-xs">
              <div className="space-y-2">
                <Label htmlFor="sup-fullName">Họ tên</Label>
                <Input
                  id="sup-fullName"
                  value={form.fullName}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, fullName: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sup-email">Email</Label>
                <Input
                  id="sup-email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sup-phone">Số điện thoại</Label>
                <Input
                  id="sup-phone"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                />
              </div>

              {mode === "create" && (
                <div className="space-y-2">
                  <Label htmlFor="sup-password">Mật khẩu</Label>
                  <Input
                    id="sup-password"
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    placeholder="Ví dụ: Abcdef@123"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="sup-zone">Zone ID</Label>
                <Input
                  id="sup-zone"
                  value={form.zoneId}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, zoneId: event.target.value }))
                  }
                  placeholder="Để trống nếu chưa gán khu vực"
                />
              </div>

              {mode === "edit" && (
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <div className="grid grid-cols-3 gap-2">
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
                      Không HĐ
                    </Button>
                    <Button
                      type="button"
                      variant={form.status === "SUSPENDED" ? "primary" : "outline"}
                      onClick={() =>
                        setForm((prev) => ({ ...prev, status: "SUSPENDED" }))
                      }
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
                disabled={mode === "create"}
                onClick={openDeleteConfirm}
              >
                <Trash2 className="h-4 w-4" />
                Xóa giám sát viên
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSheetOpen(false)}>
                  Đóng
                </Button>
                <Button onClick={submitForm} disabled={isSaving}>
                  <Save className="h-4 w-4" />
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
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
            <AlertDialogTitle>Xóa giám sát viên</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn chắc chắn muốn xóa <strong>{deleteTarget?.fullName}</strong>
              ? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
