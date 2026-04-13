import { useState } from 'react';
import {
  Warehouse,
  MapPin,
  User,
  Package,
  ArrowUpDown,
  Plus,
  Eye,
  Pencil,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useWarehouses,
  useWarehouse,
  useCreateWarehouse,
  useUpdateWarehouse,
} from '@/client/hooks/use-queries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ─── Warehouse Form ──────────────────────────────────────────────────────────

interface WarehouseFormData {
  name: string;
  locationAddress: string;
}

function CreateWarehouseDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const createMutation = useCreateWarehouse();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên kho');
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        locationAddress: locationAddress.trim() || undefined,
      });
      setOpen(false);
      setName('');
      setLocationAddress('');
    } catch {
      // toast handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Thêm kho
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Thêm kho hàng mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin kho hàng cần tạo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="warehouse-name">Tên kho *</Label>
              <Input
                id="warehouse-name"
                placeholder="Kho Bình Thạnh"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="warehouse-address">Địa chỉ</Label>
              <Input
                id="warehouse-address"
                placeholder="123 Nguyễn Trãi, Bình Thạnh, TP.HCM"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createMutation.isPending}
            >
              Hủy
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Tạo kho
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Update Warehouse Dialog ─────────────────────────────────────────────────

function UpdateWarehouseDialog({ warehouseId }: { warehouseId: string }) {
  const [open, setOpen] = useState(false);
  const { data: warehouse } = useWarehouse(warehouseId);
  const [name, setName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const updateMutation = useUpdateWarehouse();

  const handleOpen = () => {
    if (warehouse) {
      setName(warehouse.name);
      setLocationAddress(warehouse.locationAddress ?? '');
    }
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên kho');
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: warehouseId,
        data: {
          name: name.trim(),
          locationAddress: locationAddress.trim() || undefined,
        },
      });
      setOpen(false);
    } catch {
      // toast handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleOpen}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Cập nhật kho hàng</DialogTitle>
            <DialogDescription>
              Chỉnh sửa thông tin kho #{warehouse?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="update-warehouse-name">Tên kho *</Label>
              <Input
                id="update-warehouse-name"
                placeholder="Kho Bình Thạnh"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="update-warehouse-address">Địa chỉ</Label>
              <Input
                id="update-warehouse-address"
                placeholder="123 Nguyễn Trãi, Bình Thạnh, TP.HCM"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={updateMutation.isPending}
            >
              Hủy
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Warehouse Detail Sheet ──────────────────────────────────────────────────

function WarehouseDetailSheet({ warehouseId }: { warehouseId: string }) {
  const { data: warehouse, isLoading } = useWarehouse(warehouseId);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Eye className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[420px] sm:max-w-[520px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Chi tiết kho hàng</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="mt-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : warehouse ? (
          <div className="mt-6 space-y-5">
            {/* Name & Status */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Warehouse className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">{warehouse.name}</h3>
                  <Badge
                    variant="outline"
                    className={cn(
                      'mt-0.5 text-xs',
                      warehouse.isActive
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    )}
                  >
                    {warehouse.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                  </Badge>
                </div>
              </div>
              <UpdateWarehouseDialog warehouseId={warehouse.id} />
            </div>

            <Separator />

            {/* Address */}
            {warehouse.locationAddress && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Địa chỉ
                </h4>
                <p className="text-sm">{warehouse.locationAddress}</p>
              </div>
            )}

            {/* Manager */}
            {warehouse.inventory && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Người quản lý
                </h4>
                <div className="text-sm">
                  <p className="font-medium">{warehouse.inventory.user.fullName}</p>
                  <p className="text-muted-foreground text-xs">
                    Mã NV: {warehouse.inventory.employeeCode}
                  </p>
                </div>
              </div>
            )}

            <Separator />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {warehouse._count?.inventoryLots ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Lô hàng</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {warehouse._count?.transactions ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Giao dịch</p>
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Ngày tạo</span>
                <span>
                  {new Date(warehouse.createdAt).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cập nhật lần cuối</span>
                <span>
                  {new Date(warehouse.updatedAt).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

// ─── Table Skeleton ─────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <div className="ml-auto flex gap-1">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function InventoryWarehousesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, isFetching } = useWarehouses({
    page,
    limit: 20,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active' ? 'true' : statusFilter === 'inactive' ? 'false' : undefined,
  });

  const items = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Quản lý Nhà kho</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Theo dõi và quản lý thông tin kho hàng
          </p>
        </div>
        <CreateWarehouseDialog />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v === 'all' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Warehouse className="h-4 w-4" />
            Danh sách kho hàng
            <span className="text-muted-foreground font-normal ml-1 text-sm">({total} kho)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 rounded-full bg-muted p-3">
                <Warehouse className="text-muted-foreground size-6" />
              </div>
              <p className="font-medium">Chưa có kho hàng nào</p>
              <p className="text-muted-foreground text-sm mt-1">
                Tạo kho hàng đầu tiên để bắt đầu
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pr-4 font-medium">
                        <span className="flex items-center gap-1">
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                          Tên kho
                        </span>
                      </th>
                      <th className="pb-3 pr-4 font-medium">Địa chỉ</th>
                      <th className="pb-3 pr-4 font-medium">Người quản lý</th>
                      <th className="pb-3 pr-4 font-medium">Trạng thái</th>
                      <th className="pb-3 pr-4 font-medium text-right">Lô hàng</th>
                      <th className="pb-3 pr-4 font-medium text-right">Giao dịch</th>
                      <th className="pb-3 font-medium text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((warehouse) => (
                      <tr key={warehouse.id} className="align-top">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-primary/10 rounded-md">
                              <Warehouse className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">{warehouse.name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          {warehouse.locationAddress ? (
                            <span className="text-muted-foreground text-xs flex items-start gap-1 max-w-[200px]">
                              <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                              <span className="line-clamp-2">{warehouse.locationAddress}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {warehouse.inventory ? (
                            <div className="flex items-center gap-1.5 text-sm">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              {warehouse.inventory.user.fullName}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              warehouse.isActive
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-gray-50 text-gray-600 border-gray-200'
                            )}
                          >
                            {warehouse.isActive ? (
                              <>
                                <ToggleRight className="h-3 w-3 mr-1" />
                                Hoạt động
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="h-3 w-3 mr-1" />
                                Không
                              </>
                            )}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Package className="h-3 w-3" />
                            {warehouse._count?.inventoryLots ?? 0}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right text-muted-foreground">
                          {warehouse._count?.transactions ?? 0}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <WarehouseDetailSheet warehouseId={warehouse.id} />
                            <UpdateWarehouseDialog warehouseId={warehouse.id} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {items.map((warehouse) => (
                  <div key={warehouse.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-md">
                          <Warehouse className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{warehouse.name}</p>
                          <Badge
                            variant="outline"
                            className={cn(
                              'mt-0.5 text-xs',
                              warehouse.isActive
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-gray-50 text-gray-600 border-gray-200'
                            )}
                          >
                            {warehouse.isActive ? 'Hoạt động' : 'Không hoạt động'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <WarehouseDetailSheet warehouseId={warehouse.id} />
                        <UpdateWarehouseDialog warehouseId={warehouse.id} />
                      </div>
                    </div>
                    {warehouse.locationAddress && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {warehouse.locationAddress}
                      </p>
                    )}
                    {warehouse.inventory && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {warehouse.inventory.user.fullName}
                      </p>
                    )}
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>
                        <Package className="h-3 w-3 inline mr-1" />
                        {warehouse._count?.inventoryLots ?? 0} lô
                      </span>
                      <span>{warehouse._count?.transactions ?? 0} giao dịch</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Trang {page} / {totalPages} — {total} kho
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || isFetching}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || isFetching}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
