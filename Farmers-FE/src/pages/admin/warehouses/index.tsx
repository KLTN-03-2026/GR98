import { LayoutGrid, Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminWarehousesPage() {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-dashed border-2">
        <CardContent className="flex flex-col items-center pt-10 pb-10 text-center space-y-4">
          <div className="p-4 bg-purple-500/10 rounded-full">
            <LayoutGrid className="h-10 w-10 text-purple-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Giám sát Kho hàng</h1>
            <p className="text-muted-foreground text-sm">
              Hệ thống giám sát tồn kho và điều phối hàng hóa giữa các kho tập kết. Tính năng đang được thiết lập kiến trúc.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 flex gap-1 items-center hover:bg-purple-100 border-none">
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
