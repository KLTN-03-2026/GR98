import { useParams, useNavigate } from 'react-router-dom';
import { useOrder, useUpdateOrder } from '@/client/api';
import { formatPrice } from '@/client/data/mock-data';
import {
  PAYMENT_STATUS_LABELS,
  FULFILL_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/client/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Users, 
  MapPinned, 
  Truck, 
  Package, 
  CheckCircle2,
  Calendar,
  CreditCard,
  FileText,
  Clock,
  Banknote,
  Hash,
  RefreshCw,
  MoreVertical,
  Phone
} from 'lucide-react';
import { cn, getImageUrl } from '@/lib/utils';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useState } from 'react';

// ─── Sub-Components ───────────────────────────────────────────────────────

function UpdateOrderDialog({ 
  orderId, 
  currentStatus, 
  onSuccess 
}: { 
  orderId: string; 
  currentStatus: string; 
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const { mutate: updateOrder, isPending } = useUpdateOrder();

  const handleUpdate = () => {
    updateOrder(
      { orderId, data: { fulfillStatus: status as any } },
      {
        onSuccess: () => {
          setOpen(false);
          onSuccess();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 rounded-xl border-slate-200 font-semibold gap-2">
          <RefreshCw className="size-3.5" />
          Cập nhật trạng thái
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl font-manrope">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Cập nhật đơn hàng</DialogTitle>
          <DialogDescription className="text-sm">
            Thay đổi trạng thái xử lý cho đơn hàng này.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Trạng thái vận hành</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="rounded-xl h-11 border-slate-200">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {Object.entries(FULFILL_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="rounded-lg">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="rounded-xl h-10"
          >
            Hủy
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isPending || status === currentStatus}
            className="rounded-xl px-8 h-10 shadow-sm"
          >
            {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────

export default function InventoryOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading, refetch } = useOrder(id!);

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto font-manrope">
        <div className="flex items-center gap-4">
          <Skeleton className="size-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-lg" />
            <Skeleton className="h-4 w-48 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-[500px] w-full rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 font-manrope text-center px-4">
        <div className="size-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
           <Package className="size-10" />
        </div>
        <div>
            <h2 className="text-xl font-semibold text-slate-900">Không tìm thấy đơn hàng</h2>
            <p className="text-slate-500 text-sm italic mt-1">Mã đơn hàng không hợp lệ hoặc đã bị xóa khỏi hệ thống.</p>
        </div>
        <Button onClick={() => navigate('/inventory/orders')} variant="outline" className="rounded-xl mt-4">
          <ArrowLeft className="size-4 mr-2" /> Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto font-manrope animate-in fade-in duration-500 pb-20">
      {/* Header Section - Admin Style */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between border-b border-border/40 pb-6">
        <div className="flex items-start gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/inventory/orders')}
            className="size-9 rounded-lg border-none shrink-0 hover:bg-slate-100"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/8 text-primary shadow-sm">
                <ShoppingCart className="size-4" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Đơn hàng <span className="font-mono text-primary ml-0.5">#{order.orderNo}</span>
              </h1>
              <Badge variant="secondary" className="font-bold uppercase text-[10px] tracking-widest px-2.5 py-0.5 rounded-lg border-transparent shadow-none bg-slate-100 text-slate-600">
                {FULFILL_STATUS_LABELS[order.fulfillStatus]}
              </Badge>
              <Badge variant="outline" className="font-bold uppercase text-[10px] tracking-widest px-2.5 py-0.5 rounded-lg border-emerald-200 bg-emerald-50/50 text-emerald-700 shadow-none">
                {PAYMENT_STATUS_LABELS[order.paymentStatus]}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-medium text-muted-foreground ml-0.5">
              <span className="flex items-center gap-2">
                <Calendar className="size-3.5" />
                {new Date(order.orderedAt).toLocaleString('vi-VN')}
              </span>
              {order.orderCode && (
                <span className="flex items-center gap-2 text-primary/80 font-mono">
                  <Hash className="size-3.5" />
                  REF: {order.orderCode}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 lg:ml-14">
          {order.fulfillStatus !== 'CANCELLED' && order.fulfillStatus !== 'DELIVERED' && (
            <UpdateOrderDialog orderId={order.id} currentStatus={order.fulfillStatus} onSuccess={refetch} />
          )}
          <Button variant="outline" className="h-9 rounded-xl font-semibold text-xs gap-2 border-slate-200 shadow-xs">
            <FileText className="size-4" /> Hóa đơn
          </Button>
          <Button variant="outline" size="icon" className="size-9 rounded-xl border-slate-200 shadow-xs">
            <MoreVertical className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Status Progress - Clean Admin Style */}
          <Card className="border-border/50 shadow-none bg-slate-50/30 overflow-hidden">
            <CardContent className="p-8">
                <div className="flex items-center justify-between relative max-w-2xl mx-auto">
                    <div className="absolute left-0 top-5 w-full h-[2px] bg-slate-200 -translate-y-1/2 z-0" />
                    {['PENDING', 'PACKING', 'SHIPPED', 'DELIVERED'].map((s, idx) => {
                    const statuses = ['PENDING', 'PACKING', 'SHIPPED', 'DELIVERED'];
                    const currentIdx = statuses.indexOf(order.fulfillStatus);
                    const isDone = idx <= currentIdx && order.fulfillStatus !== 'CANCELLED';
                    const isCurrent = idx === currentIdx;

                    return (
                        <div key={s} className="relative z-10 flex flex-col items-center gap-4">
                        <div className={cn(
                            "size-10 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                            isDone ? "bg-primary border-primary text-white shadow-md shadow-primary/20" : "bg-white border-slate-200 text-slate-300",
                            isCurrent && "ring-4 ring-primary/10"
                        )}>
                            {isDone ? <CheckCircle2 className="size-5" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                        </div>
                        <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest",
                            isDone ? "text-primary" : "text-slate-400"
                        )}>
                            {FULFILL_STATUS_LABELS[s as keyof typeof FULFILL_STATUS_LABELS]}
                        </span>
                        </div>
                    )
                    })}
                </div>
            </CardContent>
          </Card>

          {/* Product Items List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                    <div className="h-5 w-1.5 bg-primary rounded-full shadow-sm shadow-primary/20" />
                    <h4 className="text-sm font-bold uppercase tracking-widest text-slate-900">Danh sách sản phẩm ({order.orderItems.length})</h4>
                </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {order.orderItems.map((item) => {
                const img = getImageUrl(item);
                return (
                  <Card key={item.id} className="group overflow-hidden border-border/50 hover:border-primary/20 transition-all duration-300 shadow-xs">
                    <CardContent className="p-0 flex flex-col sm:flex-row">
                        <div className="w-full sm:w-32 h-32 bg-slate-50 shrink-0 border-r border-border/30 overflow-hidden">
                            {img ? (
                                <img src={img} alt={item.nameSnapshot} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50/50">
                                    <Package className="size-8 opacity-50" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 p-5 flex flex-col justify-between">
                            <div className="space-y-2.5">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1">
                                        <h3 className="text-base font-semibold text-slate-900 leading-tight">
                                            {item.nameSnapshot}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[10px] font-bold font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200/50">SKU: {item.product?.sku || 'N/A'}</span>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{item.product?.category || 'Sản phẩm'}</span>
                                        </div>
                                    </div>
                                    {item.product?.qualityGrade && (
                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black rounded-md shadow-none uppercase text-[9px] tracking-widest h-5 px-2">
                                            Hạng {item.product.qualityGrade}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-50">
                                <div className="flex items-center gap-6">
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Đơn giá</p>
                                        <p className="text-xs font-semibold text-slate-700 tabular-nums">
                                            {formatPrice(item.priceSnapshot)}/kg
                                        </p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Số lượng</p>
                                        <p className="text-xs font-bold text-primary tabular-nums">
                                            {item.quantityKg} kg
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Thành tiền</p>
                                    <p className="text-sm font-bold text-slate-900 tabular-nums tracking-tight">
                                        {formatPrice(item.subtotal)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          
          {/* Customer & Shipping - Simplified Admin Style */}
          <Card className="border-border/50 shadow-xs overflow-hidden">
            <CardHeader className="pb-4 pt-5 px-5 border-b border-border/50 bg-slate-50/30">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Users className="size-3.5" /> Thông tin nhận hàng
                </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center gap-3.5">
                <div className="size-11 rounded-xl bg-primary/8 flex items-center justify-center text-primary shadow-sm">
                  <Users className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 leading-none">{order.shippingAddr.fullName}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1.5 flex items-center gap-1.5">
                    <Phone className="size-3 text-primary/60" /> {order.shippingAddr.phone}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <div className="flex gap-3">
                  <MapPinned className="size-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Địa chỉ giao nhận</p>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {order.shippingAddr.addressLine}{order.shippingAddr.district ? `, ${order.shippingAddr.district}` : ''}, {order.shippingAddr.province}
                    </p>
                  </div>
                </div>
              </div>

              {order.note && (
                <div className="rounded-xl bg-amber-50/50 border border-amber-100/50 p-4">
                  <p className="text-[9px] font-bold text-amber-700 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <FileText className="size-3" /> Ghi chú
                  </p>
                  <p className="text-xs text-amber-900/80 italic font-medium leading-relaxed">
                    "{order.note}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Details - Modern Analytics Style */}
          <Card className="border-border/50 shadow-xs overflow-hidden">
            <CardHeader className="pb-4 pt-5 px-5 border-b border-border/50">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <CreditCard className="size-3.5" /> Chi phí & Thanh toán
                </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3 pb-5">
                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                  <span>Tạm tính</span>
                  <span className="tabular-nums font-semibold text-slate-700">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                  <span>Phí vận chuyển</span>
                  <span className="tabular-nums font-semibold text-slate-700">
                    {order.shippingFee === 0 ? (
                      <span className="text-emerald-600 font-bold uppercase text-[9px] tracking-wider">Miễn phí</span>
                    ) : formatPrice(order.shippingFee)}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-xs font-medium text-emerald-600">
                    <span>Khuyến mãi</span>
                    <span className="tabular-nums font-bold">-{formatPrice(order.discount)}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Tổng cộng</span>
                <p className="text-2xl font-bold text-primary tabular-nums tracking-tighter">
                    {formatPrice(order.total)}
                </p>
              </div>

              <div className="mt-6 space-y-2.5 pt-5 border-t border-slate-100">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                        <Banknote className="size-4 text-slate-400" />
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Phương thức</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
                  </div>
                  
                  {order.paidAt && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <Clock className="size-4 text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest">Thanh toán</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-700">{new Date(order.paidAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
          
          {/* Tracking Status - Primary Accent */}
          {order.trackingCode && (
            <Card className="border-primary/20 bg-primary shadow-lg shadow-primary/10 overflow-hidden relative group">
               <div className="absolute top-0 right-0 -mt-8 -mr-8 size-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
               <CardContent className="p-5 text-white relative z-10">
                    <div className="flex items-center gap-2.5 mb-4">
                        <Truck className="size-4" />
                        <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-90">Vận đơn vận chuyển</h4>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Mã tracking</p>
                            <p className="font-mono text-lg font-bold tracking-tight">{order.trackingCode}</p>
                        </div>
                        <Button className="w-full h-9 rounded-lg bg-white text-primary font-bold hover:bg-white/95 border-none text-xs shadow-sm shadow-black/10">
                            Tra cứu hành trình
                        </Button>
                    </div>
               </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
