import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { WarehouseIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background/95 px-3 py-2 shadow-md backdrop-blur-sm">
      <p className="mb-2 text-xs font-semibold text-foreground">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
          {entry.name === 'inbound'
            ? 'Nhập kho'
            : entry.name === 'outbound'
              ? 'Xuất kho'
              : 'Điều chỉnh'}
          : <span className="font-semibold">{entry.value.toLocaleString('vi-VN')} kg</span>
        </p>
      ))}
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
    <Card className="rounded-[20px] border border-border/70 bg-card/85 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <WarehouseIcon className="size-4 text-primary" />
          <span className="font-manrope text-sm font-semibold">
            Biểu đồ giao dịch 7 ngày
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">Tổng sản lượng (kg)</span>
      </CardHeader>
      <CardContent className="pb-5">
        {isLoading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : !data || chartData.every((d) => d.inbound === 0 && d.outbound === 0 && d.adjustment === 0) ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/20">
            <WarehouseIcon className="size-6 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Chưa có dữ liệu giao dịch trong 7 ngày qua
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
              barCategoryGap="30%"
              barGap={2}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var-border)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'hsl(var-muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var-muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var-muted) / 0.4' }} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(value) =>
                  value === 'inbound'
                    ? 'Nhập kho'
                    : value === 'outbound'
                      ? 'Xuất kho'
                      : 'Điều chỉnh'
                }
              />
              <Bar
                dataKey="inbound"
                fill="#10b981"
                name="inbound"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="outbound"
                fill="#ef4444"
                name="outbound"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="adjustment"
                fill="#f59e0b"
                name="adjustment"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
