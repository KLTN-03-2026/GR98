import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDailyReports } from '../../../admin/daily-reports/api/use-daily-reports';
import { Truck, Scale, ChevronRight, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface IncomingHarvestsProps {
  onReceive: (reportId: string) => void;
}

export default function IncomingHarvests({ onReceive }: IncomingHarvestsProps) {
  const { data: pendingReports, isLoading } = useDailyReports({ status: 'SUBMITTED' });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  const reports = pendingReports?.data || [];

  if (reports.length === 0) {
    return (
      <Card className="border-dashed border-slate-200 bg-slate-50/50 shadow-none rounded-[24px]">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <Truck className="size-6 text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-500">Không có lô hàng nào đang về</p>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Tất cả báo cáo thu hoạch đã được xử lý</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 animate-pulse">
            <Truck className="size-4" />
          </div>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">
            Lô hàng đang vận chuyển ({reports.length})
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <Card 
            key={report.id} 
            className="group relative overflow-hidden border-none shadow-sm bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-500 rounded-[24px]"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400 group-hover:bg-amber-500 transition-colors" />
            
            <CardHeader className="p-5 pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-none text-[10px] font-black rounded-lg px-2">
                      ĐANG VỀ KHO
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <Clock className="size-3" />
                      {format(new Date(report.reportedAt), 'HH:mm')}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-black text-slate-900 flex flex-col">
                    <span className="text-[11px] text-amber-600 uppercase tracking-wider font-black">Lô {report.plot.plotCode}</span>
                    <span className="mt-0.5">{report.plot.cropType || 'Nông sản'}</span>
                  </CardTitle>
                </div>
                <div className="size-11 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-500 transition-all duration-500 group-hover:scale-110 shadow-sm">
                  <Truck className="size-5" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-0 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col p-2.5 rounded-2xl bg-slate-50/50 group-hover:bg-amber-50/30 transition-colors">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Dự tính GSV</span>
                  <span className="font-black text-slate-900 text-sm flex items-baseline gap-1">
                    {report.yieldEstimateKg?.toLocaleString()} <span className="text-[10px] opacity-40 font-bold">kg</span>
                  </span>
                </div>
                <div className="flex flex-col p-2.5 rounded-2xl bg-slate-50/50 group-hover:bg-amber-50/30 transition-colors">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Giám sát viên</span>
                  <span className="font-bold text-slate-700 text-[11px] truncate" title={report.supervisor.user.fullName}>
                    {report.supervisor.user.fullName.split(' ').pop()}
                  </span>
                </div>
              </div>

              <Button 
                onClick={() => onReceive(report.id)}
                className="w-full bg-slate-900 hover:bg-amber-600 text-white rounded-2xl h-12 font-bold text-xs gap-3 transition-all duration-300 shadow-sm group-hover:shadow-amber-200 group-hover:shadow-lg"
              >
                <Scale className="size-4" />
                BẮT ĐẦU CÂN HÀNG
                <ChevronRight className="size-4 ml-auto opacity-30 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
