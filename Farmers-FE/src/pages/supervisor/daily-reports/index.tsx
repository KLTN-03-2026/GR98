import { FileSpreadsheet, Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SupervisorDailyReportsPage() {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-dashed border-2">
        <CardContent className="flex flex-col items-center pt-10 pb-10 text-center space-y-4">
          <div className="p-4 bg-sky-500/10 rounded-full">
            <FileSpreadsheet className="h-10 w-10 text-sky-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Báo cáo hàng ngày</h1>
            <p className="text-muted-foreground text-sm">
              Gửi và quản lý các báo cáo thực địa trong ngày. Tính năng tải ảnh và phân loại sự cố đang được hoàn thiện.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="secondary" className="bg-sky-100 text-sky-700 flex gap-1 items-center hover:bg-sky-100 border-none">
              <Construction className="h-3 w-3" />
              Coming Soon
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
