'use client';
import { useState, useCallback, useEffect } from 'react';
import type { AxiosError } from 'axios';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Pencil,
  Trash2,
} from 'lucide-react';
import { userApi, type UserResponse } from '@/client/lib/api-client';
import CreateUserForm from './forms/create-user.form';
import UpdateUserForm from './forms/update-user.form';
import type { FilterItem } from '@/components/custom/filter.popover';
import { FilterPopover } from '@/components/custom/filter.popover';

const USER_FILTER_OPTIONS = [
  {
    key: 'status',
    label: 'Trạng thái',
    values: [
      { value: 'ACTIVE', label: 'Hoạt động' },
      { value: 'INACTIVE', label: 'Không hoạt động' },
      { value: 'SUSPENDED', label: 'Tạm ngưng' },
    ],
  },
  {
    key: 'role',
    label: 'Vai trò',
    values: [
      { value: 'ADMIN', label: 'Quản trị viên' },
      { value: 'SUPERVISOR', label: 'Giám sát viên' },
      { value: 'CLIENT', label: 'Khách hàng' },
    ],
  },
];

function getRoleLabel(role: string) {
  const map: Record<string, string> = {
    ADMIN: 'Quản trị viên',
    SUPERVISOR: 'Giám sát viên',
    CLIENT: 'Khách hàng',
  };
  return map[role] ?? role;
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    ACTIVE: 'Hoạt động',
    INACTIVE: 'Không hoạt động',
    SUSPENDED: 'Tạm ngưng',
  };
  return map[status] ?? status;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function UserCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-0 h-full flex flex-col">
        <div className="hidden sm:flex w-full">
          <div className="flex flex-col items-center justify-center w-20 flex-shrink-0 py-4 gap-2">
            <div className="w-16 h-16 rounded-lg bg-muted" />
            <div className="w-14 h-4 rounded bg-muted" />
          </div>
          <Separator orientation="vertical" className="mx-3 flex-shrink-0" />
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
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(16);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterList, setFilterList] = useState<FilterItem[]>([]);

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterList]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const activeStatus = filterList.find((f) => f.key === 'status')?.values[0] as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | undefined;
      const activeRole = filterList.find((f) => f.key === 'role')?.values[0] as 'ADMIN' | 'SUPERVISOR' | 'CLIENT' | undefined;

      const response = await userApi.list({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
        status: activeStatus,
        role: activeRole,
      });

      const payload = response.data.data;
      setUsers(payload.data);
      setTotal(payload.total);
      setTotalPages(payload.totalPages);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: { message?: string }; message?: string }>;
      const message =
        axiosErr.response?.data?.error?.message ||
        axiosErr.message ||
        'Tải danh sách thất bại';
      setFetchError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearch, filterList]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
    setIsDeleting(true);
    try {
      await userApi.delete(deleteTarget.id);
      toast.success(`Đã xóa người dùng "${deleteTarget.fullName}"`);
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: { message?: string }; message?: string }>;
      const message =
        axiosErr.response?.data?.error?.message ||
        axiosErr.message ||
        'Xóa người dùng thất bại';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search and Filters */}
      <div className="mb-4 space-y-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm theo tên, email, số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <FilterPopover
              filterOptions={USER_FILTER_OPTIONS}
              filterList={filterList}
              onFilterListChange={setFilterList}
              open={isFilterOpen}
              onOpenChange={setIsFilterOpen}
            />
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Thêm người dùng
            </Button>
          </div>
        </div>

        {/* Active filter chips */}
        {filterList.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filterList.map((f) =>
              f.values.map((val) => (
                <Badge key={`${f.key}-${val}`} variant="secondary" className="text-xs">
                  {f.label}: {val}
                </Badge>
              )),
            )}
          </div>
        )}
      </div>

      {/* Error state */}
      {fetchError && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-destructive text-sm">{fetchError}</p>
          <Button variant="ghost" size="sm" onClick={fetchUsers} className="ml-2">
            Thử lại
          </Button>
        </div>
      )}

      {/* Users Grid */}
      {!fetchError && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full w-full pr-4">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: itemsPerPage }).map((_, i) => (
                  <UserCardSkeleton key={i} />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
                <Search className="h-10 w-10 opacity-30" />
                <p className="text-sm">Không tìm thấy người dùng nào</p>
                <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setFilterList([]); }}>
                  Xóa bộ lọc
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 p-2">
                {users.map((user) => (
                  <Card key={user.id} className="group border border-dashed border-primary/30 hover:border-primary/60 hover:shadow-md transition-all duration-200">
                    <CardContent className="p-0 h-full flex flex-col">
                      {/* Mobile layout */}
                      <div className="flex sm:hidden w-full items-center space-x-2 mb-3 p-4">
                        <Avatar className="w-12 h-12 rounded-lg flex-shrink-0">
                          <AvatarImage src={user.avatar ?? undefined} alt={user.fullName} />
                          <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
                            {getInitials(user.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <Badge
                            variant={
                              user.role === 'ADMIN'
                                ? 'dashed'
                                : user.role === 'SUPERVISOR'
                                  ? 'dashed-warning'
                                  : 'dashed-success'
                            }
                            className="text-xs mb-1"
                          >
                            {getRoleLabel(user.role)}
                          </Badge>
                          <h3 className="font-bold text-xl truncate leading-tight mb-1">{user.fullName}</h3>
                          <p className="text-xs text-muted-foreground truncate leading-tight mb-1">
                            {user.phone ?? user.email}
                          </p>
                          <Badge
                            variant={
                              user.status === 'ACTIVE'
                                ? 'success'
                                : user.status === 'SUSPENDED'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                            className="text-xs"
                          >
                            {getStatusLabel(user.status)}
                          </Badge>
                        </div>
                        <div className="flex flex-col items-center justify-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => handleEdit(user)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeletePrompt(user)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Desktop layout */}
                      <div className="hidden sm:flex w-full">
                        <Avatar className="w-16 h-16 rounded-lg ml-5 my-auto">
                          <AvatarImage src={user.avatar ?? undefined} alt={user.fullName} />
                          <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
                            {getInitials(user.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <Separator orientation="vertical" className="mx-3 flex-shrink-0" />
                        <div className="flex-1 flex flex-col justify-center gap-2 min-w-0 py-5">
                          <Badge
                            variant={
                              user.role === 'ADMIN'
                                ? 'dashed'
                                : user.role === 'SUPERVISOR'
                                  ? 'dashed-warning'
                                  : 'dashed-success'
                            }
                            className="text-xs w-fit"
                          >
                            {getRoleLabel(user.role)}
                          </Badge>
                          <h3 className="font-bold text-xl truncate">{user.fullName}</h3>
                          <p className="text-xs text-muted-foreground truncate">{user.phone ?? user.email}</p>
                          <Badge
                            variant={
                              user.status === 'ACTIVE'
                                ? 'success'
                                : user.status === 'SUSPENDED'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                            className="text-xs w-fit"
                          >
                            {getStatusLabel(user.status)}
                          </Badge>
                          {user.role === 'ADMIN' && user.adminProfile && (
                            <p className="text-xs text-muted-foreground truncate">
                              {user.adminProfile.businessName}
                            </p>
                          )}
                          {user.role === 'CLIENT' && user.clientProfile?.province && (
                            <p className="text-xs text-muted-foreground truncate">
                              {user.clientProfile.province}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-center justify-center gap-1 pr-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => handleEdit(user)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeletePrompt(user)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Pagination */}
      {!fetchError && totalPages > 0 && (
        <div className="mt-3 flex-shrink-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-card px-3 py-2.5 shadow-sm">
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
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
                / {total} người dùng
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
                  <span className="hidden sm:inline ml-1">Đầu</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline ml-1">Trước</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <span className="hidden sm:inline mr-1">Sau</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <span className="hidden sm:inline mr-1">Cuối</span>
                  <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forms */}
      <CreateUserForm
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={fetchUsers}
      />

      <UpdateUserForm
        open={isUpdateOpen}
        onOpenChange={setIsUpdateOpen}
        user={selectedUser}
        onSuccess={fetchUsers}
      />

      {/* Delete confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent variant="error">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa người dùng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa người dùng &quot;{deleteTarget?.fullName}&quot;? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
