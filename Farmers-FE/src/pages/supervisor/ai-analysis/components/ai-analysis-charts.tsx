import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  LabelList,
} from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bug, ShieldAlert } from 'lucide-react';
import type { PlantScanRecord } from '../api';

// ─── Palette ─────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  fungal:    '#EF6C6C', // Đỏ nhạt
  bacterial: '#F5A623', // Cam
  viral:     '#7B68EE', // Tím
  algal:     '#00BCD4', // Xanh lơ
  healthy:   '#5CB85C', // Xanh lá
};

const CATEGORY_LABELS: Record<string, string> = {
  fungal:    'Nấm',
  bacterial: 'Vi khuẩn',
  viral:     'Virus',
  algal:     'Tảo',
  healthy:   'Khỏe mạnh',
};

const DANGER_COLORS: Record<string, string> = {
  'Thấp':      '#2ECC71',
  'Trung bình': '#F1C40F',
  'Cao':       '#E67E22',
  'Rất cao':   '#E74C3C',
};

// ─── Custom Tooltip ──────────────────────────────────────────

function PieTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
  total: number;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
  return (
    <div className="rounded-xl border border-gray-100 bg-white/95 backdrop-blur p-3 shadow-lg text-sm">
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-3 h-3 rounded-full"
          style={{ background: item.payload.color }}
        />
        <span className="font-medium text-gray-800">{item.name}</span>
      </div>
      <div className="mt-2 text-xs text-gray-500 pl-5">
        Số lượng: <span className="font-bold text-gray-900">{item.value}</span> ({pct}%)
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function aggregateCategory(records: PlantScanRecord[]) {
  const counts: Record<string, number> = {};
  for (const r of records) {
    counts[r.category] = (counts[r.category] ?? 0) + 1;
  }
  return Object.keys(CATEGORY_LABELS).map((key) => ({
    name: CATEGORY_LABELS[key] ?? key,
    value: counts[key] ?? 0,
    color: CATEGORY_COLORS[key] ?? '#94a3b8',
  })).filter(item => item.value > 0); // Only show categories that have data for the pie chart
}

function aggregateDanger(records: PlantScanRecord[]) {
  const order = ['Thấp', 'Trung bình', 'Cao', 'Rất cao'];
  const counts: Record<string, number> = {};
  for (const r of records) {
    counts[r.dangerLevel] = (counts[r.dangerLevel] ?? 0) + 1;
  }
  // Always return all 4 levels even if count is 0
  return order.map((key) => ({
    name: key,
    value: counts[key] ?? 0,
    fill: DANGER_COLORS[key] ?? '#94a3b8',
  }));
}

// ─── Chart Cards ─────────────────────────────────────────────

interface Props {
  records: PlantScanRecord[];
  isLoading: boolean;
}

export function AiAnalysisCharts({ records, isLoading }: Props) {
  const categoryData = aggregateCategory(records);
  const dangerData = aggregateDanger(records);
  const totalScans = records.length;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[55%_45%]">
        <Skeleton className="min-h-[280px] rounded-[12px]" />
        <Skeleton className="min-h-[280px] rounded-[12px]" />
      </div>
    );
  }

  if (totalScans === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[55%_45%]">
      {/* Biểu đồ tròn — Phân loại bệnh */}
      <Card className="rounded-[12px] border-[#E8E8E8] shadow-sm flex flex-col">
        <CardHeader className="p-6 pb-2">
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-gray-700" />
            <span className="text-[15px] font-semibold text-gray-900">Phân loại bệnh</span>
          </div>
          <p className="text-sm text-[#888]">Tỷ lệ các loại bệnh phát hiện</p>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex-1 flex flex-col justify-center">
          <div className="relative h-[200px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  paddingAngle={categoryData.length > 1 ? 4 : 0}
                  cornerRadius={categoryData.length > 1 ? 6 : 0}
                  dataKey="value"
                  stroke="none"
                  animationDuration={800}
                >
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip total={totalScans} />} cursor={{fill: 'transparent'}} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-gray-800">{totalScans}</span>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tổng</span>
            </div>
          </div>

          {/* Horizontal Legend */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-full shrink-0"
                  style={{ background: item.color }}
                />
                <span className="text-sm font-medium text-gray-700">{item.name}</span>
                <span className="text-sm font-bold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Biểu đồ cột — Mức độ nguy hiểm */}
      <Card className="rounded-[12px] border-[#E8E8E8] shadow-sm flex flex-col">
        <CardHeader className="p-6 pb-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-gray-700" />
            <span className="text-[15px] font-semibold text-gray-900">Mức độ nguy hiểm</span>
          </div>
          <p className="text-sm text-[#888]">Số lượt theo mức cảnh báo</p>
        </CardHeader>
        <CardContent className="p-6 pt-4 flex-1 flex flex-col justify-end">
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dangerData}
                margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                barSize={40}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  formatter={(value: number) => [`${value} lượt`, 'Số lượt']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E8E8E8', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={800}>
                  {dangerData.map((entry, i) => (
                    <Cell key={i} fill={entry.value > 0 ? entry.fill : '#f1f5f9'} />
                  ))}
                  <LabelList 
                    dataKey="value" 
                    position="top" 
                    fill="#64748b" 
                    fontSize={12} 
                    fontWeight={600} 
                    formatter={(val: number) => val > 0 ? val : ''}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
