import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit3,
  Layers3,
  MapPin,
  Save,
  Search,
  SlidersHorizontal,
  Sprout,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type CropType = "sau-rieng" | "ca-phe";

type PlotItem = {
  id: string;
  lotCode: string;
  plotName: string;
  farmerName: string;
  contractId: string;
  province: string;
  district: string;
  areaHa: number;
  cropType: CropType;
  progress: "on-track" | "attention";
  updatedAt: string;
};

const INITIAL_PLOTS: PlotItem[] = [
  {
    id: "lot-001",
    lotCode: "VT-L001",
    plotName: "Lô Khe Mây",
    farmerName: "Nguyen Van Son",
    contractId: "CT-2026-101",
    province: "Son La",
    district: "Moc Chau",
    areaHa: 2.8,
    cropType: "ca-phe",
    progress: "on-track",
    updatedAt: "13/04/2026 09:30",
  },
  {
    id: "lot-002",
    lotCode: "VT-L002",
    plotName: "Lô Suối Đá",
    farmerName: "Tran Thi Hoa",
    contractId: "CT-2026-108",
    province: "Dak Lak",
    district: "Cu Mgar",
    areaHa: 3.2,
    cropType: "sau-rieng",
    progress: "attention",
    updatedAt: "13/04/2026 10:05",
  },
  {
    id: "lot-003",
    lotCode: "VT-L003",
    plotName: "Lô Đồi Gió",
    farmerName: "Le Van Nam",
    contractId: "CT-2026-115",
    province: "Lam Dong",
    district: "Bao Loc",
    areaHa: 1.9,
    cropType: "ca-phe",
    progress: "on-track",
    updatedAt: "13/04/2026 11:12",
  },
  {
    id: "lot-004",
    lotCode: "VT-L004",
    plotName: "Lô Bến Hồ",
    farmerName: "Pham Quoc Viet",
    contractId: "CT-2026-121",
    province: "Tien Giang",
    district: "Cai Lay",
    areaHa: 2.1,
    cropType: "sau-rieng",
    progress: "on-track",
    updatedAt: "13/04/2026 08:40",
  },
];

const getCropLabel = (crop: CropType) =>
  crop === "sau-rieng" ? "Sầu riêng" : "Cà phê";
const getCropBadgeClass = (crop: CropType) =>
  crop === "ca-phe"
    ? "border-amber-300 bg-amber-50 text-amber-800"
    : "border-lime-300 bg-lime-50 text-lime-800";

export default function PlotsPage() {
  const [plots, setPlots] = useState<PlotItem[]>(INITIAL_PLOTS);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<"all" | CropType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlotItem | null>(null);
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

  const filteredPlots = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    return plots.filter((plot) => {
      const matchFilter = filter === "all" || plot.cropType === filter;
      if (!matchFilter) return false;
      if (!normalized) return true;
      return (
        plot.plotName.toLowerCase().includes(normalized) ||
        plot.lotCode.toLowerCase().includes(normalized) ||
        plot.farmerName.toLowerCase().includes(normalized) ||
        plot.province.toLowerCase().includes(normalized) ||
        plot.district.toLowerCase().includes(normalized)
      );
    });
  }, [plots, keyword, filter]);

  const totalArea = useMemo(
    () => plots.reduce((sum, item) => sum + item.areaHa, 0),
    [plots],
  );
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredPlots.length / itemsPerPage)),
    [filteredPlots.length, itemsPerPage],
  );
  const paginatedPlots = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPlots.slice(start, start + itemsPerPage);
  }, [filteredPlots, currentPage, itemsPerPage]);

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const goFirstPage = () => setCurrentPage(1);
  const goPrevPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const goNextPage = () =>
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  const goLastPage = () => setCurrentPage(totalPages);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, filter]);

  const openSheet = (plot: PlotItem) => {
    setEditingId(plot.id);
    setSheet({
      plotName: plot.plotName,
      farmerName: plot.farmerName,
      contractId: plot.contractId,
      areaHa: plot.areaHa,
      cropType: plot.cropType,
    });
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!editingId) return;
    setPlots((prev) =>
      prev.map((item) =>
        item.id === editingId
          ? {
              ...item,
              ...sheet,
              updatedAt: new Date().toLocaleString("vi-VN"),
            }
          : item,
      ),
    );
    toast.success("Đã cập nhật thông tin lô đất");
    setSheetOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setPlots((prev) => prev.filter((item) => item.id !== deleteTarget.id));
    toast.success(`Đã xóa ${deleteTarget.plotName}`);
    setDeleteTarget(null);
    if (editingId === deleteTarget.id) {
      setSheetOpen(false);
      setEditingId(null);
    }
  };

  const editingPlot = plots.find((item) => item.id === editingId) ?? null;

  return (
    <div className="h-full space-y-6 overflow-y-auto p-4 sm:p-6">
      <Card className="border-dashed border-primary/40">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            Bộ lọc nhanh
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="h-10 rounded-full border-muted pl-9"
                placeholder="Tìm theo tên lô, mã lô, tỉnh, nông dân..."
              />
            </div>
            <div className="flex flex-wrap gap-2">
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
          </div>
          <p className="text-xs text-muted-foreground">
            Hiển thị {filteredPlots.length} / {plots.length} lô đất.
          </p>
        </CardContent>
      </Card>

      <div className="flex w-full justify-end">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm text-sky-800">
            <Layers3 className="h-4 w-4" />
            <span className="font-medium">Tổng lô:</span>
            <span className="font-semibold">{plots.length}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-800">
            <Sprout className="h-4 w-4" />
            <span className="font-medium">Tổng diện tích:</span>
            <span className="font-semibold">{totalArea.toFixed(1)} ha</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {paginatedPlots.map((plot) => (
          <button
            key={plot.id}
            type="button"
            onClick={() => openSheet(plot)}
            className={cn(
              "group rounded-2xl border border-l-4 border-border/70 border-l-primary bg-linear-to-br from-white to-slate-50 p-4 text-left shadow-xs transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md",
              editingId === plot.id &&
                "border-emerald-500 ring-2 ring-emerald-200",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900 group-hover:text-emerald-900">
                  {plot.plotName}
                </p>
                <p className="text-sm text-muted-foreground">{plot.lotCode}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full"
                  onClick={(event) => {
                    event.stopPropagation();
                    openSheet(plot);
                  }}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  onClick={(event) => {
                    event.stopPropagation();
                    setDeleteTarget(plot);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
              <p className="inline-flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                {plot.farmerName}
              </p>
              <p className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {plot.district}, {plot.province}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-primary/30 pt-3">
              <Badge
                variant="outline"
                className={getCropBadgeClass(plot.cropType)}
              >
                {getCropLabel(plot.cropType)}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-slate-100 text-slate-700"
              >
                {plot.areaHa} ha
              </Badge>
            </div>
          </button>
        ))}
      </div>

      {!filteredPlots.length && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Không tìm thấy lô đất phù hợp với bộ lọc hiện tại.
          </CardContent>
        </Card>
      )}

      {filteredPlots.length > 0 && (
        <div className="mt-1">
          <div className="flex flex-col gap-2 rounded-lg border bg-card px-3 py-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-center gap-1.5 sm:justify-start">
              <span className="text-xs text-muted-foreground">Hiển thị</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={handleItemsPerPageChange}
              >
                <SelectTrigger size="sm" className="h-7 w-16 px-2 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="9">9</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">
                / {filteredPlots.length} lô đất
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
                  <span className="ml-1 hidden sm:inline">Đầu</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={goPrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="ml-1 hidden sm:inline">Trước</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={goNextPage}
                  disabled={currentPage === totalPages}
                >
                  <span className="mr-1 hidden sm:inline">Sau</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={goLastPage}
                  disabled={currentPage === totalPages}
                >
                  <span className="mr-1 hidden sm:inline">Cuối</span>
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
                    onChange={(event) =>
                      setSheet((prev) => ({
                        ...prev,
                        plotName: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plot-farmer">Nông dân phụ trách</Label>
                  <Input
                    id="plot-farmer"
                    value={sheet.farmerName}
                    onChange={(event) =>
                      setSheet((prev) => ({
                        ...prev,
                        farmerName: event.target.value,
                      }))
                    }
                  />
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
                    onChange={(event) =>
                      setSheet((prev) => ({
                        ...prev,
                        areaHa: Number.isFinite(Number(event.target.value))
                          ? Number(event.target.value)
                          : prev.areaHa,
                      }))
                    }
                  />
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
          </div>

          <SheetFooter className="border-t bg-background px-5 py-4">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="destructive"
                onClick={() => editingPlot && setDeleteTarget(editingPlot)}
                disabled={!editingPlot}
              >
                <Trash2 className="h-4 w-4" />
                Xóa lô
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSheetOpen(false)}>
                  Đóng
                </Button>
                <Button onClick={handleSave} disabled={!editingPlot}>
                  <Save className="h-4 w-4" />
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent variant="error">
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
