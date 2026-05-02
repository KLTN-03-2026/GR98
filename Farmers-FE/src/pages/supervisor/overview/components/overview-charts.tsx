import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardStatusSlice, DashboardTimePoint } from '../api/types';
import { SupervisorEmptyState } from './supervisor-empty-state';

const PIE_COLORS = [
  'var(--primary-700)',
  'var(--primary-500)',
  'var(--primary-400)',
  'var(--primary-300)',
  'var(--secondary-600)',
  'var(--secondary-500)',
  'var(--primary-600)',
];

const BAR_FILL = 'var(--primary-500)';

function tooltipNumber(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function OverviewCharts({
  timeseries,
  statusDistribution,
  dailyReportStatusDistribution,
  isLoading,
}: {
  timeseries: DashboardTimePoint[] | undefined;
  statusDistribution: DashboardStatusSlice[] | undefined;
  dailyReportStatusDistribution?: DashboardStatusSlice[] | undefined;
  isLoading: boolean;
}) {
  const chartData =
    timeseries?.map((p) => ({
      ...p,
      label: p.date.slice(5),
    })) ?? [];

  const pieData =
    statusDistribution?.map((s) => ({
      name: s.label,
      value: s.count,
      status: s.status,
    })) ?? [];

  const totalPie = pieData.reduce((a, b) => a + b.value, 0);

  const reportPieData =
    dailyReportStatusDistribution?.map((s) => ({
      name: s.label,
      value: s.count,
      status: s.status,
    })) ?? [];
  const totalReportPie = reportPieData.reduce((a, b) => a + b.value, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="overflow-hidden rounded-2xl border-primary/15 bg-gradient-to-b from-card to-primary/[0.04] shadow-sm dark:to-primary/[0.08]">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
            Hợp đồng mới theo ngày
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Số hợp đồng được tạo mỗi ngày trong khoảng đã chọn (phạm vi giám sát của bạn).
          </p>
        </CardHeader>
        <CardContent className="h-[280px] pb-4 pt-0">
          {isLoading ? (
            <Skeleton className="h-full w-full rounded-xl" />
          ) : chartData.length === 0 ? (
            <SupervisorEmptyState message="Chưa có dữ liệu hợp đồng trong khoảng thời gian này." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis allowDecimals={false} width={40} tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted) / 0.35)' }}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid hsl(var(--border))',
                    fontSize: 12,
                  }}
                  formatter={(value) => [
                    tooltipNumber(value).toLocaleString('vi-VN'),
                    'Hợp đồng',
                  ]}
                />
                <Bar dataKey="value" fill={BAR_FILL} radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl border-primary/15 bg-gradient-to-b from-card to-primary/[0.04] shadow-sm dark:to-primary/[0.08]">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-lg font-semibold tracking-tight">Trạng thái hợp đồng</CardTitle>
          <p className="text-sm text-muted-foreground">
            Phân bổ hợp đồng trong kỳ — chỉ trong phạm vi bạn phụ trách.
          </p>
        </CardHeader>
        <CardContent className="h-[280px] pb-4 pt-0">
          {isLoading ? (
            <Skeleton className="h-full w-full rounded-xl" />
          ) : totalPie === 0 ? (
            <SupervisorEmptyState message="Chưa có hợp đồng trong kỳ để hiển thị biểu đồ." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={86}
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`${entry.status}-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _name, item) => {
                    const num = tooltipNumber(value);
                    const pct = totalPie ? (num / totalPie) * 100 : 0;
                    const label =
                      item && typeof item === 'object' && 'payload' in item
                        ? (item.payload as { name?: string }).name
                        : undefined;
                    return [`${num.toLocaleString('vi-VN')} (${pct.toFixed(1)}%)`, label ?? ''];
                  }}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid hsl(var(--border))',
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {totalReportPie > 0 ? (
        <Card className="overflow-hidden rounded-2xl border-primary/15 bg-gradient-to-b from-card to-primary/[0.04] shadow-sm dark:to-primary/[0.08] lg:col-span-2">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Trạng thái báo cáo trong kỳ
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Phân bổ báo cáo hằng ngày theo trạng thái (phạm vi bạn phụ trách).
            </p>
          </CardHeader>
          <CardContent className="h-[260px] pb-4 pt-0">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {reportPieData.map((entry, index) => (
                      <Cell
                        key={`${entry.status}-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, item) => {
                      const num = tooltipNumber(value);
                      const pct = totalReportPie ? (num / totalReportPie) * 100 : 0;
                      const label =
                        item && typeof item === 'object' && 'payload' in item
                          ? (item.payload as { name?: string }).name
                          : undefined;
                      return [`${num.toLocaleString('vi-VN')} (${pct.toFixed(1)}%)`, label ?? ''];
                    }}
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid hsl(var(--border))',
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
