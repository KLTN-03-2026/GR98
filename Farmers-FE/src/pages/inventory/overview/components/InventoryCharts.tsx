import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ChartDataResponse } from '../api/types';

const INBOUND_GRADIENT_ID = 'inventoryOverviewInboundFill';
const OUTBOUND_GRADIENT_ID = 'inventoryOverviewOutboundFill';

export function InventoryCharts({
  data,
  isLoading,
}: {
  data: ChartDataResponse | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <Skeleton className="h-[340px] w-full rounded-2xl" />;
  }

  const chartData = data?.labels.map((label, i) => ({
    name: label,
    label: label.slice(5), // Similar to admin date slice
    inbound: data.inbound[i],
    outbound: data.outbound[i],
  })) || [];

  return (
    <Card className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-b from-card to-primary/[0.03] shadow-sm dark:to-primary/[0.06]">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-lg font-semibold tracking-tight">
          Xu hướng biến động kho hàng
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Theo dõi lưu lượng hàng nhập và xuất theo thời gian
        </p>
      </CardHeader>
      <CardContent className="h-[260px] pt-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={INBOUND_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary-500)" stopOpacity={0.22} />
                <stop offset="95%" stopColor="var(--primary-500)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={OUTBOUND_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--secondary-500)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--secondary-500)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" vertical={false} />
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 12 }} 
              className="text-muted-foreground"
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              allowDecimals={false} 
              width={36} 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              offset={12}
              cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '3 3' }}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid hsl(var(--border))',
                fontSize: 12,
              }}
              formatter={(value, name) => {
                const label = name === 'inbound' ? 'Nhập kho' : 'Xuất kho';
                return [`${Number(value).toLocaleString('vi-VN')} kg`, label];
              }}
            />
            <Area
              type="monotone"
              dataKey="inbound"
              stroke="var(--primary-500)"
              strokeWidth={1.8}
              fill={`url(#${INBOUND_GRADIENT_ID})`}
            />
            <Area
              type="monotone"
              dataKey="outbound"
              stroke="var(--secondary-500)"
              strokeWidth={1.6}
              fill={`url(#${OUTBOUND_GRADIENT_ID})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
