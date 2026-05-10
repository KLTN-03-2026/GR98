import { useParams, useNavigate } from 'react-router-dom';
import {
  useOrder,
  useConfirmPacking,
  useAssignShipper,
  useMarkDelivered,
  useAdminCancelOrder,
} from '@/client/api';
import { apiGet } from '@/client/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { formatPrice } from '@/client/data/mock-data';
import {
  PAYMENT_STATUS_LABELS,
  FULFILL_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type Order,
} from '@/client/types';
import { Input } from '@/components/ui/input';
import { XCircle } from 'lucide-react';
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
  MoreVertical,
  Phone,
  ImageIcon,
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
import { useState, useRef } from 'react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

// ─── Sub-Components ───────────────────────────────────────────────────────

type Shipper = {
  id: string;
  employeeCode: string;
  status: string;
  vehicleType?: string;
  user: { fullName: string; phone?: string | null };
};

const SHIPPER_STATUS_STYLES: Record<string, string> = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  BUSY: 'bg-amber-50 text-amber-700 border-amber-200',
  OFFLINE: 'bg-slate-100 text-slate-500 border-slate-200',
};

function OrderStateMachineActions({ order }: { order: Order }) {
  const confirmPacking = useConfirmPacking();
  const assignShipper = useAssignShipper();
  const markDelivered = useMarkDelivered();
  const adminCancel = useAdminCancelOrder();

  const { data: shippersData, isLoading: isLoadingShippers } = useQuery({
    queryKey: ['shippers', 'list-for-assign'],
    queryFn: async () => {
      const res = await apiGet<{ data: { data: Shipper[] } }>('/shippers', {
        params: { limit: 100 },
      });
      return (
        (res.data as unknown as { data?: { data?: Shipper[] } })?.data?.data ?? []
      );
    },
    enabled: order.fulfillStatus === 'PACKING',
  });

  const [selectedShipperId, setSelectedShipperId] = useState<string>('');
  const [cancelReason, setCancelReason] = useState('');

  const cancelDialog = (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-10 rounded-xl gap-2 text-rose-600 border-rose-200 bg-rose-50/40 hover:bg-rose-50 hover:text-rose-700"
        >
          <XCircle className="size-4" />
          Huỷ đơn
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Huỷ đơn hàng</DialogTitle>
          <DialogDescription>
            Đơn sẽ được huỷ và stock được hoàn lại kho.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Lý do huỷ (không bắt buộc)"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          className="rounded-xl"
        />
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={() =>
              adminCancel.mutate({
                orderId: order.id,
                reason: cancelReason || undefined,
              })
            }
            disabled={adminCancel.isPending}
            className="rounded-xl"
          >
            Xác nhận huỷ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  let title = '';
  let description = '';
  let icon: React.ReactNode = null;
  let iconBg = 'bg-primary/10 text-primary';
  let body: React.ReactNode = null;

  if (order.fulfillStatus === 'PENDING') {
    title = 'Xác nhận đơn hàng';
    description =
      'Kiểm tra tồn kho và chuyển đơn sang trạng thái đóng gói (PACKING).';
    icon = <Package className="size-5" />;
    iconBg = 'bg-amber-100 text-amber-700';
    body = (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => confirmPacking.mutate({ orderId: order.id })}
          disabled={confirmPacking.isPending}
          className="h-10 rounded-xl gap-2 px-5"
        >
          <Package className="size-4" />
          Xác nhận → PACKING
        </Button>
        {cancelDialog}
      </div>
    );
  } else if (order.fulfillStatus === 'PACKING') {
    title = 'Gán shipper giao hàng';
    description = 'Chọn shipper khả dụng để chuyển đơn sang đang giao (SHIPPED).';
    icon = <Truck className="size-5" />;
    iconBg = 'bg-blue-100 text-blue-700';

    const shippers = shippersData ?? [];
    body = (
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 space-y-1.5 min-w-0">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Shipper
            </Label>
            <Select
              value={selectedShipperId}
              onValueChange={setSelectedShipperId}
              disabled={isLoadingShippers || shippers.length === 0}
            >
              <SelectTrigger className="h-11 rounded-xl bg-white">
                <SelectValue
                  placeholder={
                    isLoadingShippers
                      ? 'Đang tải danh sách shipper...'
                      : shippers.length === 0
                      ? 'Chưa có shipper khả dụng'
                      : 'Chọn shipper...'
                  }
                />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-[320px]">
                {shippers.map((s) => {
                  const isAvailable = s.status === 'AVAILABLE';
                  return (
                    <SelectItem
                      key={s.id}
                      value={s.id}
                      className={cn('py-2.5', !isAvailable && 'opacity-50 pointer-events-none')}
                      disabled={!isAvailable}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold">
                          {s.user.fullName
                            .split(' ')
                            .slice(-1)[0]
                            ?.charAt(0)
                            .toUpperCase() || 'S'}
                        </div>
                        <div className="flex flex-col items-start gap-0.5 min-w-0">
                          <span className="text-sm font-medium leading-none truncate">
                            {s.user.fullName}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {s.employeeCode}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                'h-4 px-1.5 text-[9px] font-bold uppercase tracking-wider rounded-md',
                                SHIPPER_STATUS_STYLES[s.status] ?? '',
                              )}
                            >
                              {isAvailable ? 'Sẵn sàng' : s.status === 'BUSY' ? 'Đang giao' : s.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <Button
            disabled={!selectedShipperId || assignShipper.isPending}
            onClick={() =>
              assignShipper.mutate({
                orderId: order.id,
                shipperId: selectedShipperId,
              })
            }
            className="h-11 rounded-xl gap-2 px-5"
          >
            <Truck className="size-4" />
            Gán shipper → SHIPPED
          </Button>
        </div>
        {cancelDialog}
      </div>
    );
  } else if (order.fulfillStatus === 'SHIPPED') {
    title = 'Xác nhận giao thành công';
    description =
      'Đánh dấu đơn đã giao đến khách hàng. Stock sẽ được trừ, COD tự động đánh dấu đã thanh toán.';
    icon = <CheckCircle2 className="size-5" />;
    iconBg = 'bg-emerald-100 text-emerald-700';
    body = (
      <Button
        onClick={() => markDelivered.mutate({ orderId: order.id })}
        disabled={markDelivered.isPending}
        className="h-10 rounded-xl gap-2 px-5"
      >
        <CheckCircle2 className="size-4" />
        Đánh dấu đã giao → DELIVERED
      </Button>
    );
  } else {
    return null;
  }

  return (
    <Card className="border-border/50 shadow-xs overflow-hidden bg-gradient-to-br from-white to-slate-50/40">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div
            className={cn(
              'size-11 rounded-xl flex items-center justify-center shrink-0',
              iconBg,
            )}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
            {body}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────

export default function InventoryOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(id!);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || !order) return;
    setInvoiceOpen(false);

    // Clone to off-screen container for clean capture
    const clone = invoiceRef.current.cloneNode(true) as HTMLDivElement;
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '210mm';
    container.appendChild(clone);
    document.body.appendChild(container);

    await new Promise((r) => setTimeout(r, 300));

    try {
      const canvas = await html2canvas(clone, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`invoice-${order.orderNo}.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
      alert('Tải PDF thất bại. Vui lòng thử lại.');
    } finally {
      if (document.body.contains(container)) document.body.removeChild(container);
    }
  };

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
          <Button variant="outline" className="h-9 rounded-xl font-semibold text-xs gap-2 border-slate-200 shadow-xs" onClick={() => setInvoiceOpen(true)}>
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
          
          {/* Action Card - State Machine */}
          {order.fulfillStatus !== 'CANCELLED' && order.fulfillStatus !== 'DELIVERED' && (
            <OrderStateMachineActions order={order} />
          )}

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
        <div className="space-y-3">

          {/* Combined Info Card */}
          <Card className="border-border/50 shadow-xs overflow-hidden">
            <CardHeader className="pb-3 pt-4 px-4 border-b border-border/50 bg-slate-50/30">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Users className="size-3.5" /> Thông tin đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Customer */}
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Users className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{order.shippingAddr.fullName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="size-3" /> {order.shippingAddr.phone}
                  </p>
                </div>
              </div>

              {/* Address */}
              <div className="flex gap-2.5">
                <MapPinned className="size-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  {order.shippingAddr.addressLine}{order.shippingAddr.district ? `, ${order.shippingAddr.district}` : ''}, {order.shippingAddr.province}
                </p>
              </div>

              {order.note && (
                <div className="rounded-lg bg-amber-50/60 border border-amber-100/60 p-3">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <FileText className="size-3" /> Ghi chú
                  </p>
                  <p className="text-xs text-amber-900/80 italic leading-relaxed">
                    "{order.note}"
                  </p>
                </div>
              )}

              {/* Shipper Section */}
              {order.shipper && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 flex items-center gap-2">
                    <Truck className="size-3.5" /> Người giao hàng
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                      {order.shipper.user.avatar ? (
                        <img src={order.shipper.user.avatar} alt="" className="size-9 rounded-lg object-cover" />
                      ) : (
                        order.shipper.user.fullName.split(' ').slice(-1)[0]?.charAt(0).toUpperCase() || 'S'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{order.shipper.user.fullName}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{order.shipper.employeeCode}</span>
                        {order.shipper.vehicleType && (
                          <span className="text-[10px] text-muted-foreground">
                            {order.shipper.vehicleType === 'MOTORBIKE' ? 'Xe máy' : 'Ô tô'}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'h-5 px-1.5 text-[10px] font-bold uppercase tracking-wider rounded',
                        SHIPPER_STATUS_STYLES[order.shipper.status ?? ''] ?? 'bg-slate-100 text-slate-500 border-slate-200',
                      )}
                    >
                      {order.shipper.status ?? 'N/A'}
                    </Badge>
                  </div>
                  {order.shippedAt && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                      <Clock className="size-3 text-blue-400" />
                      Bắt đầu giao: {new Date(order.shippedAt).toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>
              )}

              {/* Delivery Proof Section */}
              {order.deliveryProofUrl && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                    <ImageIcon className="size-3.5" /> Chứng minh giao hàng
                  </p>
                  <a
                    href={order.deliveryProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-300 transition-colors"
                  >
                    <img
                      src={order.deliveryProofUrl}
                      alt="Chứng minh giao hàng"
                      className="w-full h-36 object-cover"
                    />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card className="border-border/50 shadow-xs overflow-hidden">
            <CardHeader className="pb-3 pt-4 px-4 border-b border-border/50">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <CreditCard className="size-3.5" /> Chi phí & Thanh toán
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2.5 pb-4">
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

      {/* Invoice Dialog */}
      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="max-w-[850px] max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-8 pt-6 pb-2">
            <DialogTitle>Hóa đơn bán hàng</DialogTitle>
            <DialogDescription>
              Mã đơn: {order?.orderNo}
            </DialogDescription>
          </DialogHeader>

          <div ref={invoiceRef} style={{ backgroundColor: '#ffffff', padding: '0 32px 24px', color: '#1e293b', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {/* Invoice Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1e293b', paddingBottom: '20px', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.025em' }}>HÓA ĐƠN BÁN HÀNG</h2>
                <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>Mã đơn: <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{order?.orderNo}</span></p>
                <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Ngày đặt: {order ? new Date(order.orderedAt).toLocaleString('vi-VN') : ''}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '9999px', border: '1px solid #e2e8f0', padding: '2px 10px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#475569', backgroundColor: '#f8fafc' }}>
                  {order?.fulfillStatus}
                </span>
              </div>
            </div>

            {/* Customer Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', fontSize: '14px', marginBottom: '24px' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '8px' }}>Người nhận</p>
                <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '16px', margin: 0 }}>{order?.shippingAddr.fullName}</p>
                <p style={{ color: '#475569', marginTop: '4px' }}>{order?.shippingAddr.phone}</p>
                <p style={{ color: '#64748b', marginTop: '8px', lineHeight: 1.6 }}>
                  {order?.shippingAddr.addressLine}<br />
                  {order?.shippingAddr.district ? `${order?.shippingAddr.district}, ` : ''}{order?.shippingAddr.province}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '8px' }}>Thông tin đơn</p>
                <p style={{ color: '#334155' }}><span style={{ color: '#64748b' }}>Thanh toán:</span> <span style={{ fontWeight: 600 }}>{order?.paymentMethod}</span></p>
                <p style={{ color: '#334155', marginTop: '4px' }}><span style={{ color: '#64748b' }}>Trạng thái:</span> <span style={{ fontWeight: 600 }}>{order?.paymentStatus}</span></p>
                {order?.trackingCode && <p style={{ fontFamily: 'monospace', color: '#334155', marginTop: '4px' }}>{order.trackingCode}</p>}
              </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '12px' }}>Danh sách sản phẩm</p>
              <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px 12px 0', fontWeight: 700, color: '#1e293b', width: '45%' }}>Sản phẩm</th>
                    <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 700, color: '#1e293b', width: '20%' }}>Đơn giá</th>
                    <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 700, color: '#1e293b', width: '15%' }}>SL</th>
                    <th style={{ textAlign: 'right', padding: '12px 0 12px 8px', fontWeight: 700, color: '#1e293b', width: '20%' }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {order?.orderItems.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                      <td style={{ padding: '14px 8px 14px 0', color: '#1e293b', fontWeight: 500 }}>{item.nameSnapshot}</td>
                      <td style={{ padding: '14px 8px', textAlign: 'right', color: '#475569' }}>{formatPrice(item.priceSnapshot)}</td>
                      <td style={{ padding: '14px 8px', textAlign: 'right', color: '#475569' }}>{item.quantityKg} kg</td>
                      <td style={{ padding: '14px 0 14px 8px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{formatPrice(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ fontSize: '14px', borderTop: '2px solid #f1f5f9', paddingTop: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#64748b' }}>Tạm tính</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>{formatPrice(order?.subtotal ?? 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#64748b' }}>Phí vận chuyển</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>{order?.shippingFee === 0 ? 'Miễn phí' : formatPrice(order?.shippingFee ?? 0)}</span>
              </div>
              {(order?.discount ?? 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#059669' }}>
                  <span>Giảm giá</span>
                  <span style={{ fontWeight: 700 }}>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 800, color: '#0f172a', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                <span>TỔNG CỘNG</span>
                <span>{formatPrice(order?.total ?? 0)}</span>
              </div>
            </div>

            {/* Notes */}
            {order?.note && (
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '16px', fontSize: '14px', marginBottom: '24px' }}>
                <p style={{ fontWeight: 700, color: '#92400e', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ghi chú</p>
                <p style={{ color: '#78350f', fontStyle: 'italic', margin: 0 }}>{order.note}</p>
              </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', paddingTop: '24px', borderTop: '1px dashed #cbd5e1' }}>
              <p style={{ margin: 0 }}>Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ!</p>
            </div>
          </div>

          <DialogFooter className="px-8 pb-6 pt-2 gap-2 border-t">
            <Button variant="outline" onClick={() => setInvoiceOpen(false)}>Đóng</Button>
            <Button onClick={handleDownloadPdf} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <FileText className="size-4" /> Tải PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
