import { ScanSearch, Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SupervisorAIAnalysisPage() {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-dashed border-2">
        <CardContent className="flex flex-col items-center pt-10 pb-10 text-center space-y-4">
          <div className="p-4 bg-purple-500/10 rounded-full">
            <ScanSearch className="h-10 w-10 text-purple-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Phân tích cây trồng AI</h1>
            <p className="text-muted-foreground text-sm">
              Sử dụng mô hình AI để nhận diện bệnh hại và tình trạng sức khỏe cây trồng qua hình ảnh. Chức năng đang được tích hợp.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 flex gap-1 items-center hover:bg-purple-100 border-none">
              <Construction className="h-3 w-3" />
              Coming Soon
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
