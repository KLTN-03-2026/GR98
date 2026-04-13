import { Truck, Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function InventoryLogisticsPage() {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-dashed border-2">
        <CardContent className="flex flex-col items-center pt-10 pb-10 text-center space-y-4">
          <div className="p-4 bg-slate-500/10 rounded-full">
            <Truck className="h-10 w-10 text-slate-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Quản lý Logistics</h1>
            <p className="text-muted-foreground text-sm">
              Trang quản lý vận chuyển nội bộ và điều phối đội xe giao hàng từ kho đến các điểm nhận hàng của khách.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="secondary" className="bg-slate-100 text-slate-700 flex gap-1 items-center hover:bg-slate-100 border-none">
              <Construction className="h-3 w-3" />
              Coming Soon
            </Badge>
            <Badge variant="outline">Sprint 4</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
