import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers3,
  MapPin,
  SlidersHorizontal,
  Sprout,
  Users,
  UserRound,
} from "lucide-react";
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
import { useMe } from "@/client/api/auth/use-me";
import { cn } from "@/lib/utils";
import { DataGrid } from "@/components/data-grid";
import { usePlots } from "@/pages/admin/plots/api";
import type { PlotResponse } from "@/pages/admin/plots/api/types";

type CropType = "sau-rieng" | "ca-phe";
type PlotItem = PlotResponse;

type SupervisorOption = {
  id: string;
  name: string;
  employeeCode?: string;
};

const getCropLabel = (crop: CropType) =>
  crop === "sau-rieng" ? "Sầu riêng" : "Cà phê";
const getCropBadgeClass = (crop: CropType) =>
  crop === "ca-phe"
    ? "border-amber-300 bg-amber-50 text-amber-800"
    : "border-lime-300 bg-lime-50 text-lime-800";

/** Parse plotDraftCoordinatesText thành mảng tọa độ [[lat,lng], ...] */
const parseContractCoords = (text?: string | null): Array<[number, number]> => {
  if (!text?.trim()) return [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const pairs: Array<[number, number]> = [];
  // Try "lat,lng" per line
  let allPairs = true;
  for (const line of lines) {
    const parts = line.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) { pairs.push([lat, lng]); continue; }
    }
    allPairs = false;
    break;
  }
  if (allPairs && pairs.length > 0) return pairs;
  // Fallback: flat format
  pairs.length = 0;
  const nums = text.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const lat = parseFloat(nums[i]);
    const lng = parseFloat(nums[i + 1]);
    if (!isNaN(lat) && !isNaN(lng)) pairs.push([lat, lng]);
  }
  return pairs;
};

export default function SupervisorPlotsPage() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const supervisorProfileId = me?.supervisorProfile?.id;
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<"all" | CropType>("all");
  const [supervisorFilterId, setSupervisorFilterId] = useState("all");
  const [mapFilter, setMapFilter] = useState<"all" | "mapped" | "unmapped">("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const itemsPerPage = 6;

  const { data: plotsData, isLoading, isFetching } = usePlots({
    page: currentPage,
    limit: itemsPerPage,
    search: keyword.trim() || undefined,
    cropType: filter === "all" ? undefined : filter,
    id_suppervisor:
      supervisorFilterId === "all"
        ? supervisorProfileId
        : supervisorFilterId,
    enabled: !!supervisorProfileId,
  });

  const plots = useMemo(
    () => (plotsData?.data ?? []) as PlotResponse[],
    [plotsData?.data],
  );
  const total = plotsData?.total ?? 0;
  const totalPages = plotsData?.totalPages ?? 1;
  const displayedPlots = useMemo(
    () =>
      plots.filter((plot) => {
        const hasGis =
          plot.hasGis ??
          (Number.isFinite(plot.lat) && Number.isFinite(plot.lng));
        if (mapFilter === "all") return true;
        return mapFilter === "mapped" ? hasGis : !hasGis;
      }),
    [plots, mapFilter],
  );

  const supervisors = useMemo<SupervisorOption[]>(() => {
    if (!supervisorProfileId) return [];
    return [
      {
        id: supervisorProfileId,
        name: me?.fullName ?? "Giám sát viên",
        employeeCode: me?.supervisorProfile?.employeeCode,
      },
    ];
  }, [supervisorProfileId, me]);

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
    if (supervisorProfileId) {
      setSelectedSupervisorId(supervisorProfileId);
      setSupervisorFilterId(supervisorProfileId);
    }
  }, [supervisorProfileId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, filter, supervisorFilterId]);

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
    setSelectedSupervisorId(plot.id_suppervisor || supervisorProfileId || "");
    setSheetOpen(true);
  };

  const editingPlot = plots.find((item) => item.id === editingId) ?? null;

  return (
    <div className="h-full min-h-0 flex flex-col gap-6 p-0 sm:p-0">
      <DataGrid<PlotItem>
        items={displayedPlots}
        title="Quản lý lô đất"
        titleIcon={<MapPin className="size-4 text-primary" />}
        description="Danh sách lô đất trong phạm vi phụ trách của bạn. Mở chi tiết để xem thông tin và cập nhật dữ liệu bản đồ."
        keyExtractor={(plot) => plot.id}
        renderCard={(plot) => {
          const hasGis =
            plot.hasGis ?? (Number.isFinite(plot.lat) && Number.isFinite(plot.lng));
          return (
            <div
              role="button"
              tabIndex={0}
              onClick={() => openSheet(plot)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openSheet(plot);
                }
              }}
              className={cn(
                "group flex h-full min-h-0 w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-l-4 border-border/70 border-l-primary bg-linear-to-br from-white to-slate-50 p-4 text-left shadow-xs transition duration-200 hover:border-emerald-300 hover:shadow-md",
                editingId === plot.id && "border-emerald-500 ring-2 ring-emerald-200",
              )}
            >
              <div className="flex shrink-0 items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900 group-hover:text-emerald-900">
                    {plot.plotName}
                  </p>
                  <p className="text-sm text-muted-foreground">{plot.lotCode}</p>
                </div>
                <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                  Chỉ xem
                </Badge>
              </div>

              <div className="mt-4 min-h-0 flex-1 grid gap-2 text-sm text-muted-foreground">
                <p className="inline-flex items-center gap-2">
                  <UserRound className="h-4 w-4 shrink-0" />
                  {plot.farmerName}
                </p>
                <p className="inline-flex items-center gap-2">
                  <UserRound className="h-4 w-4 shrink-0" />
                  GS: {plot.name_suppervisor || "Chưa phân công"}
                </p>
                <p className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {plot.district}, {plot.province}
                </p>
              </div>

              <div className="mt-auto flex shrink-0 flex-wrap items-center gap-2 border-t border-dashed border-primary/30 pt-3">
                <Badge variant="outline" className={getCropBadgeClass(plot.cropType)}>
                  {getCropLabel(plot.cropType)}
                </Badge>
                <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                  {plot.areaHa} ha
                </Badge>
                <Button
                  size="sm"
                  variant={hasGis ? "secondary" : "primary"}
                  disabled={hasGis}
                  className={cn(
                    "ml-auto h-8 px-3 text-xs",
                    hasGis &&
                      "cursor-not-allowed bg-slate-200 text-slate-500 hover:bg-slate-200",
                  )}
                  onClick={(event) => {
                    if (hasGis) return;
                    event.stopPropagation();
                    const coords = parseContractCoords(plot.plotDraftCoordinatesText);
                    navigate(
                      `/supervisor/zones?plotId=${encodeURIComponent(plot.id)}`,
                      coords.length >= 3
                        ? { state: { coordinates: coords, contractNo: plot.contractId } }
                        : undefined,
                    );
                  }}
                >
                  {hasGis ? "Sửa bản đồ" : "Thêm vào bản đồ"}
                </Button>
              </div>
            </div>
          );
        }}
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
        toolbar={{
          search: {
            value: keyword,
            onChange: setKeyword,
            debounceMs: 0,
            placeholder: "Tìm theo tên lô, mã lô, tỉnh, nông dân...",
          },
          filters: (
            <>
              <span
                className="inline-flex shrink-0 items-center gap-1.5 text-muted-foreground"
                title="Bộ lọc nhanh"
              >
                <SlidersHorizontal className="h-4 w-4 shrink-0" />
                <span className="hidden text-xs font-medium sm:inline">Bộ lọc</span>
              </span>
              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                <Button
                  variant={filter === "all" ? "primary" : "outline"}
                  className="rounded-full"
                  onClick={() => setFilter("all")}
                >
                  Tất cả
                </Button>
                <Button
                  variant={filter === "ca-phe" ? "primary" : "outline"}
                  className="rounded-full"
                  onClick={() => setFilter("ca-phe")}
                >
                  Cà phê
                </Button>
                <Button
                  variant={filter === "sau-rieng" ? "primary" : "outline"}
                  className="rounded-full"
                  onClick={() => setFilter("sau-rieng")}
                >
                  Sầu riêng
                </Button>
              </div>
              <div
                className="inline-flex max-w-full shrink-0 flex-wrap items-center gap-1.5 rounded-full border border-border/60 bg-white px-2 py-1"
                title="Lọc theo bản đồ"
              >
                <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Button
                  size="sm"
                  variant={mapFilter === "all" ? "primary" : "outline"}
                  className="rounded-full"
                  onClick={() => setMapFilter("all")}
                >
                  Tất cả
                </Button>
                <Button
                  size="sm"
                  variant={mapFilter === "mapped" ? "primary" : "outline"}
                  className="rounded-full"
                  onClick={() => setMapFilter("mapped")}
                >
                  Đã thêm vào bản đồ
                </Button>
                <Button
                  size="sm"
                  variant={mapFilter === "unmapped" ? "primary" : "outline"}
                  className="rounded-full"
                  onClick={() => setMapFilter("unmapped")}
                >
                  Chưa thêm vào bản đồ
                </Button>
              </div>
            </>
          ),
          quickStats: (
            <>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm text-sky-800">
                <Layers3 className="h-4 w-4" />
                <span className="font-medium">Tổng lô:</span>
                <span className="font-semibold">{total}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-800">
                <Sprout className="h-4 w-4" />
                <span className="font-medium">Tổng diện tích:</span>
                <span className="font-semibold">{totalArea.toFixed(1)} ha</span>
              </div>
            </>
          ),
        }}
        emptyState={{
          description: "Không tìm thấy lô đất phù hợp với bộ lọc hiện tại.",
        }}
        skeleton={{ count: itemsPerPage }}
        layout={{
          minCardWidth: 280,
          equalHeightCards: true,
          itemWrapperClassName: "items-stretch",
        }}
        classNames={{ root: "h-full min-h-0", content: "min-h-0 flex-1" }}
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
                <Button
                  variant="secondary"
                  className={getCropBadgeClass(editingPlot.cropType)}
                >
                  {getCropLabel(editingPlot.cropType)}
                </Button>
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
                    readOnly
                    disabled
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
                    readOnly
                    disabled
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
                    readOnly
                    disabled
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
                    readOnly
                    disabled
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
                    disabled
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  >
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
                      disabled
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
                      disabled
                      onClick={() =>
                        setSheet((prev) => ({ ...prev, cropType: "sau-rieng" }))
                      }
                    >
                      Sầu riêng
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Role SUPERVISOR chỉ có quyền xem thông tin lô tại trang này.
                </p>
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
                          <tr key={i} className="border-b border-dashed last:border-0">
                            <td className="py-1.5 font-medium text-emerald-700">{i + 1}</td>
                            <td className="py-1.5 text-right tabular-nums">{lat.toFixed(6)}</td>
                            <td className="py-1.5 text-right tabular-nums">{lng.toFixed(6)}</td>
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
                    navigate(`/supervisor/zones?plotId=${encodeURIComponent(editingPlot.id)}`, {
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

            <p className="text-xs text-muted-foreground">
              Hiển thị {plots.length} / {total} lô đất trong phạm vi bạn phụ trách.
            </p>
          </div>

        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-end">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm text-sky-800">
            <Layers3 className="h-4 w-4" />
            <span className="font-medium">Tổng lô:</span>
            <span className="font-semibold">{total}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-800">
            <Sprout className="h-4 w-4" />
            <span className="font-medium">Tổng diện tích:</span>
            <span className="font-semibold">{totalArea.toFixed(1)} ha</span>
          </div>
        </div>

          <SheetFooter className="border-t bg-background px-5 py-4">
            <div className="flex w-full justify-end">
              <Button variant="outline" onClick={() => setSheetOpen(false)}>
                Đóng
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
