import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Layers3,
  MapPin,
  Search,
  Sprout,
  UserRound,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useMe } from '@/client/api/auth/use-me';
import { cn } from '@/lib/utils';
import { useSupervisorPlots, type PlotCropType, type PlotResponse } from './api';

const PAGE_LIMIT = 6;

const getCropLabel = (crop: PlotCropType) =>
  crop === 'sau-rieng' ? 'Sầu riêng' : 'Cà phê';

const getCropBadgeClass = (crop: PlotCropType) =>
  crop === 'ca-phe'
    ? 'border-amber-300 bg-amber-50 text-amber-800'
    : 'border-lime-300 bg-lime-50 text-lime-800';

export default function SupervisorPlotsPage() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const supervisorProfileId = me?.supervisorProfile?.id ?? '';

  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [filter, setFilter] = useState<'all' | PlotCropType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedPlotId, setSelectedPlotId] = useState('');

  const { data: plotsData, isLoading } = useSupervisorPlots({
    supervisorProfileId,
    page: currentPage,
    limit: PAGE_LIMIT,
    search: debouncedKeyword || undefined,
    cropType: filter === 'all' ? undefined : filter,
    enabled: !!supervisorProfileId,
  });

  const plots = useMemo(() => plotsData?.data ?? [], [plotsData?.data]);
  const total = plotsData?.total ?? 0;
  const totalPages = Math.max(1, plotsData?.totalPages ?? 1);

  const totalArea = useMemo(
    () => plots.reduce((sum, item) => sum + item.areaHa, 0),
    [plots],
  );

  const pageFrom = total === 0 ? 0 : (currentPage - 1) * PAGE_LIMIT + 1;
  const pageTo = Math.min(currentPage * PAGE_LIMIT, total);

  const selectedPlot =
    plots.find((item) => item.id === selectedPlotId) ?? plots[0] ?? null;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedKeyword, filter]);

  useEffect(() => {
    if (!isLoading && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages, isLoading]);

  const openSheet = (plot: PlotResponse) => {
    setSelectedPlotId(plot.id);
    setSheetOpen(true);
  };

  const goFirstPage = () => setCurrentPage(1);
  const goPrevPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const goNextPage = () =>
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  const goLastPage = () => setCurrentPage(totalPages);

  if (!supervisorProfileId) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Không xác định được hồ sơ giám sát viên. Vui lòng đăng nhập lại.
      </div>
    );
  }

  return (
    <>
      <div className="h-full min-h-0 flex flex-col gap-6 p-4 sm:p-6">
        <Card className="border-dashed border-primary/40">
          <CardContent className="space-y-3 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Layers3 className="h-4 w-4" />
              Lọc lô đất phụ trách
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
                  variant={filter === 'all' ? 'primary' : 'outline'}
                  className="rounded-full"
                  onClick={() => setFilter('all')}
                >
                  Tất cả
                </Button>
                <Button
                  variant={filter === 'ca-phe' ? 'primary' : 'outline'}
                  className="rounded-full"
                  onClick={() => setFilter('ca-phe')}
                >
                  Cà phê
                </Button>
                <Button
                  variant={filter === 'sau-rieng' ? 'primary' : 'outline'}
                  className="rounded-full"
                  onClick={() => setFilter('sau-rieng')}
                >
                  Sầu riêng
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Hiển thị {plots.length} / {total} lô đất trong phạm vi bạn phụ trách.
            </p>
          </CardContent>
        </Card>

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

        <div className="min-h-0 flex flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {isLoading ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Đang tải dữ liệu lô đất phụ trách...
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {plots.map((plot) => (
                  <button
                    key={plot.id}
                    type="button"
                    onClick={() => openSheet(plot)}
                    className={cn(
                      'group cursor-pointer overflow-hidden rounded-2xl border border-l-4 border-border/70 border-l-primary bg-linear-to-br from-white to-slate-50 p-4 text-left shadow-xs transition duration-200 hover:border-emerald-300 hover:shadow-md',
                      selectedPlotId === plot.id &&
                        'border-emerald-500 ring-2 ring-emerald-200',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-900 group-hover:text-emerald-900">
                          {plot.plotName}
                        </p>
                        <p className="text-sm text-muted-foreground">{plot.lotCode}</p>
                      </div>
                      <Badge variant="outline" className={getCropBadgeClass(plot.cropType)}>
                        {getCropLabel(plot.cropType)}
                      </Badge>
                    </div>

                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <p className="inline-flex items-center gap-2">
                        <UserRound className="h-4 w-4" />
                        {plot.farmerName}
                      </p>
                      <p className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {plot.district}, {plot.province}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">Diện tích: {plot.areaHa} ha</Badge>
                      <Badge variant={plot.progress === 'on-track' ? 'success' : 'warning'}>
                        {plot.progress === 'on-track' ? 'Ổn định' : 'Cần chú ý'}
                      </Badge>
                      {!plot.isGisMarked && (
                        <Badge variant="warning">Chưa được đánh dấu</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!isLoading && plots.length === 0 && (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Không có lô đất nào trong phạm vi phụ trách với bộ lọc hiện tại.
                </CardContent>
              </Card>
            )}
          </div>

          {!isLoading && totalPages > 0 && (
            <div className="mt-3 border-t bg-background pt-3">
              <div className="flex flex-col gap-2 rounded-lg border bg-card px-3 py-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    Hiển thị {pageFrom}-{pageTo} / {total} lô đất
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
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Chi tiết lô đất phụ trách</SheetTitle>
            <SheetDescription>
              Thông tin lô đất trong phạm vi phụ trách của bạn.
            </SheetDescription>
          </SheetHeader>

          {selectedPlot ? (
            <div className="space-y-4 px-4 pb-4">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                <p className="text-xs uppercase tracking-widest text-emerald-700">
                  Lô đất
                </p>
                <p className="mt-1 text-lg font-bold text-emerald-950">
                  {selectedPlot.plotName}
                </p>
                <p className="text-sm text-emerald-800">{selectedPlot.lotCode}</p>
              </div>

              <div className="space-y-2">
                <Label>Nông dân phụ trách</Label>
                <Input value={selectedPlot.farmerName} disabled />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Số điện thoại</Label>
                  <Input value={selectedPlot.farmerPhone || '-'} disabled />
                </div>
                <div className="space-y-2">
                  <Label>CCCD</Label>
                  <Input value={selectedPlot.farmerCccd || '-'} disabled />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Diện tích (ha)</Label>
                  <Input value={String(selectedPlot.areaHa)} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Loại cây</Label>
                  <Input value={getCropLabel(selectedPlot.cropType)} disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Vị trí</Label>
                <Input value={`${selectedPlot.district}, ${selectedPlot.province}`} disabled />
                {!selectedPlot.isGisMarked && (
                  <p className="text-xs text-amber-700">
                    Lô đất này chưa được đánh dấu point trên GIS.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Giám sát viên</Label>
                <Input value={selectedPlot.name_suppervisor || me?.fullName || '-'} disabled />
              </div>

              <div className="pt-4">
                <Button
                  className="w-full"
                  onClick={() =>
                    navigate(`/supervisor/zones?plotId=${encodeURIComponent(selectedPlot.id)}`)
                  }
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Vào bản đồ để vẽ
                </Button>
              </div>
            </div>
          ) : (
            <div className="px-4 pb-4 text-sm text-muted-foreground">
              Chưa có dữ liệu để hiển thị.
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
