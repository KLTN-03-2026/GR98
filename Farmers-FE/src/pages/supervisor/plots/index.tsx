import { Sprout, Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SupervisorPlotsPage() {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-dashed border-2">
        <CardContent className="flex flex-col items-center pt-10 pb-10 text-center space-y-4">
          <div className="p-4 bg-lime-500/10 rounded-full">
            <Sprout className="h-10 w-10 text-lime-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Lô đất phụ trách</h1>
            <p className="text-muted-foreground text-sm">
              Xem và cập nhật tình trạng canh tác của các lô đất được phân công. Giao diện bản đồ và danh sách chi tiết đang được phát triển.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="secondary" className="bg-lime-100 text-lime-700 flex gap-1 items-center hover:bg-lime-100 border-none">
              <Construction className="h-3 w-3" />
              Coming Soon
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
