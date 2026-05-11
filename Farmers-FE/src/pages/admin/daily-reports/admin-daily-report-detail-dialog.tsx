import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type DailyReportResponse,
  type DailyReportStatus,
  type DailyReportType,
  type IncidentHandlingStatus,
  INCIDENT_HANDLING_LABEL,
  useReviewDailyReport,
  useUpdateIncidentHandling,
} from './api';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Leaf,
  Loader2,
  MapPin,
  Phone,
  Scale,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN');
}

function statusLabel(status: DailyReportStatus) {
  const map: Record<DailyReportStatus, string> = {
    DRAFT: 'Nháp',
    SUBMITTED: 'Đã gửi',
    REVIEWED: 'Đã xem',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
  };
  return map[status] ?? status;
}

function statusVariant(status: DailyReportStatus) {
  if (status === 'SUBMITTED') return 'default' as const;
  if (status === 'REVIEWED') return 'secondary' as const;
  if (status === 'APPROVED') return 'emerald' as const;
  if (status === 'REJECTED') return 'destructive' as const;
  return 'outline' as const;
}

const TYPE_META: Record<
  DailyReportType,
  {
    label: string;
    icon: typeof FileText;
    accent: string; // background tint
    border: string;
    text: string;
    iconBg: string;
  }
> = {
  ROUTINE: {
    label: 'Báo cáo định kỳ',
    icon: FileText,
    accent: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-700',
    iconBg: 'bg-slate-100 text-slate-600',
  },
  INCIDENT: {
    label: 'Báo cáo sự cố',
    icon: AlertTriangle,
    accent: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    iconBg: 'bg-rose-100 text-rose-600',
  },
  HARVEST: {
    label: 'Báo cáo thu hoạch',
    icon: Leaf,
    accent: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
};

const HANDLING_BADGE: Record<IncidentHandlingStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  RESOLVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export type AdminDailyReportDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  report: DailyReportResponse | undefined;
  loading: boolean;
};

export function AdminDailyReportDetailDialog({
  open,
  onClose,
  report,
  loading,
}: AdminDailyReportDetailDialogProps) {
  const { mutate: review, isPending: reviewing } = useReviewDailyReport();
  const { mutate: updateHandling, isPending: updatingHandling } = useUpdateIncidentHandling();

  // Form local state cho block cập nhật xử lý sự cố
  const [handlingDraft, setHandlingDraft] = useState<IncidentHandlingStatus>('PENDING');
  const [handlingNoteDraft, setHandlingNoteDraft] = useState('');

  useEffect(() => {
    if (report?.type === 'INCIDENT') {
      setHandlingDraft(report.incidentHandlingStatus ?? 'PENDING');
      setHandlingNoteDraft(report.incidentHandlingNote ?? '');
    }
  }, [report?.id, report?.incidentHandlingStatus, report?.incidentHandlingNote, report?.type]);

  const canReview = report?.type === 'HARVEST' && report?.status === 'SUBMITTED';

  const handleReview = (status: 'APPROVED' | 'REJECTED') => {
    if (!report) return;
    review({ id: report.id, status });
  };

  const handleSaveHandling = () => {
    if (!report) return;
    updateHandling({
      id: report.id,
      payload: { status: handlingDraft, note: handlingNoteDraft.trim() || undefined },
    });
  };

  const typeMeta = report ? TYPE_META[report.type] : null;
  const TypeIcon = typeMeta?.icon ?? FileText;

  const isDirty =
    report?.type === 'INCIDENT' &&
    (handlingDraft !== (report.incidentHandlingStatus ?? 'PENDING') ||
      handlingNoteDraft.trim() !== (report.incidentHandlingNote ?? '').trim());

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        showCloseButton
        className="flex w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] max-h-[min(94dvh,1080px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl lg:max-w-6xl"
      >
        {/* HEADER — theo loại báo cáo */}
        <DialogHeader
          className={cn(
            'shrink-0 border-b px-6 py-5 text-left sm:px-8',
            typeMeta?.accent,
          )}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex size-11 items-center justify-center rounded-2xl shadow-sm',
                  typeMeta?.iconBg,
                )}
              >
                <TypeIcon className="size-5" />
              </div>
              <div>
                <DialogTitle className={cn('text-lg font-bold', typeMeta?.text)}>
                  {typeMeta?.label ?? 'Chi tiết báo cáo'}
                </DialogTitle>
                <DialogDescription className="mt-1 flex items-center gap-2 text-xs">
                  <CalendarDays className="size-3.5" />
                  {report ? formatDateTime(report.reportedAt) : loading ? 'Đang tải...' : '—'}
                </DialogDescription>
              </div>
            </div>
            {report && (
              <Badge variant={statusVariant(report.status)} className="self-start">
                {statusLabel(report.status)}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8 space-y-5">
          {!report && loading && (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Đang tải chi tiết...
            </p>
          )}

          {report && (
            <>
              {/* SECTION ĐẶC THÙ THEO LOẠI — Thu hoạch */}
              {report.type === 'HARVEST' && report.yieldEstimateKg ? (
                <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-200">
                      <Scale className="size-6" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                        Sản lượng thu hoạch dự kiến
                      </p>
                      <p className="text-3xl font-black tabular-nums text-emerald-700">
                        {report.yieldEstimateKg.toLocaleString('vi-VN')}{' '}
                        <span className="text-sm font-bold text-emerald-600/80">kg</span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* SECTION ĐẶC THÙ THEO LOẠI — Sự cố */}
              {report.type === 'INCIDENT' && (
                <div className="rounded-2xl border-2 border-rose-200 bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500 text-white shadow-md shadow-rose-200">
                      <AlertTriangle className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                        Tình trạng xử lý sự cố
                      </p>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        {report.incidentHandlingStatus ? (
                          <Badge
                            variant="outline"
                            className={cn(
                              'border font-semibold',
                              HANDLING_BADGE[report.incidentHandlingStatus],
                            )}
                          >
                            {INCIDENT_HANDLING_LABEL[report.incidentHandlingStatus]}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Chưa khởi tạo
                          </Badge>
                        )}
                        {report.incidentHandledAt && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3" />
                            Cập nhật lần cuối: {formatDateTime(report.incidentHandledAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Block cập nhật */}
                  <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="grid gap-3 md:grid-cols-[200px_1fr]">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">
                          Đổi trạng thái
                        </Label>
                        <Select
                          value={handlingDraft}
                          onValueChange={(v) => setHandlingDraft(v as IncidentHandlingStatus)}
                        >
                          <SelectTrigger className="h-9 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">
                              {INCIDENT_HANDLING_LABEL.PENDING}
                            </SelectItem>
                            <SelectItem value="IN_PROGRESS">
                              {INCIDENT_HANDLING_LABEL.IN_PROGRESS}
                            </SelectItem>
                            <SelectItem value="RESOLVED">
                              {INCIDENT_HANDLING_LABEL.RESOLVED}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">
                          Ghi chú xử lý
                          <span className="text-muted-foreground font-normal ml-1">
                            (tên chuyên gia được cử, kết quả xử lý...)
                          </span>
                        </Label>
                        <Textarea
                          value={handlingNoteDraft}
                          onChange={(e) => setHandlingNoteDraft(e.target.value)}
                          placeholder="Ví dụ: Cử kỹ sư Trần Văn A xuống kiểm tra ngày 13/05..."
                          className="min-h-[72px] bg-white resize-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={!isDirty || updatingHandling}
                        onClick={handleSaveHandling}
                        className="bg-rose-600 hover:bg-rose-700 text-white"
                      >
                        {updatingHandling && (
                          <Loader2 className="size-3.5 mr-2 animate-spin" />
                        )}
                        Lưu trạng thái xử lý
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* KHỐI THÔNG TIN CHUNG */}
              <div className="grid gap-3 rounded-2xl border bg-card p-5 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <User className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Giám sát viên
                    </p>
                    <p className="text-sm font-semibold truncate">
                      {report.supervisor?.user?.fullName ?? '—'}
                    </p>
                    {report.supervisor?.user?.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="size-3" />
                        {report.supervisor.user.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <MapPin className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Lô đất
                    </p>
                    <p className="text-sm font-semibold truncate">
                      {report.plot?.plotCode ?? '—'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {report.plot?.cropType ?? '—'} ·{' '}
                      {report.plot?.areaHa
                        ? `${report.plot.areaHa.toLocaleString('vi-VN')} ha`
                        : '—'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <User className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Nông dân
                    </p>
                    <p className="text-sm font-semibold truncate">
                      {report.plot?.farmer?.fullName ?? '—'}
                    </p>
                    {report.plot?.farmer?.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="size-3" />
                        {report.plot.farmer.phone}
                      </p>
                    )}
                  </div>
                </div>

                {report.plot?.contracts?.[0] && (
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <FileText className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Hợp đồng
                      </p>
                      <p className="text-sm font-semibold truncate">
                        {report.plot.contracts[0].contractNo}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {report.plot.contracts[0].product?.name} ·{' '}
                        {report.plot.contracts[0].grade}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* NỘI DUNG */}
              <div className="rounded-2xl border bg-card p-5">
                <Label
                  className={cn(
                    'text-[11px] font-bold uppercase tracking-wider',
                    typeMeta?.text,
                  )}
                >
                  Nội dung báo cáo
                </Label>
                <p
                  className={cn(
                    'mt-2 min-h-[120px] whitespace-pre-wrap rounded-lg border p-4 text-sm leading-relaxed',
                    report.type === 'INCIDENT'
                      ? 'border-rose-100 bg-rose-50/40'
                      : report.type === 'HARVEST'
                        ? 'border-emerald-100 bg-emerald-50/40'
                        : 'border-slate-100 bg-slate-50/40',
                  )}
                >
                  {report.content?.trim() ? report.content : '—'}
                </p>
              </div>

              {/* ẢNH */}
              <div className="rounded-2xl border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <Label
                    className={cn(
                      'text-[11px] font-bold uppercase tracking-wider',
                      typeMeta?.text,
                    )}
                  >
                    {report.type === 'HARVEST'
                      ? 'Ảnh minh chứng thu hoạch'
                      : report.type === 'INCIDENT'
                        ? 'Ảnh hiện trạng sự cố'
                        : 'Ảnh đính kèm'}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {report.imageUrls?.length ?? 0} ảnh
                  </span>
                </div>
                {report.imageUrls?.length ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {report.imageUrls.map((url, idx) => (
                      <a
                        key={`${idx}-${url.slice(0, 40)}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border bg-slate-50 shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-primary/30"
                      >
                        <img
                          src={url}
                          alt={`Ảnh ${idx + 1}`}
                          className="size-full object-cover transition-transform group-hover:scale-105"
                        />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm py-6 text-center">
                    Không có ảnh đính kèm.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t bg-slate-50/50 px-6 py-3 sm:justify-end sm:px-8 gap-2">
          {canReview && (
            <>
              <Button
                type="button"
                variant="destructive"
                disabled={reviewing}
                onClick={() => handleReview('REJECTED')}
              >
                {reviewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Từ chối
              </Button>
              <Button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={reviewing}
                onClick={() => handleReview('APPROVED')}
              >
                {reviewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle2 className="size-4 mr-1" />
                Duyệt báo cáo
              </Button>
            </>
          )}
          <Button type="button" variant="secondary" onClick={onClose} disabled={reviewing}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
