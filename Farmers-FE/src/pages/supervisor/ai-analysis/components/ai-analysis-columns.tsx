import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import type { PlantScanRecord } from '../api';

// ─── Helpers ─────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
  fungal:    { label: 'Nấm',      variant: 'destructive' },
  bacterial: { label: 'Vi khuẩn', variant: 'destructive' },
  viral:     { label: 'Virus',    variant: 'outline' },
  algal:     { label: 'Tảo',      variant: 'secondary' },
  healthy:   { label: 'Khỏe mạnh', variant: 'secondary' },
};

const DANGER_MAP: Record<string, string> = {
  'Thấp':     'bg-green-100 text-green-700',
  'Trung bình': 'bg-yellow-100 text-yellow-700',
  'Cao':      'bg-orange-100 text-orange-700',
  'Rất cao':  'bg-red-100 text-red-700',
};

function DangerBadge({ level }: { level: string }) {
  const cls = DANGER_MAP[level] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {level}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const info = CATEGORY_MAP[category] ?? { label: category, variant: 'secondary' as const };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}

// ─── Columns ─────────────────────────────────────────────────

export function createAiAnalysisColumns(
  onView: (row: PlantScanRecord) => void,
): ColumnDef<PlantScanRecord>[] {
  return [
    {
      accessorKey: 'scannedAt',
      header: 'Thời gian quét',
      meta: { title: 'Thời gian quét' },
      cell: ({ row }) =>
        format(new Date(row.original.scannedAt), 'dd/MM/yyyy HH:mm', { locale: vi }),
    },
    {
      id: 'plot',
      header: 'Lô đất / Nông dân',
      meta: { title: 'Lô đất / Nông dân' },
      cell: ({ row }) => {
        const plot = row.original.plot;
        if (!plot) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-sm">{plot.plotCode}</span>
            <span className="text-xs text-muted-foreground">{plot.farmer.fullName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'diseaseVi',
      header: 'Tên bệnh',
      meta: { title: 'Tên bệnh' },
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.original.diseaseVi}</span>
          <span className="text-xs text-muted-foreground">{row.original.diseaseEn}</span>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Phân loại',
      meta: { title: 'Phân loại' },
      cell: ({ row }) => <CategoryBadge category={row.original.category} />,
    },
    {
      accessorKey: 'dangerLevel',
      header: 'Mức độ nguy hiểm',
      meta: { title: 'Mức độ nguy hiểm' },
      cell: ({ row }) => <DangerBadge level={row.original.dangerLevel} />,
    },
    {
      accessorKey: 'confidence',
      header: 'Độ chính xác',
      meta: { title: 'Độ chính xác' },
      cell: ({ row }) => {
        const pct = (row.original.confidence * 100).toFixed(1);
        const color =
          row.original.confidence >= 0.7
            ? 'text-green-600'
            : row.original.confidence >= 0.4
              ? 'text-yellow-600'
              : 'text-red-600';
        return <span className={`font-semibold text-sm ${color}`}>{pct}%</span>;
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onView(row.original);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];
}

