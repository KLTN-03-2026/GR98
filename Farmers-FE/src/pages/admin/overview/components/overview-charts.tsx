import {
  Area,
  AreaChart,
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
import type {
  AdminDashboardStatusSlice,
  AdminDashboardTimePoint,
} from '../api/types';
import { OverviewEmptyState } from './overview-empty-state';

/** Dải màu lá + teal phụ (primary / secondary trong design system). */
const PIE_COLORS = [
  'var(--primary-500)',
  'var(--primary-700)',
  'var(--primary-300)',
  'var(--secondary-500)',
  'var(--secondary-600)',
  'var(--primary-600)',
];

const ORDER_GRADIENT_ID = 'adminOverviewOrdersFill';
const CONTRACT_GRADIENT_ID = 'adminOverviewContractsFill';
const REVENUE_GRADIENT_ID = 'adminOverviewRevenueFill';

function tooltipNumber(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function StatusPie({
  title,
  description,
  data,
  isLoading,
}: {
  title: string;
  description: string;
  data: AdminDashboardStatusSlice[] | undefined;
  isLoading: boolean;
}) {
  const pieData =
    data?.map((s) => ({
      name: s.label,
      value: s.count,
      key: s.key,
    })) ?? [];
  const total = pieData.reduce((a, b) => a + b.value, 0);

  return (
    <Card className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-b from-card to-primary/[0.03] shadow-sm dark:to-primary/[0.06]">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="h-[240px] pt-0">
        {isLoading ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : total === 0 ? (
          <OverviewEmptyState message="Không có dữ liệu trong bộ lọc hiện tại." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={68}
                paddingAngle={1}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`${entry.key}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                offset={10}
                formatter={(value, _name, item) => {
                  const num = tooltipNumber(value);
                  const pct = total ? (num / total) * 100 : 0;
                  const label =
                    item && typeof item === 'object' && 'payload' in item
                      ? (item.payload as { name?: string }).name
                      : undefined;
                  return [`${num.toLocaleString('vi-VN')} (${pct.toFixed(1)}%)`, label ?? ''];
                }}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid hsl(var(--border))',
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function OverviewCharts({
  timeseries,
  orderFulfillDistribution,
  orderPaymentDistribution,
  contractStatusDistribution,
  isLoading,
}: {
  timeseries: AdminDashboardTimePoint[] | undefined;
  orderFulfillDistribution: AdminDashboardStatusSlice[] | undefined;
  orderPaymentDistribution: AdminDashboardStatusSlice[] | undefined;
  contractStatusDistribution: AdminDashboardStatusSlice[] | undefined;
  isLoading: boolean;
}) {
  const chartData =
    timeseries?.map((p) => ({
      ...p,
      label: p.date.slice(5),
    })) ?? [];

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-b from-card to-primary/[0.03] shadow-sm dark:to-primary/[0.06]">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Xu hướng đơn hàng, doanh thu, hợp đồng
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Dữ liệu theo bộ lọc thời gian đang chọn
          </p>
        </CardHeader>
        <CardContent className="h-[260px] pt-0">
          {isLoading ? (
            <Skeleton className="h-full w-full rounded-xl" />
          ) : chartData.length === 0 ? (
            <OverviewEmptyState message="Không có dữ liệu timeseries trong khoảng thời gian này." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={ORDER_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-500)" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="var(--primary-500)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id={CONTRACT_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--secondary-500)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--secondary-500)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id={REVENUE_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-700)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--primary-700)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis allowDecimals={false} width={36} tick={{ fontSize: 12 }} />
                <Tooltip
                  offset={12}
                  cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '3 3' }}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid hsl(var(--border))',
                    fontSize: 12,
                  }}
                  formatter={(value, _name, item) => {
                    const num = tooltipNumber(value);
                    const dataKey =
                      item && typeof item === 'object' && 'dataKey' in item
                        ? String((item as { dataKey?: string }).dataKey ?? '')
                        : '';
                    if (dataKey === 'revenue') {
                      return [`${Math.round(num).toLocaleString('vi-VN')} đ`, 'Doanh thu'];
                    }
                    if (dataKey === 'orders') {
                      return [num.toLocaleString('vi-VN'), 'Đơn hàng'];
                    }
                    return [num.toLocaleString('vi-VN'), 'Hợp đồng'];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="var(--primary-500)"
                  strokeWidth={1.8}
                  fill={`url(#${ORDER_GRADIENT_ID})`}
                />
                <Area
                  type="monotone"
                  dataKey="contracts"
                  stroke="var(--secondary-500)"
                  strokeWidth={1.6}
                  fill={`url(#${CONTRACT_GRADIENT_ID})`}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--primary-700)"
                  strokeWidth={1.6}
                  fill={`url(#${REVENUE_GRADIENT_ID})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <StatusPie
          title="Đơn hàng theo trạng thái xử lý"
          description="Phân bổ fulfill status"
          data={orderFulfillDistribution}
          isLoading={isLoading}
        />
        <StatusPie
          title="Đơn hàng theo thanh toán"
          description="Phân bổ payment status"
          data={orderPaymentDistribution}
          isLoading={isLoading}
        />
        <StatusPie
          title="Hợp đồng theo trạng thái"
          description="Phân bổ toàn bộ hợp đồng tenant"
          data={contractStatusDistribution}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
