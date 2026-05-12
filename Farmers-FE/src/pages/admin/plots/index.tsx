import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Coffee,
  Edit3,
  Layers3,
  Leaf,
  MapPin,
  Save,
  Sprout,
  Trash2,
  Users,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { DataGrid } from "@/components/data-grid";
import {
  usePlots,
  useDeletePlot,
  useUpdatePlot,
  type PlotResponse,
} from "./api";
import { useAllSupervisors } from "@/pages/admin/supervisors/api/use-supervisors";

type CropType = "sau-rieng" | "ca-phe";

type PlotItem = PlotResponse;
const LOCAL_PLOT_OVERRIDES_KEY = "gis_plot_overrides_v1";

type PlotFieldOverride = {
  plotName?: string;
  farmerName?: string;
  farmerPhone?: string;
  farmerCccd?: string;
  contractId?: string;
  isDeleted?: boolean;
};



const getCropLabel = (crop: CropType) =>
  crop === "sau-rieng" ? "Sầu riêng" : "Cà phê";
const getCropBadgeClass = (crop: CropType) =>
  crop === "ca-phe"
    ? "border-amber-300 bg-amber-50 text-amber-800"
    : "border-lime-300 bg-lime-50 text-lime-800";

const parseContractCoords = (text?: string | null): Array<[number, number]> => {
  if (!text?.trim()) return [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const pairs: Array<[number, number]> = [];
  for (const line of lines) {
    const parts = line.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) { pairs.push([lat, lng]); continue; }
    }
    break;
  }
  return pairs;
};

export default function PlotsPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<"all" | CropType>("all");
  const [supervisorFilterId, setSupervisorFilterId] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlotItem | null>(null);
  const [reopenSheetPlotId, setReopenSheetPlotId] = useState<string | null>(null);

  // TanStack Query Hooks
  const { data: plotsData, isLoading, isFetching } = usePlots({
    page: currentPage,
    limit: itemsPerPage,
    search: keyword.trim() || undefined,
    cropType: filter === "all" ? undefined : filter,
    id_suppervisor: supervisorFilterId === "all" ? undefined : supervisorFilterId,
  });

  const { data: allSupervisorsData, isLoading: isLoadingSupervisors } = useAllSupervisors({
    status: "ACTIVE",
  });

  const updateMutation = useUpdatePlot();
  const deleteMutation = useDeletePlot();
  const queryClient = useQueryClient();

  const plots = plotsData?.data ?? [];
  const total = plotsData?.total ?? 0;
  const totalPages = plotsData?.totalPages ?? 1;

  const supervisors = useMemo(() => {
    if (!allSupervisorsData) return [];
    return allSupervisorsData
      .filter((row) => Boolean(row.supervisorProfile?.id))
      .map((row) => ({
        id: row.supervisorProfile!.id,
        name: row.fullName,
        employeeCode: row.supervisorProfile?.employeeCode,
      }));
  }, [allSupervisorsData]);

  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [sheet, setSheet] = useState<
    Pick<
      PlotItem,
      "plotName" | "farmerName" | "contractId" | "areaHa" | "cropType"
    >
  >({
    plotName: "",
    farmerName: "",
    contractId: "",
    areaHa: 0,
    cropType: "ca-phe",
  });
  const [formErrors, setFormErrors] = useState<
    Partial<Record<"plotName" | "farmerName" | "contractId" | "areaHa", string>>
  >({});

  const totalArea = useMemo(
    () => plots.reduce((sum, item) => sum + item.areaHa, 0),
    [plots],
  );
  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, filter, supervisorFilterId]);

  const readLocalOverrides = () => {
    try {
      const raw = localStorage.getItem(LOCAL_PLOT_OVERRIDES_KEY);
      if (!raw) return {} as Record<string, PlotFieldOverride>;
      const parsed = JSON.parse(raw) as Record<string, PlotFieldOverride>;
      return parsed || {};
    } catch {
      return {} as Record<string, PlotFieldOverride>;
    }
  };

  const writeLocalOverrides = (value: Record<string, PlotFieldOverride>) => {
    localStorage.setItem(LOCAL_PLOT_OVERRIDES_KEY, JSON.stringify(value));
  };

  const isSaving = updateMutation.isPending || deleteMutation.isPending;

  const openSheet = (plot: PlotItem) => {
    setEditingId(plot.id);
    setSheet({
      plotName: plot.plotName,
      farmerName: plot.farmerName,
      contractId: plot.contractId,
      areaHa: plot.areaHa,
      cropType: plot.cropType,
    });
    setFormErrors({});
    setSelectedSupervisorId(plot.id_suppervisor || "");
    setSheetOpen(true);
  };

  const requestDelete = (plot: PlotItem, fromSheet = false) => {
    if (fromSheet && sheetOpen) {
      setReopenSheetPlotId(plot.id);
      setSheetOpen(false);
    } else {
      setReopenSheetPlotId(null);
    }
    setDeleteTarget(plot);
  };

  const validateSheetForm = () => {
    const errors: Partial<
      Record<"plotName" | "farmerName" | "contractId" | "areaHa", string>
    > = {};

    if (!sheet.plotName.trim()) {
      errors.plotName = "Vui lòng nhập tên lô đất";
    }

    if (!sheet.farmerName.trim()) {
      errors.farmerName = "Vui lòng nhập tên nông dân";
    }

    if (!Number.isFinite(sheet.areaHa) || sheet.areaHa <= 0) {
      errors.areaHa = "Diện tích phải lớn hơn 0";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!editingId) return;
    if (!validateSheetForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin lô đất");
      return;
    }

    const selectedSupervisor = supervisors.find(
      (item) => item.id === selectedSupervisorId,
    );

    if (!selectedSupervisorId || !selectedSupervisor) {
      toast.error("Vui lòng chọn giám sát viên phụ trách");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: editingId,
        data: {
          id_suppervisor: selectedSupervisorId,
          name_suppervisor: selectedSupervisor.name,
        },
      });

      const updatedOverrides = {
        ...readLocalOverrides(),
        [editingId]: {
          plotName: sheet.plotName,
          farmerName: sheet.farmerName,
          contractId: sheet.contractId,
          isDeleted: false,
        },
      };
      writeLocalOverrides(updatedOverrides);

      setSheetOpen(false);
    } catch {
      // Error handled by mutation hook
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    try {
      await deleteMutation.mutateAsync(target.id);

      // Clear local override after DB delete to avoid stale local state.
      const currentOverrides = readLocalOverrides();
      if (currentOverrides[target.id]) {
        delete currentOverrides[target.id];
        writeLocalOverrides(currentOverrides);
      }

      queryClient.invalidateQueries({ queryKey: ["plots"] });
      setDeleteTarget(null);
      if (editingId === target.id) {
        setSheetOpen(false);
        setEditingId(null);
      }
    } catch {
      // Error toast handled by mutation hook
    }
  };

  const editingPlot = plots.find((item) => item.id === editingId) ?? null;

  return (
    <div className="flex flex-col gap-0">
      <DataGrid<PlotItem>
        items={plots}
        title="Quản lý lô đất"
        titleIcon={<MapPin className="size-4 text-primary" />}
        description="Danh sách lô đất đang quản lý. Mở chi tiết để chỉnh sửa thông tin lô, giám sát viên phụ trách và dữ liệu liên quan."
        keyExtractor={(plot) => plot.id}
        renderCard={(plot) => (
          <button
            type="button"
            onClick={() => openSheet(plot)}
            className={cn(
              "flex h-full w-full flex-col rounded-2xl border border-l-4 border-l-emerald-500 bg-gradient-to-br from-white to-emerald-50/40 p-4 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-l-emerald-600 hover:shadow-md",
              editingId === plot.id && "ring-2 ring-emerald-200",
            )}
          >
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-slate-900">
                  {plot.plotName}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {plot.lotCode}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-full text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                  onClick={(event) => {
                    event.stopPropagation();
                    openSheet(plot);
                  }}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-full text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                  onClick={(event) => {
                    event.stopPropagation();
                    requestDelete(plot);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="mt-3 flex-1 space-y-1.5 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <UserRound className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="truncate">{plot.farmerName}</span>
              </p>
              <p className="flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0 text-sky-500" />
                <span className="truncate">
                  {plot.name_suppervisor || (
                    <span className="italic text-muted-foreground/60">Chưa phân công</span>
                  )}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-rose-400" />
                <span className="truncate">{plot.district}, {plot.province}</span>
              </p>
            </div>

            {/* Footer */}
            <div className="mt-3 flex shrink-0 flex-wrap items-center gap-1.5 border-t border-dashed border-emerald-100 pt-3">
              <Badge variant="outline" className={getCropBadgeClass(plot.cropType)}>
                {getCropLabel(plot.cropType)}
              </Badge>
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                {plot.areaHa} ha
              </Badge>
            </div>
          </button>
        )}
        isLoading={isLoading}
        isAwaitingResults={isFetching && !isLoading}
        manualPagination
        manualFiltering
        pagination={{
          page: currentPage,
          pageSize: itemsPerPage,
          totalItems: total,
          totalPages: Math.max(1, totalPages),
          onPageChange: setCurrentPage,
        }}
        titleRight={
          <>
            <div className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-800">
              <Layers3 className="h-3.5 w-3.5 shrink-0" />
              <span>Tổng lô:</span>
              <span className="font-bold">{total}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
              <Sprout className="h-3.5 w-3.5 shrink-0" />
              <span>Diện tích:</span>
              <span className="font-bold">{totalArea.toFixed(1)} ha</span>
            </div>
          </>
        }
        toolbar={{
          search: {
            value: keyword,
            onChange: setKeyword,
            debounceMs: 0,
            placeholder: "Tìm theo tên lô, mã lô, tỉnh, nông dân...",
          },
          filters: (
            <>
              {/* Crop type segment control */}
              <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-border/50 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-150 whitespace-nowrap",
                    filter === "all"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("ca-phe")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-150 whitespace-nowrap",
                    filter === "ca-phe"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Coffee className="h-3 w-3" />
                  Cà phê
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("sau-rieng")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-150 whitespace-nowrap",
                    filter === "sau-rieng"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Leaf className="h-3 w-3" />
                  Sầu riêng
                </button>
              </div>
            </>
          ),
          summary: (
            <>
              <span>Hiển thị {plots.length} / {total} lô đất.</span>
              <span>Giới hạn mỗi trang: {itemsPerPage}</span>
            </>
          ),
        }}
        contentHeader={
          <div className="flex w-full items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
              <Users className="h-4 w-4 text-emerald-600" />
              Lọc theo giám sát viên
            </span>
            <div className="relative flex items-center">
              <Users className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-emerald-600 z-10" />
              <select
                value={supervisorFilterId}
                onChange={(event) => setSupervisorFilterId(event.target.value)}
                disabled={isLoadingSupervisors}
                className="h-9 appearance-none rounded-full border border-border/60 bg-white pl-8 pr-5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70 min-w-[16rem] shadow-xs"
              >
                <option value="all">Tất cả giám sát viên</option>
                {supervisors.map((item) => (
                  <option key={`plot-filter-supervisor-${item.id}`} value={item.id}>
                    {item.name}
                    {item.employeeCode ? ` (${item.employeeCode})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        }
        emptyState={{
          description: "Không tìm thấy lô đất phù hợp với bộ lọc hiện tại.",
        }}
        skeleton={{ count: itemsPerPage }}
        layout={{
          minCardWidth: 280,
          equalHeightCards: true,
          itemWrapperClassName: "items-stretch",
        }}
        classNames={{ root: "", content: "" }}
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col overflow-hidden px-0 sm:max-w-xl"
        >
          <SheetHeader className="border-b bg-linear-to-br from-emerald-50 via-white to-lime-50 px-5 py-5">
            <SheetTitle className="flex items-center gap-2 text-emerald-900">
              <Sprout className="h-4 w-4 text-emerald-600" />
              Sheet quản lý lô đất
            </SheetTitle>
            <SheetDescription>
              {editingPlot
                ? `${editingPlot.lotCode} • Cập nhật lần cuối ${editingPlot.updatedAt}`
                : "Thông tin lô đất"}
            </SheetDescription>
            {editingPlot && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-emerald-300 text-emerald-700"
                >
                  {editingPlot.lotCode}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-slate-100 text-slate-700"
                >
                  {editingPlot.areaHa} ha
                </Badge>
                <Badge
                  variant="secondary"
                  className={getCropBadgeClass(editingPlot.cropType)}
                >
                  {getCropLabel(editingPlot.cropType)}
                </Badge>
              </div>
            )}
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {editingPlot && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                <p className="text-sm font-semibold text-emerald-900">
                  {editingPlot.plotName}
                </p>
                <div className="mt-2 grid gap-2 text-sm text-emerald-800/90 sm:grid-cols-2">
                  <p className="inline-flex items-center gap-2">
                    <UserRound className="h-4 w-4" />
                    {editingPlot.farmerName}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <UserRound className="h-4 w-4" />
                    GS: {editingPlot.name_suppervisor || "Chưa phân công"}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {editingPlot.district}, {editingPlot.province}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-xl border bg-card p-4 shadow-xs">
              <p className="mb-4 text-sm font-semibold text-foreground">
                Thông tin chỉnh sửa
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plot-name">Tên lô đất</Label>
                  <Input
                    id="plot-name"
                    value={sheet.plotName}
                    className={cn(
                      formErrors.plotName &&
                      "border-destructive focus-visible:ring-destructive/20",
                    )}
                    onChange={(event) =>
                      setSheet((prev) => ({
                        ...prev,
                        plotName: event.target.value,
                      }))
                    }
                  />
                  {formErrors.plotName && (
                    <p className="text-xs text-destructive">{formErrors.plotName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plot-farmer">Nông dân phụ trách</Label>
                  <Input
                    id="plot-farmer"
                    value={sheet.farmerName}
                    className={cn(
                      formErrors.farmerName &&
                      "border-destructive focus-visible:ring-destructive/20",
                    )}
                    onChange={(event) =>
                      setSheet((prev) => ({
                        ...prev,
                        farmerName: event.target.value,
                      }))
                    }
                  />
                  {formErrors.farmerName && (
                    <p className="text-xs text-destructive">{formErrors.farmerName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plot-contract">Mã hợp đồng</Label>
                  <Input
                    id="plot-contract"
                    value={sheet.contractId}
                    onChange={(event) =>
                      setSheet((prev) => ({
                        ...prev,
                        contractId: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plot-area">Diện tích (ha)</Label>
                  <Input
                    id="plot-area"
                    type="number"
                    min={0}
                    step="0.1"
                    value={sheet.areaHa}
                    className={cn(
                      formErrors.areaHa &&
                      "border-destructive focus-visible:ring-destructive/20",
                    )}
                    onChange={(event) =>
                      setSheet((prev) => ({
                        ...prev,
                        areaHa: Number.isFinite(Number(event.target.value))
                          ? Number(event.target.value)
                          : prev.areaHa,
                      }))
                    }
                  />
                  {formErrors.areaHa && (
                    <p className="text-xs text-destructive">{formErrors.areaHa}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plot-supervisor">Giám sát viên phụ trách</Label>
                  <select
                    id="plot-supervisor"
                    value={selectedSupervisorId}
                    onChange={(event) =>
                      setSelectedSupervisorId(event.target.value)
                    }
                    disabled={isLoadingSupervisors || isSaving}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {!selectedSupervisorId && (
                      <option value="">Chọn giám sát viên</option>
                    )}
                    {supervisors.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                        {item.employeeCode ? ` (${item.employeeCode})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Loại cây trồng</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={
                        sheet.cropType === "ca-phe" ? "primary" : "outline"
                      }
                      onClick={() =>
                        setSheet((prev) => ({ ...prev, cropType: "ca-phe" }))
                      }
                    >
                      Cà phê
                    </Button>
                    <Button
                      variant={
                        sheet.cropType === "sau-rieng" ? "primary" : "outline"
                      }
                      onClick={() =>
                        setSheet((prev) => ({ ...prev, cropType: "sau-rieng" }))
                      }
                    >
                      Sầu riêng
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {editingPlot?.plotDraftCoordinatesText && (() => {
              const coords = parseContractCoords(editingPlot.plotDraftCoordinatesText);
              if (coords.length === 0) return null;
              return (
                <div className="rounded-xl border bg-card p-4 shadow-xs">
                  <p className="mb-3 text-sm font-semibold text-foreground">
                    Tọa độ lô đất ({coords.length} điểm)
                  </p>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="pb-2 text-left font-medium">Điểm</th>
                          <th className="pb-2 text-right font-medium">Vĩ độ (lat)</th>
                          <th className="pb-2 text-right font-medium">Kinh độ (lng)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coords.map(([lat, lng], i) => (
                          <tr
                            key={i}
                            className="border-b border-dashed last:border-0"
                          >
                            <td className="py-1.5 font-medium text-emerald-700">
                              {i + 1}
                            </td>
                            <td className="py-1.5 text-right tabular-nums">
                              {lat.toFixed(6)}
                            </td>
                            <td className="py-1.5 text-right tabular-nums">
                              {lng.toFixed(6)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {editingPlot?.plotDraftCoordinatesText && (() => {
              const coords = parseContractCoords(editingPlot.plotDraftCoordinatesText);
              if (coords.length < 3) return null;
              return (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => {
                    navigate('/dashboard/zones', {
                      state: {
                        coordinates: coords,
                        contractNo: editingPlot.contractId,
                      },
                    });
                  }}
                >
                  <MapPin className="h-4 w-4" />
                  Xem lô đất trên bản đồ
                </Button>
              );
            })()}
          </div>

          <SheetFooter className="border-t bg-background px-5 py-4">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="destructive"
                onClick={() => editingPlot && requestDelete(editingPlot, true)}
                disabled={!editingPlot}
              >
                <Trash2 className="h-4 w-4" />
                Xóa lô
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSheetOpen(false)}>
                  Đóng
                </Button>
                <Button
                  onClick={() => void handleSave()}
                  disabled={!editingPlot || isSaving}
                >
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

          if (reopenSheetPlotId) {
            const plotToReopen = plots.find((item) => item.id === reopenSheetPlotId);
            setReopenSheetPlotId(null);
            if (plotToReopen) {
              openSheet(plotToReopen);
            }
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa lô đất</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn chắc chắn muốn xóa lô{" "}
              <strong>{deleteTarget?.plotName}</strong>? Hành động này không thể
              hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
