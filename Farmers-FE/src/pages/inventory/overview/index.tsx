import { LayoutDashboard, Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function InventoryOverviewPage() {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-dashed border-2">
        <CardContent className="flex flex-col items-center pt-10 pb-10 text-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-full">
            <LayoutDashboard className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Tổng quan Kho hàng</h1>
            <p className="text-muted-foreground text-sm">
              Trang tổng quan dành cho Nhân viên kho. Hiển thị các chỉ số xuất nhập tồn, đơn hàng thương mại điện tử cần xử lý.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="secondary" className="flex gap-1 items-center">
              <Construction className="h-3 w-3" />
              Coming Soon
            </Badge>
            <Badge variant="outline">Sprint 2</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
