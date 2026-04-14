import { Map, Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SupervisorPlotsPage() {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-dashed border-2">
        <CardContent className="flex flex-col items-center pt-10 pb-10 text-center space-y-4">
          <div className="p-4 bg-emerald-500/10 rounded-full">
            <Map className="h-10 w-10 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Quản lý Lô đất</h1>
            <p className="text-muted-foreground text-sm">
              Quản lý và cập nhật thông tin, trạng thái canh tác cho các lô đất được phân công. Đang trong quá trình hoàn thiện.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 flex gap-1 items-center hover:bg-emerald-100 border-none">
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
