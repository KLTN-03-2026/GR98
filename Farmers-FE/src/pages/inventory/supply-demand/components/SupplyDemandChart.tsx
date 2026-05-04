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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SupplyDemandItem } from '../api/types';

interface Props {
  data: SupplyDemandItem[];
}

export function SupplyDemandChart({ data }: Props) {
  return (
    <Card className="border-border/60 shadow-xs overflow-hidden">
      <CardHeader className="pb-2 pt-6 px-6">
        <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">Trực quan hóa Cung - Cầu</CardTitle>
        <p className="text-xs text-muted-foreground font-medium italic">Biểu đồ so sánh sản lượng dự kiến, tồn thực tế và nhu cầu đơn hàng.</p>
      </CardHeader>
      <CardContent className="h-[400px] w-full pt-6 pb-6 px-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />
            <XAxis
              dataKey="cropType"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
              tickFormatter={(value) => `${value.toLocaleString('vi-VN')} kg`}
            />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)',
                fontSize: '11px',
                padding: '12px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{
                paddingBottom: '30px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            />
            <Bar
              name="Dự kiến"
              dataKey="expectedKg"
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
              barSize={16}
            />
            <Bar
              name="Tồn kho"
              dataKey="actualStockKg"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              barSize={16}
            />
            <Bar
              name="Nhu cầu"
              dataKey="pendingOrderKg"
              fill="#f43f5e"
              radius={[4, 4, 0, 0]}
              barSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
