import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetLotTrace } from '../api';
import {
  MapPin,
  User,
  FileText,
  Layers,
  Warehouse,
  Info,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface TraceabilityViewProps {
  lotId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TraceabilityView({ lotId, isOpen, onClose }: TraceabilityViewProps) {
  const { data: trace, isLoading } = useGetLotTrace(lotId || '');

  const Step = ({
    title,
    icon: Icon,
    children,
    isLast = false,
  }: {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    isLast?: boolean;
  }) => (
    <div className="relative flex gap-4 pb-8">
      {!isLast && (
        <div className="absolute left-[15px] top-8 h-full w-px bg-primary/20" />
      )}
      <div className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-background shadow-sm">
        <Icon className="size-4 text-primary" />
      </div>
      <div className="flex-1 space-y-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary/80">
          {title}
        </h3>
        <div className="rounded-2xl border border-primary/5 bg-primary/5 p-4 backdrop-blur-sm">
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center gap-2">
            <Layers className="size-5 text-primary" />
            Truy xuất nguồn gốc
          </SheetTitle>
          <SheetDescription>
            Bản ghi chuỗi cung ứng của lô hàng từ thu hoạch đến kho.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : trace ? (
          <div className="space-y-2 py-4">
            {/* Step 1: Farmer */}
            <Step title="Nguồn gốc (Nông dân)" icon={User}>
              {trace.contract ? (
                <div className="space-y-1">
                  <div className="font-bold text-foreground font-manrope">
                    {trace.contract.farmer.fullName}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <MapPin className="size-3" />
                    {trace.contract.plot.plotCode} — {trace.contract.plot.zone.name}
                  </div>
                  <div className="pt-1">
                    <Badge variant="outline" className="text-[10px] bg-background">
                      {trace.contract.plot.cropType}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic">
                  Không có dữ liệu hợp đồng nguồn (Nhập kho thủ công)
                </div>
              )}
            </Step>

            {/* Step 2: Harvest */}
            <Step title="Thu hoạch & Hợp đồng" icon={FileText}>
              <div className="space-y-2">
                {trace.contract && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Mã hợp đồng:</span>
                    <span className="text-xs font-bold font-mono">{trace.contract.contractNo}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Ngày thu hoạch:</span>
                  <span className="text-xs font-bold">
                    {trace.harvestDate
                      ? format(new Date(trace.harvestDate), 'dd/MM/yyyy', { locale: vi })
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Chất lượng:</span>
                  <Badge variant="outline" className="text-[10px]">
                    Hạng {trace.qualityGrade}
                  </Badge>
                </div>
              </div>
            </Step>

            {/* Step 3: Warehouse */}
            <Step title="Lưu kho" icon={Warehouse}>
              <div className="space-y-2">
                <div className="font-bold text-sm">{trace.warehouse.name}</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Số lượng nhập:</span>
                  <span className="text-sm font-bold text-primary">
                    {trace.quantityKg.toLocaleString()} {trace.product.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Ngày nhập:</span>
                  <span className="text-xs font-medium">
                    {format(new Date(trace.createdAt), 'HH:mm — dd/MM/yyyy', { locale: vi })}
                  </span>
                </div>
              </div>
            </Step>

            {/* Step 4: Final Product */}
            <Step title="Hiện trạng" icon={Info} isLast>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-background border border-primary/10">
                    <Layers className="size-5 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">{trace.product.name}</span>
                    <span className="text-[10px] text-muted-foreground">ID: {trace.id}</span>
                  </div>
                </div>
                <div className="p-3 bg-background rounded-xl border border-primary/10 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Tồn kho còn lại</span>
                    <span className="text-lg font-bold text-primary">{trace.quantityKg.toLocaleString()} kg</span>
                  </div>
                  <Button size="icon" variant="ghost" className="rounded-full">
                    <ExternalLink className="size-4" />
                  </Button>
                </div>
              </div>
            </Step>
          </div>
        ) : (
          <div className="py-20 text-center opacity-40">
            <Info className="size-10 mx-auto mb-2" />
            <p className="text-sm">Không tìm thấy dữ liệu</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
