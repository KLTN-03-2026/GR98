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
import {
  type DailyReportResponse,
  type DailyReportStatus,
  useReviewDailyReport,
} from './api';
import { Loader2 } from 'lucide-react';

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

  const canReview = report?.type === 'HARVEST' && report?.status === 'SUBMITTED';

  const handleReview = (status: 'APPROVED' | 'REJECTED') => {
    if (!report) return;
    review({ id: report.id, status });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        showCloseButton
        className="flex w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] max-h-[min(94dvh,1080px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl lg:max-w-7xl"
      >
        <DialogHeader className="shrink-0 border-b px-6 py-4 text-left sm:px-8">
          <DialogTitle>Chi tiết báo cáo</DialogTitle>
          <DialogDescription>
            {report ? formatDateTime(report.reportedAt) : loading ? 'Đang tải...' : '—'}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 sm:px-8">
          {report && (
            <div className="space-y-5">
              <div className="grid gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Giám sát: </span>
                  {report.supervisor?.user?.fullName ?? '—'}
                </div>
                <div>
                  <span className="text-muted-foreground">Lô: </span>
                  {report.plot?.plotCode ?? '—'} ({report.plot?.cropType ?? '—'})
                </div>
                <div>
                  <span className="text-muted-foreground">Nông dân: </span>
                  {report.plot?.farmer?.fullName ?? '—'}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground">Trạng thái: </span>
                  <Badge variant={statusVariant(report.status)}>{statusLabel(report.status)}</Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Nội dung</Label>
                <p className="mt-1 min-h-[140px] whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm sm:text-base">
                  {report.content?.trim() ? report.content : '—'}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-base">Ảnh ({report.imageUrls?.length ?? 0})</Label>
                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                  {(report.imageUrls ?? []).map((url, idx) => (
                    <a
                      key={`${idx}-${url.slice(0, 40)}`}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-[min(52vh,480px)] w-full items-center justify-center overflow-hidden rounded-lg border-2 bg-muted/50 p-1 shadow-sm transition-opacity hover:opacity-95 md:min-h-[min(48vh,560px)]"
                    >
                      <img
                        src={url}
                        alt={`Ảnh ${idx + 1}`}
                        className="max-h-[min(52vh,480px)] w-full object-contain md:max-h-[min(48vh,560px)]"
                      />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
          {!report && loading && (
            <p className="text-muted-foreground py-8 text-center text-sm">Đang tải chi tiết...</p>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-3 sm:justify-end sm:px-8 gap-2">
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
                Xác nhận
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
