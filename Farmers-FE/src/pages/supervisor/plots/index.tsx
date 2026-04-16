import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MapPin,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMe } from "@/client/api/auth/use-me";
import { usePlots } from "@/pages/admin/plots/api";
import type { PlotResponse } from "@/pages/admin/plots/api/types";

function getCropBadgeVariant(cropType: PlotResponse["cropType"]) {
  if (cropType === "ca-phe") return { className: "border-amber-300 bg-amber-50 text-amber-800" };
  return { className: "border-lime-300 bg-lime-50 text-lime-800" };
}

function getCropLabel(cropType: PlotResponse["cropType"]) {
  return cropType === "ca-phe" ? "Cà phê" : "Sầu riêng";
}

export default function SupervisorPlotsPage() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const supervisorProfileId = me?.supervisorProfile?.id;
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<"all" | "ca-phe" | "sau-rieng">("all");
  const [gisFilter, setGisFilter] = useState<"all" | "drawn" | "undrawn">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { data, isLoading } = usePlots({
    page: currentPage,
    limit: itemsPerPage,
    search: keyword.trim() || undefined,
    cropType: filter === "all" ? undefined : filter,
    id_suppervisor: supervisorProfileId,
    enabled: !!supervisorProfileId,
  });

  const plots = (data?.data ?? []) as PlotResponse[];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const filteredPlots = useMemo(() => {
    if (gisFilter === "drawn") {
      return plots.filter((p) => Boolean(p.hasGis));
    }
    if (gisFilter === "undrawn") {
      return plots.filter((p) => !p.hasGis);
    }
    return plots;
  }, [plots, gisFilter]);

  const pageFrom = total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const pageTo = Math.min(currentPage * itemsPerPage, total);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, filter, gisFilter]);

  return (
    <div className="h-full min-h-0 flex flex-col gap-6 p-4 sm:p-6">
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
                placeholder="Tìm theo tên lô, mã lô, nông dân..."
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
          <div className="flex flex-wrap gap-2">
            <Button
              variant={gisFilter === "all" ? "primary" : "outline"}
              className="rounded-full"
              onClick={() => setGisFilter("all")}
            >
              GIS: Tất cả
            </Button>
            <Button
              variant={gisFilter === "drawn" ? "primary" : "outline"}
              className="rounded-full"
              onClick={() => setGisFilter("drawn")}
            >
              GIS: Đã vẽ
            </Button>
            <Button
              variant={gisFilter === "undrawn" ? "primary" : "outline"}
              className="rounded-full"
              onClick={() => setGisFilter("undrawn")}
            >
              GIS: Chưa vẽ
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Hiển thị {filteredPlots.length} / {total} lô đất.
          </p>
        </CardContent>
      </Card>

      <div className="min-h-0 flex-1">
        {isLoading ? (
          <Card className="rounded-2xl border-dashed border-primary/40">
            <CardContent className="py-10 text-sm text-muted-foreground">
              Đang tải danh sách plot...
            </CardContent>
          </Card>
        ) : filteredPlots.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-primary/40">
            <CardContent className="py-10 text-sm text-muted-foreground">
              Chưa có lô đất nào cho bạn.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredPlots.map((plot) => {
              const hasGis = Boolean(plot.hasGis);
              const cropBadge = getCropBadgeVariant(plot.cropType);
              return (
                <div
                  key={plot.id}
                  className="overflow-hidden rounded-2xl border border-l-4 border-border/70 border-l-primary bg-linear-to-br from-white to-slate-50 p-4 text-left shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-900">
                        {plot.plotName}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{plot.lotCode}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                    <p className="inline-flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {plot.farmerName}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {plot.district}, {plot.province}
                    </p>
                    <p className="text-xs">HĐ: {plot.contractId || "Chưa có hợp đồng"}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-primary/30 pt-3">
                    <Badge variant="outline" className={cropBadge.className}>
                      {getCropLabel(plot.cropType)}
                    </Badge>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                      {plot.areaHa} ha
                    </Badge>
                    <Badge
                      variant={hasGis ? "soft-success" : "outline"}
                      className={hasGis ? undefined : "border-slate-200"}
                    >
                      {hasGis ? "Đã vẽ GIS" : "Chưa vẽ"}
                    </Badge>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      className="w-full"
                      onClick={() =>
                        navigate(`/supervisor/zones?plotId=${encodeURIComponent(plot.id)}`)
                      }
                    >
                      Vào zones để vẽ
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {total > 0 && (
        <div className="border-t bg-background pt-3">
          <div className="flex flex-col gap-2 rounded-lg border bg-card px-3 py-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">
              Hiển thị {pageFrom}-{pageTo} / {total} lô đất
            </span>
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
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
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
  );
}
