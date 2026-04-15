import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SupplyDemandItem } from '../api/types';

interface Props {
  data: SupplyDemandItem[];
}

export function SupplyDemandChart({ data }: Props) {
  return (
    <Card className="rounded-[24px] border border-border/70 bg-card/85 shadow-sm transition-all duration-300 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="font-manrope text-sm font-semibold">
          Biểu đồ So sánh Cung - Cầu
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border)"
            />
            <XAxis
              dataKey="cropType"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickFormatter={(value) => `${value} kg`}
            />
            <Tooltip
              cursor={{ fill: 'var(--muted)', fillOpacity: 0.3 }}
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 12px rgba(16, 24, 40, 0.08)',
                fontSize: '12px',
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{
                paddingBottom: '20px',
                fontSize: '11px',
              }}
            />
            <Bar
              name="Dự kiến sản lượng"
              dataKey="expectedKg"
              fill="#3B82F6" 
              radius={[4, 4, 0, 0]}
              barSize={24}
            />
            <Bar
              name="Tồn kho thực tế"
              dataKey="actualStockKg"
              fill="#7BAE3C"
              radius={[4, 4, 0, 0]}
              barSize={24}
            />
            <Bar
              name="Nhu cầu (Đơn hàng chờ)"
              dataKey="pendingOrderKg"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
