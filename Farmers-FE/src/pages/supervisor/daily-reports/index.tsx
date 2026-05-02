import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PaginationState, Updater } from '@tanstack/react-table';
import {
  CalendarDays,
  ImagePlus,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/custom/combobox';
import { DataTable } from '@/components/data-table';
import { useMe } from '@/client/api/auth/use-me';
import { extractData } from '@/client/lib/api-client';
import {
  dailyReportApi,
  useDailyReports,
  type DailyReportResponse,
  type DailyReportType,
} from '@/pages/admin/daily-reports/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  SUPERVISOR_DAILY_DASHBOARD_QUERY_KEY,
  useSupervisorDailyDashboard,
  type SupervisorDailyDashboard,
} from './api';
import { createSupervisorDailyReportColumns } from './components';

const PAGE_LIMIT = 15;
const MAX_IMAGES = 10;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

type StatusTab = 'ALL' | 'DRAFT' | 'SUBMITTED';
type CategoryTab = 'ALL' | 'HARVEST' | 'OTHER';
type ImageItem = {
  id: string;
  payload: string;
  previewUrl: string;
};

const translateCropType = (type?: string) => {
  if (!type) return '—';
  const map: Record<string, string> = {
    'ca-phe': 'Cà phê',
    'sau-rieng': 'Sầu riêng',
  };
  return map[type] || type;
};

function isBlobUrl(url: string) {
  return url.startsWith('blob:');
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Chỉ chấp nhận file ảnh'));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      reject(new Error(`Ảnh "${file.name}" vượt quá 2MB. Vui lòng chọn ảnh nhỏ hơn.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Không đọc được file'));
    reader.readAsDataURL(file);
  });
}

export default function SupervisorDailyReportsPage() {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const supervisorProfileId = me?.supervisorProfile?.id ?? '';

  const [statusTab, setStatusTab] = useState<StatusTab>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_LIMIT);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [plotId, setPlotId] = useState('');
  const [content, setContent] = useState('');
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const [reportType, setReportType] = useState<DailyReportType>('ROUTINE');
  const [isHarvest, setIsHarvest] = useState(false);
  const [yieldEstimateKg, setYieldEstimateKg] = useState<number | string>('');

  const [categoryTab, setCategoryTab] = useState<CategoryTab>('ALL');

  const statusParam =
    statusTab === 'ALL' ? undefined : (statusTab as Exclude<StatusTab, 'ALL'>);

  const { data: listData, isLoading, isFetching } = useDailyReports({
    page: currentPage,
    limit,
    status: statusParam,
    isHarvest: categoryTab === 'HARVEST' ? 'true' : categoryTab === 'OTHER' ? 'false' : undefined,
  });

  const { data: dailyDash } = useSupervisorDailyDashboard();

  const [plotOptionExtra, setPlotOptionExtra] = useState<{
    value: string;
    label: string;
    cropType?: string;
    areaHa?: number;
  } | null>(null);

  const submittedTodayPlotIds = useMemo(
    () => new Set(dailyDash?.submittedTodayPlotIds ?? []),
    [dailyDash?.submittedTodayPlotIds],
  );

  const plotOptions = useMemo(() => {
    const base = (dailyDash?.plots ?? []).map((p) => {
      const sentLabel = submittedTodayPlotIds.has(p.id) ? 'Đã gửi' : 'Chưa gửi';
      const translatedCrop = translateCropType(p.cropType);
      return {
        value: p.id,
        label: `${p.plotName || p.lotCode} — ${p.farmerName} (${translatedCrop}) (${sentLabel})`,
        cropType: p.cropType,
        areaHa: p.areaHa,
      };
    });
    if (plotOptionExtra && !base.some((o) => o.value === plotOptionExtra.value)) {
      return [plotOptionExtra, ...base];
    }
    return base;
  }, [dailyDash?.plots, plotOptionExtra, submittedTodayPlotIds]);

  const rows = listData?.data ?? [];
  const total = listData?.total ?? 0;
  const totalPages = Math.max(1, listData?.totalPages ?? 1);
  const imageUrls = useMemo(() => imageItems.map((item) => item.payload), [imageItems]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusTab]);

  useEffect(() => {
    if (!isLoading && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages, isLoading]);

  const replaceImageItems = useCallback((nextItems: ImageItem[]) => {
    setImageItems((prev) => {
      prev.forEach((item) => {
        if (isBlobUrl(item.previewUrl)) URL.revokeObjectURL(item.previewUrl);
      });
      return nextItems;
    });
  }, []);

  const resetForm = useCallback(() => {
    replaceImageItems([]);
    setEditingId(null);
    setPlotId('');
    setContent('');
    setReportType('ROUTINE');
    setIsHarvest(false);
    setYieldEstimateKg('');
  }, [replaceImageItems]);

  const openCreate = () => {
    setSheetMode('create');
    setPlotOptionExtra(null);
    resetForm();
    if (categoryTab === 'HARVEST') {
      setIsHarvest(true);
    }
    setSheetOpen(true);
  };

  const openEdit = useCallback(
    (row: DailyReportResponse) => {
      if (row.status !== 'DRAFT') return;
      setSheetMode('edit');
      setEditingId(row.id);
      setPlotId(row.plotId);
      setPlotOptionExtra({
      value: row.plotId,
      label: `${row.plot?.plotCode ?? row.plotId} — ${row.plot?.farmer?.fullName ?? ''} (${translateCropType(row.plot?.cropType)}) (Chưa gửi)`,
      cropType: row.plot?.cropType,
      areaHa: row.plot?.areaHa,
    });
      setReportType(row.type ?? 'ROUTINE');
      const yVal = row.yieldEstimateKg;
      if (yVal && yVal > 0) {
        setIsHarvest(true);
        setYieldEstimateKg(yVal);
      } else {
        setIsHarvest(false);
        setYieldEstimateKg('');
      }
      replaceImageItems(
        (row.imageUrls ?? []).map((url, idx) => ({
          id: `existing-${row.id}-${idx}`,
          payload: url,
          previewUrl: url,
        })),
      );
      setSheetOpen(true);
    },
    [replaceImageItems],
  );

  const openView = useCallback(
    (row: DailyReportResponse) => {
      setSheetMode('view');
      setEditingId(row.id);
      setPlotId(row.plotId);
      setPlotOptionExtra({
      value: row.plotId,
      label: `${row.plot?.plotCode ?? row.plotId} — ${row.plot?.farmer?.fullName ?? ''} (${translateCropType(row.plot?.cropType)}) (Đã gửi)`,
      cropType: row.plot?.cropType,
      areaHa: row.plot?.areaHa,
    });
      setReportType(row.type ?? 'ROUTINE');
      const yValView = row.yieldEstimateKg;
      if (yValView && yValView > 0) {
        setIsHarvest(true);
        setYieldEstimateKg(yValView);
      } else {
        setIsHarvest(false);
        setYieldEstimateKg('');
      }
      replaceImageItems(
        (row.imageUrls ?? []).map((url, idx) => ({
          id: `existing-${row.id}-${idx}`,
          payload: url,
          previewUrl: url,
        })),
      );
      setSheetOpen(true);
    },
    [replaceImageItems],
  );

  const handleRowClick = useCallback(
    (row: DailyReportResponse) => {
      if (row.status === 'DRAFT') openEdit(row);
      else openView(row);
    },
    [openEdit, openView],
  );

  const columns = useMemo(
    () =>
      createSupervisorDailyReportColumns(openEdit, openView, {
        showYield: categoryTab === 'HARVEST',
      }),
    [openEdit, openView, categoryTab],
  );

  const handlePaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      const prev: PaginationState = { pageIndex: currentPage - 1, pageSize: limit };
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setCurrentPage(next.pageIndex + 1);
      setLimit(next.pageSize);
    },
    [currentPage, limit],
  );

  const paginationState = useMemo(
    () => ({ pageIndex: currentPage - 1, pageSize: limit }),
    [currentPage, limit],
  );

  const closeSheet = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      resetForm();
      setSheetMode('create');
      setPlotOptionExtra(null);
    }
  };

  const onPickImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const next: ImageItem[] = [...imageItems];
    for (const file of Array.from(files)) {
      if (next.length >= MAX_IMAGES) {
        toast.message(`Tối đa ${MAX_IMAGES} ảnh`);
        break;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        const previewUrl = URL.createObjectURL(file);
        next.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          payload: dataUrl,
          previewUrl,
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Không thể thêm ảnh ${file.name}`);
      }
    }
    setImageItems(next);
    e.target.value = '';
  };

  const removeImageAt = (index: number) => {
    setImageItems((prev) =>
      prev.filter((item, i) => {
        if (i !== index) return true;
        if (isBlobUrl(item.previewUrl)) URL.revokeObjectURL(item.previewUrl);
        return false;
      }),
    );
  };

  const invalidateList = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['daily-reports'] }),
      queryClient.invalidateQueries({
        queryKey: [...SUPERVISOR_DAILY_DASHBOARD_QUERY_KEY],
        refetchType: 'all',
      }),
    ]);
  };

  /** Cập nhật ngay badge sidebar + combobox (đồng bộ server sau invalidate). */
  const markPlotSubmittedTodayInCache = (submittedPlotId: string) => {
    queryClient.setQueriesData<SupervisorDailyDashboard>(
      { queryKey: [...SUPERVISOR_DAILY_DASHBOARD_QUERY_KEY] },
      (old) => {
        if (!old) return old;
        if (old.submittedTodayPlotIds.includes(submittedPlotId)) return old;
        const submittedTodayPlotIds = [...old.submittedTodayPlotIds, submittedPlotId];
        const submittedSet = new Set(submittedTodayPlotIds);
        const missingCount = old.plots.filter((p) => !submittedSet.has(p.id)).length;
        return { ...old, submittedTodayPlotIds, missingCount };
      },
    );
  };

  const handleSaveDraft = async () => {
    if (!plotId) {
      toast.error('Vui lòng chọn lô đất');
      return;
    }
    setSaving(true);
    try {
      if (!editingId) {
        const res = await dailyReportApi.create({
          plotId,
          type: reportType,
          content: content.trim(),
          imageUrls,
          yieldEstimateKg: isHarvest ? (Number(yieldEstimateKg) || 0) : undefined,
        });
        extractData(res);
        toast.success('Đã tạo báo cáo nháp');
      } else {
        const res = await dailyReportApi.update(editingId, {
          type: reportType,
          content: content.trim(),
          imageUrls,
          yieldEstimateKg: isHarvest ? (Number(yieldEstimateKg) || 0) : undefined,
        });
        extractData(res);
        toast.success('Đã cập nhật nháp');
      }
      void invalidateList();
      setSheetOpen(false);
      resetForm();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Không thể lưu nháp';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!plotId) {
      toast.error('Vui lòng chọn lô đất');
      return;
    }
    if (!content.trim()) {
      toast.error('Cần nội dung chữ trước khi gửi');
      return;
    }
    if (imageUrls.length < 1) {
      toast.error('Cần ít nhất một ảnh đính kèm khi gửi');
      return;
    }
    setSending(true);
    try {
      let id = editingId;
      if (!id) {
        const createdRes = await dailyReportApi.create({
          plotId,
          type: reportType,
          content: content.trim(),
          imageUrls,
          yieldEstimateKg: isHarvest ? (Number(yieldEstimateKg) || 0) : undefined,
        });
        id = extractData<DailyReportResponse>(createdRes).id;
      } else {
        extractData(
          await dailyReportApi.update(id, {
            type: reportType,
            content: content.trim(),
            imageUrls,
            yieldEstimateKg: isHarvest ? (Number(yieldEstimateKg) || 0) : undefined,
          }),
        );
      }
      extractData(await dailyReportApi.submit(id));
      markPlotSubmittedTodayInCache(plotId);
      toast.success('Đã gửi báo cáo');
      await invalidateList();
      setSheetOpen(false);
      resetForm();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Không thể gửi báo cáo';
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const isDraftSheet = sheetMode === 'create' || sheetMode === 'edit';

  if (!supervisorProfileId) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Không tải được hồ sơ giám sát viên. Vui lòng đăng nhập lại.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/8">
              <CalendarDays className="size-4 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Báo cáo hàng ngày</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Soạn nháp, đính kèm ảnh, rồi gửi cho quản trị. Báo cáo đã gửi không thể chỉnh sửa.
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Tạo báo cáo
        </Button>
      </div>

      <Tabs
        value={categoryTab}
        onValueChange={(v) => setCategoryTab(v as CategoryTab)}
        className="w-full"
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="ALL">Tất cả báo cáo</TabsTrigger>
            <TabsTrigger value="HARVEST">Báo cáo sản lượng</TabsTrigger>
            <TabsTrigger value="OTHER">Báo cáo khác</TabsTrigger>
          </TabsList>

          {categoryTab === 'HARVEST' && listData?.meta && (
            <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 border border-primary/10 rounded-xl animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Tổng sản lượng thu hoạch
                </span>
                <span className="text-lg font-bold text-primary leading-tight">
                  {listData.meta.totalYield.toLocaleString()} <span className="text-sm font-medium">kg</span>
                </span>
              </div>
            </div>
          )}
        </div>

        <Card>
          <CardContent className="pt-6">
            <DataTable
              columns={columns}
              data={rows}
              isLoading={isLoading || isFetching}
              hiddenSearch
              enableSorting={false}
              manualPagination
              pageCount={totalPages}
              totalItems={total}
              onPaginationChange={handlePaginationChange}
              state={{ pagination: paginationState }}
              pageSizeOptions={[10, 15, 20, 30, 50]}
              onRowClick={handleRowClick}
              onReload={() => void invalidateList()}
              noResults={
                <span className="text-muted-foreground">
                  Chưa có báo cáo. Nhấn &quot;Tạo báo cáo&quot; để bắt đầu.
                </span>
              }
              filterToolbar={
                <div className="flex flex-wrap gap-2 items-center">
                  {(
                    [
                      { key: 'ALL' as const, label: 'Tất cả trạng thái' },
                      { key: 'DRAFT' as const, label: 'Nháp' },
                      { key: 'SUBMITTED' as const, label: 'Đã gửi' },
                    ] as const
                  ).map((t) => (
                    <Button
                      key={t.key}
                      type="button"
                      variant={statusTab === t.key ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setStatusTab(t.key)}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              }
            />
          </CardContent>
        </Card>
      </Tabs>

      <Sheet open={sheetOpen} onOpenChange={closeSheet}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col">
          <SheetHeader>
            <SheetTitle>
              {sheetMode === 'create'
                ? isHarvest
                  ? 'Ghi nhận sản lượng thu hoạch'
                  : 'Báo cáo mới'
                : sheetMode === 'edit'
                  ? 'Sửa nháp'
                  : 'Chi tiết báo cáo'}
            </SheetTitle>
            <SheetDescription>
              {isDraftSheet
                ? 'Chọn lô được giao, nhập nội dung và thêm ảnh. Gửi yêu cầu nội dung + ít nhất 1 ảnh.'
                : 'Báo cáo đã gửi — chỉ xem.'}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4 flex-1">
            <div className="space-y-2">
              <Label>Lô đất</Label>
              <Combobox
                label="Lô hoặc tên nông dân"
                dataArr={plotOptions}
                value={plotId}
                onChange={(v) => {
                  if (typeof v === 'string' && v !== 'null') setPlotId(v);
                }}
                disabled={!isDraftSheet || sheetMode === 'edit'}
              />
              {sheetMode === 'edit' && (
                <p className="text-xs text-muted-foreground">Không đổi lô sau khi đã tạo nháp.</p>
              )}
              {plotId && (
                <div className="flex flex-col gap-1 p-3 bg-primary/5 border border-primary/10 rounded-lg animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Sản phẩm:</span>
                    <span className="text-sm font-bold text-primary">
                      {translateCropType(plotOptions.find((o) => o.value === plotId)?.cropType)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Diện tích lô:</span>
                    <span className="text-sm font-semibold text-foreground">
                      {plotOptions.find((o) => o.value === plotId)?.areaHa || '—'} ha
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại báo cáo</Label>
                <Select
                  value={reportType}
                  onValueChange={(v) => setReportType(v as DailyReportType)}
                  disabled={!isDraftSheet}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROUTINE">Thường kỳ</SelectItem>
                    <SelectItem value="INCIDENT">Sự cố</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex flex-col justify-end">
                <div className="flex items-center space-x-2 pb-2">
                  <Checkbox
                    id="isHarvest"
                    checked={isHarvest}
                    onCheckedChange={(checked) => setIsHarvest(!!checked)}
                    disabled={!isDraftSheet}
                  />
                  <label
                    htmlFor="isHarvest"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Báo cáo thu hoạch
                  </label>
                </div>
              </div>
            </div>

            {isHarvest && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label>Sản lượng thu hoạch (kg)</Label>
                <Input
                  type="number"
                  placeholder="Nhập số kg..."
                  value={yieldEstimateKg}
                  onChange={(e) => setYieldEstimateKg(e.target.value)}
                  disabled={!isDraftSheet}
                  autoFocus={sheetMode === 'create' && isHarvest}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Nội dung</Label>
              <Textarea
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={!isDraftSheet}
                placeholder="Mô tả thực địa, tình trạng cây, sự cố (nếu có)..."
                className="resize-y min-h-[140px]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Ảnh đính kèm ({imageItems.length}/{MAX_IMAGES})</Label>
                {isDraftSheet && imageItems.length < MAX_IMAGES && (
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      id="daily-report-images"
                      onChange={onPickImages}
                    />
                    <Button type="button" variant="outline" size="sm" asChild>
                      <label htmlFor="daily-report-images" className="cursor-pointer">
                        <ImagePlus className="h-4 w-4 mr-1" />
                        Thêm ảnh
                      </label>
                    </Button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {imageItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="relative group aspect-video rounded-md border overflow-hidden bg-muted"
                  >
                    <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                    {isDraftSheet && (
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 h-7 w-7 opacity-90"
                        onClick={() => removeImageAt(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {isDraftSheet && (
            <SheetFooter className="mt-6 gap-2 sm:gap-2 flex-col sm:flex-row">
              <Button variant="secondary" disabled={saving || sending} onClick={() => closeSheet(false)}>
                Hủy
              </Button>
              <Button variant="outline" disabled={saving || sending} onClick={handleSaveDraft}>
                {saving ? 'Đang lưu...' : 'Lưu nháp'}
              </Button>
              <Button disabled={saving || sending} onClick={handleSend}>
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Đang gửi...' : 'Gửi báo cáo'}
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
