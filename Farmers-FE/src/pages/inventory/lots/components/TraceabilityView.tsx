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
  Calendar,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Settings2,
  Navigation,
  Box,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

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
    status = 'done',
  }: {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    isLast?: boolean;
    status?: 'done' | 'pending' | 'warning';
  }) => (
    <div className="relative flex gap-4 pb-6">
      {!isLast && (
        <div className="absolute left-[15px] top-8 h-full w-px bg-slate-200" />
      )}
      <div className={cn(
        "z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 shadow-sm transition-colors",
        status === 'done' ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400"
      )}>
        <Icon className="size-3.5" />
      </div>
      <div className="flex-1 space-y-2">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg overflow-y-auto font-manrope flex flex-col">
        <SheetHeader className="pb-6 border-b">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Layers className="size-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Traceability</span>
          </div>
          <SheetTitle className="text-2xl font-semibold">Truy xuất nguồn gốc</SheetTitle>
          <SheetDescription>
            Thông tin chi tiết về chuỗi cung ứng và nhật ký biến động của lô hàng.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 py-6">
          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : trace ? (
            <div className="space-y-2">
              {/* Step 1: Source */}
              <Step title="Nguồn gốc thu hoạch" icon={User}>
                {trace.contract ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="size-5 text-slate-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{trace.contract.farmer.fullName}</div>
                        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Mã NS: {trace.contract.farmer.id.slice(-6)}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-slate-50 rounded-lg border flex flex-col">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Lô đất</span>
                        <span className="text-xs font-semibold">{trace.contract.plot.plotCode}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border flex flex-col">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Khu vực</span>
                        <span className="text-xs font-semibold">{trace.contract.plot.zone.name}</span>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="w-full text-[10px] font-bold uppercase tracking-wider gap-2">
                      <Navigation className="size-3" /> Định vị vườn
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4 text-center">
                    <Info className="size-8 text-slate-200 mb-2" />
                    <p className="text-xs text-muted-foreground font-medium italic">Không có dữ liệu hợp đồng nguồn</p>
                  </div>
                )}
              </Step>

              {/* Step 2: Quality & Contract */}
              <Step title="Thu hoạch & Chất lượng" icon={FileText}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      <span className="text-xs font-medium">Ngày thu hoạch:</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {trace.harvestDate ? format(new Date(trace.harvestDate), 'dd/MM/yyyy') : '—'}
                    </span>
                  </div>
                  
                  <Separator className="opacity-50" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings2 className="size-4 text-muted-foreground" />
                      <span className="text-xs font-medium">Phẩm cấp:</span>
                    </div>
                    <Badge variant="outline" className={cn(
                      "rounded px-2 py-0.5 text-[10px] font-bold border-none",
                      trace.qualityGrade === 'A' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    )}>
                      HẠNG {trace.qualityGrade}
                    </Badge>
                  </div>

                  {trace.contract && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-lg border flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">Hợp đồng bao tiêu</span>
                        <span className="text-xs font-semibold">{trace.contract.contractNo}</span>
                      </div>
                      <Badge variant="success" className="text-[9px] font-bold">SIGNED</Badge>
                    </div>
                  )}
                </div>
              </Step>

              {/* Step 3: Logistics Timeline */}
              <Step title="Nhật ký biến động lô" icon={History}>
                <div className="space-y-4">
                  {trace.transactions && trace.transactions.length > 0 ? (
                    <div className="space-y-4">
                      {trace.transactions.map((tx) => (
                        <div key={tx.id} className="flex items-start gap-3">
                          <div className={cn(
                            "mt-1 size-5 rounded flex items-center justify-center shrink-0",
                            tx.type === 'inbound' ? "bg-emerald-50 text-emerald-600" : 
                            tx.type === 'outbound' ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                          )}>
                            {tx.type === 'inbound' ? <ArrowDownLeft className="size-3" /> : 
                             tx.type === 'outbound' ? <ArrowUpRight className="size-3" /> : <Settings2 className="size-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold truncate capitalize">{tx.type === 'inbound' ? 'Nhập kho' : tx.type === 'outbound' ? 'Xuất kho' : 'Điều chỉnh'}</span>
                              <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">{format(new Date(tx.createdAt), 'HH:mm - dd/MM')}</span>
                            </div>
                            <div className="text-xs font-semibold text-slate-600 mt-0.5">
                              {tx.quantityKg > 0 ? '+' : ''}{tx.quantityKg} kg
                            </div>
                            {tx.note && <p className="text-[10px] text-muted-foreground italic truncate mt-0.5">{tx.note}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-2 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Không có lịch sử</div>
                  )}

                  <Separator className="opacity-50" />

                  <div className="flex items-center justify-between bg-primary p-4 rounded-xl text-primary-foreground">
                    <div>
                      <div className="text-[10px] font-bold uppercase opacity-70">Tồn kho hiện tại</div>
                      <div className="text-xl font-bold">{trace.quantityKg.toLocaleString()} <span className="text-xs opacity-70">kg</span></div>
                    </div>
                    <Warehouse className="size-6 opacity-30" />
                  </div>
                </div>
              </Step>

              {/* Step 4: Product Info */}
              <Step title="Thông tin sản phẩm" icon={Layers} isLast>
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-lg bg-slate-100 flex items-center justify-center border shrink-0">
                    <Box className="size-6 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-900 text-sm truncate leading-tight">{trace.product.name}</h4>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">SKU: {trace.product.sku}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <div className="size-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">Sẵn sàng xuất kho</span>
                    </div>
                  </div>
                </div>
              </Step>
            </div>
          ) : (
            <div className="py-20 text-center opacity-40">
              <Info className="size-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Không tìm thấy dữ liệu</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
