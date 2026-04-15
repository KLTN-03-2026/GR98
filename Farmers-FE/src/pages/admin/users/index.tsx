"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Mail,
  Phone,
  UserRound,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useUsers, useDeleteUser, type UserResponse } from "./api";
import CreateUserForm from "./forms/create-user.form";
import UpdateUserForm from "./forms/update-user.form";

type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
type UserRole = "ALL" | "ADMIN" | "SUPERVISOR" | "INVENTORY" | "CLIENT";

function getRoleLabel(role: string) {
  const map: Record<string, string> = {
    ADMIN: "Quản trị viên",
    SUPERVISOR: "Giám sát viên",
    INVENTORY: "Nhân viên kho",
    CLIENT: "Khách hàng",
  };
  return map[role] ?? role;
}

function getRoleBadgeVariant(role: string) {
  if (role === "ADMIN") return "dashed";
  if (role === "SUPERVISOR") return "dashed-warning";
  if (role === "INVENTORY") return "dashed-info";
  return "dashed-success";
}

function getCardTone(role: string) {
  if (role === "ADMIN") {
    return {
      border: "border-l-primary",
      hover: "hover:border-primary/60",
      ring: "ring-primary/20",
      bg: "from-white to-emerald-50/50",
    };
  }

  if (role === "SUPERVISOR") {
    return {
      border: "border-l-emerald-500",
      hover: "hover:border-emerald-300",
      ring: "ring-emerald-200",
      bg: "from-white to-emerald-50/70",
    };
  }

  if (role === "INVENTORY") {
    return {
      border: "border-l-orange-500",
      hover: "hover:border-orange-300",
      ring: "ring-orange-200",
      bg: "from-white to-orange-50/60",
    };
  }

  return {
    border: "border-l-sky-500",
    hover: "hover:border-sky-300",
    ring: "ring-sky-200",
    bg: "from-white to-sky-50/60",
  };
}

function getStatusVariant(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "SUSPENDED") return "destructive" as const;
  return "secondary" as const;
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    ACTIVE: "Hoạt động",
    INACTIVE: "Không hoạt động",
    SUSPENDED: "Tạm ngưng",
  };
  return map[status] ?? status;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function UserCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-0 h-full flex flex-col">
        <div className="hidden sm:flex w-full">
          <div className="flex flex-col items-center justify-center w-20 shrink-0 py-4 gap-2">
            <div className="w-16 h-16 rounded-lg bg-muted" />
            <div className="w-14 h-4 rounded bg-muted" />
          </div>
          <Separator orientation="vertical" className="mx-3 shrink-0" />
          <div className="flex-1 flex flex-col justify-center space-y-2 min-w-0 py-4">
            <div className="w-32 h-4 rounded bg-muted" />
            <div className="w-24 h-3 rounded bg-muted" />
            <div className="w-20 h-5 rounded bg-muted" />
            <div className="w-16 h-5 rounded bg-muted" />
          </div>
        </div>
        <div className="flex sm:hidden w-full items-start space-x-3 mb-3 p-4">
          <div className="w-16 h-16 rounded-lg bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="w-28 h-4 rounded bg-muted" />
            <div className="w-20 h-3 rounded bg-muted" />
            <div className="flex gap-2">
              <div className="w-16 h-5 rounded bg-muted" />
              <div className="w-20 h-5 rounded bg-muted" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UsersManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(16);
  const [statusFilter, setStatusFilter] = useState<"ALL" | UserStatus>("ALL");
  const [roleFilter, setRoleFilter] = useState<UserRole>("ALL");

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, roleFilter]);

  // ─── TanStack Query / Mutation hooks ─────────────────────────────────────
  const activeStatus = statusFilter === "ALL" ? undefined : statusFilter;
  const activeRole = roleFilter === "ALL" ? undefined : roleFilter;

  const { data: queryData, isLoading, error: queryError, refetch } = useUsers({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearch || undefined,
    status: activeStatus,
    role: activeRole,
  });

  const deleteMutation = useDeleteUser();
  const isDeleting = deleteMutation.isPending;
  const fetchError = queryError?.message ?? null;
  const activeCount = useMemo(
    () => users.filter((item) => item.status === "ACTIVE").length,
    [users],
  );
  const pageFrom = total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const pageTo = Math.min(currentPage * itemsPerPage, total);

  // Sync query data to local state (for compatibility with existing UI)
  useEffect(() => {
    if (queryData) {
      const raw = queryData as unknown as {
        data?: {
          data?: UserResponse[];
          total?: number;
          totalPages?: number;
        };
        total?: number;
        totalPages?: number;
      };
      const payload = raw.data && Array.isArray(raw.data.data) ? raw.data : raw;
      setUsers(Array.isArray(payload.data) ? payload.data : []);
      setTotal(payload.total ?? 0);
      setTotalPages(payload.totalPages ?? 0);
    }
  }, [queryData]);

  function handleEdit(user: UserResponse) {
    setSelectedUser(user);
    setIsUpdateOpen(true);
  }

  function handleDeletePrompt(user: UserResponse) {
    setDeleteTarget(user);
    setIsDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setIsDeleteOpen(false);
      setDeleteTarget(null);
    } catch {
      // Hook's onError already shows toast
    }
  }

  return (
    <div className="h-full min-h-0 flex flex-col gap-5 p-4 sm:p-6">
      <Card className="border-dashed border-primary/40">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 lg:max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-10 rounded-full border-muted pl-9"
                placeholder="Tìm theo tên, email, số điện thoại..."
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole)}>
                <SelectTrigger className="h-9 w-[180px] rounded-full">
                  <SelectValue placeholder="Vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả vai trò</SelectItem>
                  <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                  <SelectItem value="SUPERVISOR">Giám sát viên</SelectItem>
                  <SelectItem value="INVENTORY">Nhân viên kho</SelectItem>
                  <SelectItem value="CLIENT">Khách hàng</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as "ALL" | UserStatus)
                }
              >
                <SelectTrigger className="h-9 w-[180px] rounded-full">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                  <SelectItem value="INACTIVE">Không hoạt động</SelectItem>
                  <SelectItem value="SUSPENDED">Tạm ngưng</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={() => setIsCreateOpen(true)} className="rounded-full">
                <Plus className="h-4 w-4" />
                Thêm người dùng
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Hiển thị {users.length} / {total} người dùng.</span>
            <span>Đang hoạt động: {activeCount}</span>
            <span>Giới hạn mỗi trang: {itemsPerPage}</span>
          </div>
        </CardContent>
      </Card>

      {fetchError ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-10">
            <p className="text-sm text-destructive">{fetchError}</p>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              Thử lại
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="min-h-0 flex flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                {Array.from({ length: Math.min(itemsPerPage, 12) }).map((_, index) => (
                  <UserCardSkeleton key={`user-skeleton-${index}`} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                {users.map((user) => {
                  const tone = getCardTone(user.role);

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleEdit(user)}
                      className={cn(
                        "rounded-2xl border border-l-4 bg-linear-to-br p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md",
                        tone.border,
                        tone.hover,
                        tone.bg,
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                            {getRoleLabel(user.role)}
                          </Badge>
                          <p className="mt-2 truncate text-base font-semibold text-slate-900">
                            {user.fullName}
                          </p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            ID: {user.id.slice(0, 8)}
                          </p>
                        </div>
                        <Badge variant={getStatusVariant(user.status)}>
                          {getStatusLabel(user.status)}
                        </Badge>
                      </div>

                      <div className="mt-4 flex items-start gap-3">
                        <Avatar className={cn("h-12 w-12 rounded-lg", tone.ring)}>
                          <AvatarImage src={user.avatar ?? undefined} alt={user.fullName} />
                          <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
                            {getInitials(user.fullName)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1 space-y-1.5 text-sm text-muted-foreground">
                          <p className="inline-flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{user.email}</span>
                          </p>
                          <p className="inline-flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {user.phone || "Chưa cập nhật"}
                          </p>
                          {user.role === "ADMIN" && user.adminProfile?.businessName && (
                            <p className="inline-flex items-center gap-2">
                              <UserRound className="h-4 w-4" />
                              <span className="truncate">{user.adminProfile.businessName}</span>
                            </p>
                          )}
                          {user.role === "CLIENT" && user.clientProfile?.province && (
                            <p className="inline-flex items-center gap-2">
                              <UserRound className="h-4 w-4" />
                              <span className="truncate">{user.clientProfile.province}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEdit(user);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeletePrompt(user);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {!isLoading && users.length === 0 && (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Không có người dùng phù hợp với bộ lọc hiện tại.
                </CardContent>
              </Card>
            )}
          </div>

          {!isLoading && totalPages > 0 && (
            <div className="mt-3 border-t bg-background pt-3">
              <div className="flex flex-col gap-2 rounded-lg border bg-card px-3 py-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Hiển thị</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger size="sm" className="h-7 w-16 px-2 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">8</SelectItem>
                      <SelectItem value="12">12</SelectItem>
                      <SelectItem value="16">16</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">
                    {pageFrom}-{pageTo} / {total} người dùng
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
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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
      )}

      {/* Forms */}
      <CreateUserForm
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => refetch()}
      />

      <UpdateUserForm
        open={isUpdateOpen}
        onOpenChange={setIsUpdateOpen}
        user={selectedUser}
        onSuccess={() => refetch()}
      />

      {/* Delete confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent variant="error">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa người dùng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa người dùng &quot;{deleteTarget?.fullName}
              &quot;? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
