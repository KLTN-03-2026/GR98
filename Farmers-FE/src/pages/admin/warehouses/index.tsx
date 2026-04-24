import { useCallback, useMemo, useState } from "react";
import { Plus, Warehouse as WarehouseIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/custom/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useInventoryStaff } from "@/pages/admin/inventory-staff/api/use-inventory-staff";
import {
  adminWarehouseKeys,
  useAdminWarehouseDetail,
  useAdminWarehousesList,
  useCreateWarehouse,
  useUpdateWarehouse,
} from "./api/use-admin-warehouses";
import type { AdminWarehouseRow } from "./api/types";
import {
  createAdminWarehouseColumns,
  WAREHOUSE_MANAGER_UNASSIGNED,
} from "./warehouses-columns";

const UNASSIGNED = WAREHOUSE_MANAGER_UNASSIGNED;

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export default function AdminWarehousesPage() {
  const queryClient = useQueryClient();
  const { data: rawList = [], isLoading, isFetching } = useAdminWarehousesList();

  const [staffSearch, setStaffSearch] = useState("");
  const { data: staffPage } = useInventoryStaff({
    page: 1,
    limit: 20,
    status: "ACTIVE",
    search: staffSearch.trim() || undefined,
  });
  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [detailId, setDetailId] = useState<string | null>(null);
  const { data: detail, isFetching: detailLoading } = useAdminWarehouseDetail(
    detailId ?? "",
  );

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [managedBy, setManagedBy] = useState<string>(UNASSIGNED);

  const staffOptions = useMemo(() => {
    const rows = staffPage?.data ?? [];
    return rows
      .map((s) => {
        const pid = s.inventoryProfile?.id;
        if (!pid) return null;
        return {
          value: pid,
          label: `${s.fullName} (${s.inventoryProfile?.employeeCode ?? pid.slice(0, 6)})`,
        };
      })
      .filter(Boolean) as { value: string; label: string }[];
  }, [staffPage?.data]);

  const formManagerOptions = useMemo(() => {
    const list = [{ value: UNASSIGNED, label: "Chưa gán" }, ...staffOptions];
    if (
      managedBy !== UNASSIGNED &&
      !list.some((o) => o.value === managedBy)
    ) {
      const w = rawList.find((x) => x.managedBy === managedBy);
      list.splice(1, 0, {
        value: managedBy,
        label: w
          ? `${w.managerFullName ?? "NV"} (${w.managerEmployeeCode ?? "—"})`
          : managedBy.slice(0, 8),
      });
    }
    return list;
  }, [staffOptions, managedBy, rawList]);

  const filteredRows = useMemo(() => {
    if (statusFilter === "ALL") return rawList;
    if (statusFilter === "ACTIVE") return rawList.filter((w) => w.isActive);
    return rawList.filter((w) => !w.isActive);
  }, [rawList, statusFilter]);

  const openCreate = () => {
    setFormMode("create");
    setEditingId(null);
    setName("");
    setLocationAddress("");
    setIsActive(true);
    setManagedBy(UNASSIGNED);
    setStaffSearch("");
    setFormOpen(true);
  };

  const openEdit = useCallback((row: AdminWarehouseRow) => {
    setFormMode("edit");
    setEditingId(row.id);
    setName(row.name);
    setLocationAddress(row.locationAddress ?? "");
    setIsActive(row.isActive);
    setManagedBy(row.managedBy ?? UNASSIGNED);
    setStaffSearch("");
    setFormOpen(true);
  }, []);

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const openDetail = useCallback((row: AdminWarehouseRow) => {
    setDetailId(row.id);
  }, []);

  const columns = useMemo(
    () =>
      createAdminWarehouseColumns({
        onOpenDetail: openDetail,
        onEdit: openEdit,
      }),
    [openDetail, openEdit],
  );

  const handleSubmitForm = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const payload = {
      name: trimmed,
      locationAddress: locationAddress.trim() || undefined,
      isActive,
      managedBy:
        managedBy === UNASSIGNED ? null : managedBy,
    };
    if (formMode === "create") {
      await createMutation.mutateAsync(payload);
    } else if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, data: payload });
    }
    closeForm();
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/8">
              <WarehouseIcon className="size-4 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Quản lý kho hàng</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Danh sách kho của đơn vị, gán nhân viên kho phụ trách và cập nhật trạng thái.
          </p>
        </div>
        <Button type="button" onClick={openCreate} className="shrink-0">
          <Plus className="size-4 mr-2" />
          Thêm kho
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={filteredRows}
            isLoading={isLoading || isFetching}
            searchPlaceholder="Tìm theo tên kho, địa chỉ, nhân viên..."
            enableSorting
            onRowClick={(row) => openDetail(row)}
            onReload={() =>
              queryClient.invalidateQueries({ queryKey: adminWarehouseKeys.list() })
            }
            noResults={
              <span className="text-muted-foreground">Không có kho phù hợp bộ lọc.</span>
            }
            filterToolbar={
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2 min-w-[180px]">
                  <Label className="text-xs">Trạng thái kho</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v as StatusFilter)}
                  >
                    <SelectTrigger className="h-9 w-[200px]">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất cả</SelectItem>
                      <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                      <SelectItem value="INACTIVE">Đang ngưng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>

      <Sheet open={formOpen} onOpenChange={(o) => !o && closeForm()}>
        <SheetContent className="flex flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {formMode === "create" ? "Thêm kho mới" : "Sửa kho hàng"}
            </SheetTitle>
            <SheetDescription>
              Nhập thông tin kho và chọn nhân viên kho phụ trách nếu cần.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-2">
            <div className="space-y-2">
              <Label htmlFor="wh-name">Tên kho</Label>
              <Input
                id="wh-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Kho trung tâm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wh-addr">Địa chỉ</Label>
              <Input
                id="wh-addr"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="Tùy chọn"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="wh-active">Đang hoạt động</Label>
                <p className="text-muted-foreground text-xs">
                  Bỏ chọn nếu kho tạm ngưng tiếp nhận hàng.
                </p>
              </div>
              <Checkbox
                id="wh-active"
                checked={isActive}
                onCheckedChange={(c) => setIsActive(c === true)}
                className="size-5"
                aria-label="Kho đang hoạt động"
              />
            </div>
            <div className="space-y-2">
              <Label>Nhân viên kho phụ trách</Label>
              <p className="text-muted-foreground text-xs">
                Gõ để tìm theo tên, email, mã nhân viên (tối đa 20 kết quả mỗi lần).
              </p>
              <Combobox
                label="Chọn nhân viên kho"
                dataArr={formManagerOptions}
                value={managedBy}
                onChange={(v) => {
                  const s = typeof v === "string" ? v : UNASSIGNED;
                  setManagedBy(s);
                }}
                setSearchGlobal={setStaffSearch}
                debounceTime={400}
                disabled={isSaving}
                variantTrigger="outline"
                className="h-10"
              />
            </div>
          </div>
          <SheetFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={closeForm}>
              Hủy
            </Button>
            <Button
              type="button"
              onClick={() => void handleSubmitForm()}
              disabled={!name.trim() || isSaving}
            >
              {isSaving ? "Đang lưu..." : "Lưu"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent className="flex w-full flex-col overflow-hidden sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Chi tiết kho</SheetTitle>
            <SheetDescription>
              Tồn theo lô và lịch sử giao dịch gần đây.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-2">
            {detailLoading && !detail ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : detail ? (
              <>
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="font-semibold text-lg">{detail.name}</div>
                  <div className="text-muted-foreground text-sm">
                    {detail.locationAddress ?? "Không có địa chỉ"}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {detail.isActive ? (
                      <Badge variant="success">Hoạt động</Badge>
                    ) : (
                      <Badge variant="secondary">Ngưng</Badge>
                    )}
                    {detail.inventory ? (
                      <Badge variant="outline">
                        Phụ trách: {detail.inventory.user.fullName} (
                        {detail.inventory.employeeCode})
                      </Badge>
                    ) : (
                      <Badge variant="outline">Chưa gán nhân viên kho</Badge>
                    )}
                  </div>
                </div>
                <Tabs defaultValue="lots" className="flex-1">
                  <TabsList className="w-full">
                    <TabsTrigger value="lots" className="flex-1">
                      Lô hàng ({detail.inventoryLots.length})
                    </TabsTrigger>
                    <TabsTrigger value="tx" className="flex-1">
                      Giao dịch ({detail.transactions.length})
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="lots" className="mt-3 max-h-[50vh] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead className="text-right">SL (kg)</TableHead>
                          <TableHead>Phân hạng</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.inventoryLots.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-muted-foreground text-center">
                              Chưa có lô hàng
                            </TableCell>
                          </TableRow>
                        ) : (
                          detail.inventoryLots.map((lot) => (
                            <TableRow key={lot.id}>
                              <TableCell className="text-sm">
                                {lot.product.name}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {lot.quantityKg}
                              </TableCell>
                              <TableCell>{lot.qualityGrade}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  <TabsContent value="tx" className="mt-3 max-h-[50vh] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Loại</TableHead>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead className="text-right">SL (kg)</TableHead>
                          <TableHead>Thời gian</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-muted-foreground text-center">
                              Chưa có giao dịch
                            </TableCell>
                          </TableRow>
                        ) : (
                          detail.transactions.map((t) => (
                            <TableRow key={t.id}>
                              <TableCell className="text-sm">{t.type}</TableCell>
                              <TableCell className="text-sm">{t.product.name}</TableCell>
                              <TableCell className="text-right tabular-nums">
                                {t.quantityKg}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                {new Date(t.createdAt).toLocaleString("vi-VN")}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">Không tải được chi tiết.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
