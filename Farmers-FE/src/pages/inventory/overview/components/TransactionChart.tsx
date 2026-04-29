import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { WarehouseIcon, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ChartDataResponse {
  labels: string[];
  inbound: number[];
  outbound: number[];
  adjustment: number[];
}

interface TransactionChartProps {
  data: ChartDataResponse | undefined;
  isLoading: boolean;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string; dataKey: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/95 p-4 shadow-xl backdrop-blur-md">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <div className="space-y-2">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-[11px] font-bold text-slate-600 uppercase">
                {entry.dataKey === 'inbound' ? 'Nhập kho' : entry.dataKey === 'outbound' ? 'Xuất kho' : 'Điều chỉnh'}
              </span>
            </div>
            <span className="text-xs font-bold text-slate-900 tabular-nums">
              {entry.value.toLocaleString('vi-VN')} kg
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function TransactionChart({ data, isLoading }: TransactionChartProps) {
  const chartData =
    data?.labels?.map((label, i) => ({
      date: label,
      inbound: data.inbound[i] ?? 0,
      outbound: data.outbound[i] ?? 0,
      adjustment: data.adjustment[i] ?? 0,
    })) ?? [];

  return (
    <Card className="rounded-[2rem] border border-slate-200/60 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/30">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[10px] font-manrope font-bold uppercase tracking-tight text-slate-400 flex items-center gap-2">
            <TrendingUp className="size-3.5 text-emerald-500" />
            Biến động tồn kho 7 ngày
          </h3>
          <p className="text-[10px] font-medium text-slate-400">Sản lượng giao dịch thực tế (kg)</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="size-1.5 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Nhập</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-1.5 rounded-full bg-rose-500" />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Xuất</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 py-6">
        {isLoading ? (
          <Skeleton className="h-[300px] w-full rounded-2xl" />
        ) : !data || chartData.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
            <WarehouseIcon className="size-8 text-slate-300 opacity-50" />
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Chưa có dữ liệu giao dịch
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="inbound"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorInbound)"
                animationDuration={1500}
              />
              <Area
                type="monotone"
                dataKey="outbound"
                stroke="#ef4444"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorOutbound)"
                animationDuration={1500}
              />
              <Area
                type="monotone"
                dataKey="adjustment"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
