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
    <Card className="rounded-[2rem] border border-slate-200/60 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/30">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[10px] font-manrope font-bold uppercase tracking-tight text-slate-400 flex items-center gap-2">
            <TrendingUp className="size-4 text-emerald-500" />
            Phân tích Cân bằng Cung - Cầu
          </h3>
          <p className="text-[10px] font-medium text-slate-400">So sánh sản lượng dự kiến, tồn kho và đơn hàng</p>
        </div>
      </CardHeader>
      <CardContent className="h-[450px] w-full p-6">
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
              tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8', fontFamily: 'Manrope' }}
              dy={15}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8', fontFamily: 'Manrope' }}
              tickFormatter={(value) => `${value.toLocaleString('vi-VN')} kg`}
            />
            <Tooltip
              cursor={{ fill: '#f8fafc', fillOpacity: 0.8 }}
              contentStyle={{
                borderRadius: '1.5rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                fontSize: '11px',
                fontFamily: 'Manrope',
                padding: '12px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{
                paddingBottom: '30px',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.025em',
                color: '#64748b',
                fontFamily: 'Manrope'
              }}
            />
            <Bar
              name="Sản lượng Dự kiến"
              dataKey="expectedKg"
              fill="#3b82f6" 
              radius={[6, 6, 0, 0]}
              barSize={20}
            />
            <Bar
              name="Tồn kho Thực tế"
              dataKey="actualStockKg"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              barSize={20}
            />
            <Bar
              name="Nhu cầu Đơn hàng"
              dataKey="pendingOrderKg"
              fill="#f43f5e"
              radius={[6, 6, 0, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
