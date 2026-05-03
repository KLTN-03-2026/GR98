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
  Hash
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
        <Button className="rounded-2xl font-black bg-emerald-600 hover:bg-emerald-700 text-xs px-6 text-white shadow-lg shadow-emerald-500/20">
          Cập nhật trạng thái
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[32px] font-manrope border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900">Cập nhật đơn hàng</DialogTitle>
          <DialogDescription className="font-medium text-slate-500">
            Thay đổi trạng thái xử lý cho đơn hàng này.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status" className="text-xs font-black uppercase tracking-widest text-slate-400">Trạng thái xử lý</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="rounded-2xl border-slate-100 h-12 font-bold">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl font-bold">
                {Object.entries(FULFILL_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="rounded-xl">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="rounded-2xl font-bold"
          >
            Hủy
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isPending || status === currentStatus}
            className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black px-8 text-white"
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
      <div className="p-8 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Package className="size-16 text-slate-200" />
        <p className="text-slate-500 font-medium">Không tìm thấy đơn hàng</p>
        <Button onClick={() => navigate('/inventory/orders')} variant="outline">
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto font-manrope animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/inventory/orders')}
            className="rounded-full hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="size-5 text-slate-600" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Đơn hàng <span className="text-emerald-600 font-mono">#{order.orderNo}</span>
            </h1>
            <div className="flex items-center gap-4">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="size-3" />
                {new Date(order.orderedAt).toLocaleString('vi-VN')}
              </p>
              {order.orderCode && (
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2 bg-blue-50 px-2 py-0.5 rounded-full">
                  <Hash className="size-3" />
                  Ref: {order.orderCode}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {order.fulfillStatus !== 'CANCELLED' && order.fulfillStatus !== 'DELIVERED' && (
            <UpdateOrderDialog orderId={order.id} currentStatus={order.fulfillStatus} onSuccess={refetch} />
          )}
          <Button variant="outline" className="rounded-2xl font-bold text-xs gap-2 border-slate-200">
            <FileText className="size-4" /> Xuất hóa đơn
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Status Quick Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
             <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Clock className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Giao hàng</p>
                  <p className="text-xs font-black text-slate-900">{FULFILL_STATUS_LABELS[order.fulfillStatus]}</p>
                </div>
             </div>
             <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Banknote className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thanh toán</p>
                  <p className="text-xs font-black text-slate-900">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</p>
                </div>
             </div>
             <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm flex items-center gap-3 hidden sm:flex">
                <div className="size-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hình thức</p>
                  <p className="text-xs font-black text-slate-900">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
                </div>
             </div>
          </div>

          {/* Progress Timeline */}
          <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
             <div className="flex items-center justify-between relative mb-2">
                <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-50 -translate-y-1/2 z-0" />
                {['PENDING', 'PACKING', 'SHIPPED', 'DELIVERED'].map((s, idx) => {
                  const statuses = ['PENDING', 'PACKING', 'SHIPPED', 'DELIVERED'];
                  const currentIdx = statuses.indexOf(order.fulfillStatus);
                  const isDone = idx <= currentIdx && order.fulfillStatus !== 'CANCELLED';
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={s} className="relative z-10 flex flex-col items-center gap-3">
                      <div className={cn(
                        "size-10 rounded-full border-4 flex items-center justify-center transition-all duration-700",
                        isDone ? "bg-emerald-500 border-emerald-100 text-white" : "bg-white border-slate-50 text-slate-200",
                        isCurrent && "ring-8 ring-emerald-500/10 scale-125"
                      )}>
                        {isDone ? <CheckCircle2 className="size-5" /> : <div className="size-2 rounded-full bg-current" />}
                      </div>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-wider",
                        isDone ? "text-emerald-600" : "text-slate-400"
                      )}>
                        {FULFILL_STATUS_LABELS[s as keyof typeof FULFILL_STATUS_LABELS]}
                      </span>
                    </div>
                  )
                })}
              </div>
          </div>

          {/* Items List */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1.5 bg-emerald-500 rounded-full" />
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Danh sách sản phẩm ({order.orderItems.length})</h4>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {order.orderItems.map((item) => {
                const img = getImageUrl(item);
                return (
                  <div key={item.id} className="group relative flex flex-col sm:flex-row gap-6 p-6 rounded-[32px] border border-slate-100 bg-white hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500">
                    <div className="size-32 rounded-3xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
                      {img ? (
                        <img src={img} alt={item.nameSnapshot} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Package className="size-12" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="space-y-2">
                        <div className="flex flex-wrap justify-between items-start gap-2">
                          <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                            {item.nameSnapshot}
                          </h3>
                          {item.product?.qualityGrade && (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black rounded-xl shadow-none">
                              Hạng {item.product.qualityGrade}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          {item.product?.sku && (
                            <span className="text-xs font-bold text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">SKU: {item.product.sku}</span>
                          )}
                          {item.product?.category && (
                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                              <div className="size-1 rounded-full bg-emerald-400" />
                              {item.product.category}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đơn giá & Số lượng</p>
                          <p className="text-sm font-bold text-slate-700 tabular-nums">
                            {formatPrice(item.priceSnapshot)} / kg <span className="mx-2 text-slate-200">|</span> <span className="text-emerald-600">{item.quantityKg} kg</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thành tiền</p>
                          <p className="text-xl font-black text-slate-900 tabular-nums">
                            {formatPrice(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Customer Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1.5 bg-emerald-500 rounded-full" />
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Khách hàng</h4>
            </div>
            <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Users className="size-7" />
                </div>
                <div>
                  <p className="font-black text-slate-900 leading-tight">{order.shippingAddr.fullName}</p>
                  <p className="text-sm text-slate-500 font-bold">{order.shippingAddr.phone}</p>
                  {order.client?.user?.email && (
                    <p className="text-xs text-emerald-600 font-bold mt-1">{order.client.user.email}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-slate-50">
                <div className="flex gap-3">
                  <MapPinned className="size-5 text-slate-400 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Địa chỉ giao hàng</p>
                    <p className="text-xs text-slate-600 leading-relaxed font-bold">
                      {order.shippingAddr.addressLine}{order.shippingAddr.district ? `, ${order.shippingAddr.district}` : ''}, {order.shippingAddr.province}
                    </p>
                  </div>
                </div>
              </div>

              {order.note && (
                <div className="rounded-[24px] bg-amber-50/50 border border-amber-100 p-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 size-12 bg-amber-200/20 rounded-full blur-xl" />
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <FileText className="size-3" /> Ghi chú đơn hàng
                  </p>
                  <p className="text-sm text-amber-900 italic font-medium leading-relaxed relative z-10">
                    "{order.note}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1.5 bg-emerald-500 rounded-full" />
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Chi tiết thanh toán</h4>
            </div>
            <div className="relative rounded-[40px] border border-slate-900 bg-slate-900 p-8 text-white shadow-2xl shadow-slate-900/20 overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 size-40 rounded-full bg-emerald-500/20 blur-3xl" />
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10 size-40 rounded-full bg-blue-500/10 blur-3xl" />
              
              <div className="space-y-5 relative z-10">
                <div className="flex justify-between text-sm font-bold text-slate-400">
                  <span>Tạm tính</span>
                  <span className="tabular-nums text-slate-200">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-400">
                  <span>Phí vận chuyển</span>
                  <span className="tabular-nums text-slate-200">
                    {order.shippingFee === 0 ? (
                      <span className="text-emerald-400 uppercase text-[10px] tracking-widest">Miễn phí</span>
                    ) : formatPrice(order.shippingFee)}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm font-bold text-emerald-400">
                    <span>Khuyến mãi</span>
                    <span className="tabular-nums">-{formatPrice(order.discount)}</span>
                  </div>
                )}
                
                <div className="my-6 border-t border-slate-800 border-dashed" />
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Tổng thanh toán</p>
                    <Badge className="bg-white/10 hover:bg-white/20 text-white border-none rounded-xl font-bold text-[10px] shadow-none px-3 py-1">
                      {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                    </Badge>
                  </div>
                  <p className="text-4xl font-black tabular-nums tracking-tighter">
                    {formatPrice(order.total)}
                  </p>
                </div>

                <div className="pt-6 space-y-3">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="size-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <CreditCard className="size-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-500">Phương thức</p>
                      <p className="text-sm font-bold text-slate-200">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
                    </div>
                  </div>
                  {order.paidAt && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <div className="size-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <Clock className="size-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-500">Đã thanh toán lúc</p>
                        <p className="text-sm font-bold text-slate-200">{new Date(order.paidAt).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Shipping Info if Shipped */}
          {order.trackingCode && (
            <div className="rounded-[32px] bg-emerald-600 p-6 text-white shadow-xl shadow-emerald-600/20 overflow-hidden relative group">
               <div className="absolute top-0 right-0 -mt-8 -mr-8 size-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
               <div className="flex items-center gap-3 mb-4">
                <Truck className="size-6" />
                <h4 className="text-sm font-black uppercase tracking-widest">Thông tin vận chuyển</h4>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Mã vận đơn</p>
                  <p className="font-mono text-lg font-bold">{order.trackingCode}</p>
                </div>
                <div className="pt-2">
                  <Button className="w-full rounded-2xl bg-white text-emerald-600 font-black hover:bg-emerald-50 border-none shadow-lg shadow-black/10">
                    Theo dõi hành trình
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
