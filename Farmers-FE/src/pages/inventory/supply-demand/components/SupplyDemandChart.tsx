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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Phân tích Cân bằng Cung - Cầu</CardTitle>
      </CardHeader>
      <CardContent className="h-[450px] w-full pt-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
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
              tick={{ fontSize: 12, fill: '#64748b' }}
              dy={15}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={(value) => `${value.toLocaleString('vi-VN')} kg`}
            />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                fontSize: '12px',
                padding: '12px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{
                paddingBottom: '20px',
                fontSize: '12px',
                color: '#64748b',
              }}
            />
            <Bar
              name="Sản lượng Dự kiến"
              dataKey="expectedKg"
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Bar
              name="Tồn kho Thực tế"
              dataKey="actualStockKg"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Bar
              name="Nhu cầu Đơn hàng"
              dataKey="pendingOrderKg"
              fill="#f43f5e"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
