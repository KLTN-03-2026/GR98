import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { PlantScanRecord } from '../api';

interface Props {
  record: PlantScanRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  fungal: 'Nấm',
  bacterial: 'Vi khuẩn',
  viral: 'Virus',
  algal: 'Tảo',
  healthy: 'Khỏe mạnh',
};

const DANGER_COLOR: Record<string, string> = {
  'Thấp':     'bg-green-100 text-green-700',
  'Trung bình': 'bg-yellow-100 text-yellow-700',
  'Cao':      'bg-orange-100 text-orange-700',
  'Rất cao':  'bg-red-100 text-red-700',
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

export function AiAnalysisDetailSheet({ record, open, onOpenChange }: Props) {
  if (!record) return null;

  const pct = (record.confidence * 100).toFixed(1);
  const dangerCls = DANGER_COLOR[record.dangerLevel] ?? 'bg-gray-100 text-gray-700';
  const categoryLabel = CATEGORY_LABEL[record.category] ?? record.category;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-0">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg">Chi tiết kết quả phân tích</SheetTitle>
          <SheetDescription>
            {format(new Date(record.scannedAt), "dd/MM/yyyy 'lúc' HH:mm", { locale: vi })}
            {record.supervisor && (
              <> · {record.supervisor.user.fullName}</>
            )}
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <div className="flex-1 space-y-5 py-4">
          {/* Kết quả chính */}
          <div className={`rounded-xl p-4 ${record.category === 'healthy' ? 'bg-green-50' : 'bg-red-50/60'}`}>
            <p className="text-xl font-bold">{record.diseaseVi}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{record.diseaseEn}</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${dangerCls}`}>
                {record.dangerLevel}
              </span>
              <Badge variant="secondary">{categoryLabel}</Badge>
              <span className={`text-sm font-semibold ${record.confidence >= 0.7 ? 'text-green-600' : record.confidence >= 0.4 ? 'text-yellow-600' : 'text-red-600'}`}>
                {pct}% chính xác
              </span>
            </div>
          </div>

          {/* Thông tin lô đất */}
          {record.plot && (
            <div className="space-y-3 p-3 bg-muted/40 rounded-lg">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lô đất</p>
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="Mã lô" value={record.plot.plotCode} />
                <InfoRow label="Loại cây" value={record.plot.cropType} />
                <InfoRow label="Nông dân" value={record.plot.farmer.fullName} />
              </div>
            </div>
          )}

          <Separator />

          {/* Tác nhân */}
          <InfoRow
            label="Tác nhân gây bệnh"
            value={<span className="text-blue-700 font-medium">{record.causingAgent || '—'}</span>}
          />

          {/* Triệu chứng */}
          <InfoRow
            label="Triệu chứng"
            value={
              <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                {record.symptoms || '—'}
              </p>
            }
          />

          <Separator />

          {/* Hướng điều trị */}
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-800 mb-2">
              Hướng điều trị
            </p>
            <p className="text-sm text-green-900 whitespace-pre-line leading-relaxed">
              {record.treatment || '—'}
            </p>
          </div>

          {/* Ảnh nếu có */}
          {record.imageDataUrl && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ảnh chụp
              </p>
              <img
                src={record.imageDataUrl}
                alt="Ảnh lá cây"
                className="w-full rounded-xl border object-cover max-h-64"
              />
            </div>
          )}

          {/* Thời gian xử lý */}
          {record.processingMs && (
            <p className="text-xs text-muted-foreground text-right">
              Thời gian xử lý AI: {record.processingMs.toFixed(0)}ms
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
