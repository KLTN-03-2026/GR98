import { BarChart3, Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminDailyReportsPage() {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-dashed border-2">
        <CardContent className="flex flex-col items-center pt-10 pb-10 text-center space-y-4">
          <div className="p-4 bg-blue-500/10 rounded-full">
            <BarChart3 className="h-10 w-10 text-blue-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Báo cáo Hằng ngày</h1>
            <p className="text-muted-foreground text-sm">
              Xem và duyệt các báo cáo hàng ngày, theo dõi hoạt động thực địa và tiến độ công việc. Đang trong quá trình hoàn thiện.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 flex gap-1 items-center hover:bg-blue-100 border-none">
              <Construction className="h-3 w-3" />
              Coming Soon
            </Badge>
            <Badge variant="outline">Sprint 3</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
