import { PieChart, Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function InventorySupplyDemandPage() {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-dashed border-2">
        <CardContent className="flex flex-col items-center pt-10 pb-10 text-center space-y-4">
          <div className="p-4 bg-cyan-500/10 rounded-full">
            <PieChart className="h-10 w-10 text-cyan-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Quản lý Cung cầu</h1>
            <p className="text-muted-foreground text-sm">
              Trang phân tích cung cầu nông sản dựa trên số lượng hàng có sẵn trong kho và các đơn đặt hàng chưa được xử lý.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="secondary" className="bg-cyan-100 text-cyan-700 flex gap-1 items-center hover:bg-cyan-100 border-none">
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
