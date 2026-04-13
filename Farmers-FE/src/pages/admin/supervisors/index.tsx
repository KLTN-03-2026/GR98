import { Users, Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminSupervisorsPage() {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-dashed border-2">
        <CardContent className="flex flex-col items-center pt-10 pb-10 text-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-full">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Quản lý Giám sát viên</h1>
            <p className="text-muted-foreground text-sm">
              Tính năng đang được phát triển. Trang này sẽ cho phép Quản trị viên quản lý danh sách và phân vùng hoạt động cho các Giám sát viên thực địa.
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
