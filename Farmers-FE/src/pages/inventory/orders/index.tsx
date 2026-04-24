import { useState } from 'react';
import { Eye, Search, Package, CheckCircle2, Truck, Clock, XCircle, RefreshCw, ShoppingCart, FilterX } from 'lucide-react';
import { useOrders, useOrder, useUpdateOrder, type UpdateOrderPayload } from '@/client/api';
import { formatPrice } from '@/client/data/mock-data';
import {
  PAYMENT_STATUS_LABELS,
  FULFILL_STATUS_LABELS,
  type Order,
} from '@/client/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { FulfillStatus, PaymentStatus } from '@/client/types';

// ─── Helpers ──────────────────────────────────────────────────────────────

const FULFILL_COLORS: Record<FulfillStatus, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  PACKING: 'border-blue-200 bg-blue-50 text-blue-700',
  SHIPPED: 'border-purple-200 bg-purple-50 text-purple-700',
  DELIVERED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CANCELLED: 'border-slate-200 bg-slate-50 text-slate-500',
};

const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  PAID: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  FAILED: 'border-rose-200 bg-rose-50 text-rose-700',
  REFUNDED: 'border-slate-200 bg-slate-50 text-slate-500',
};

function FulfillStatusBadge({ status }: { status: FulfillStatus }) {
  const icons: Record<string, React.ReactNode> = {
    PENDING: <Clock className="h-3 w-3" />,
    PACKING: <Package className="h-3 w-3" />,
    SHIPPED: <Truck className="h-3 w-3" />,
    DELIVERED: <CheckCircle2 className="h-3 w-3" />,
    CANCELLED: <XCircle className="h-3 w-3" />,
  };
  return (
    <Badge variant="outline" className={cn('gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-none', FULFILL_COLORS[status])}>
      {icons[status]}
      {FULFILL_STATUS_LABELS[status as keyof typeof FULFILL_STATUS_LABELS] ?? status}
    </Badge>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant="outline" className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-none', PAYMENT_COLORS[status])}>
      {PAYMENT_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

function getImageUrl(item: Order['orderItems'][0]): string | null {
  if (item.product?.imageUrls?.length) return item.product.imageUrls[0];
  if (item.product?.thumbnailUrl) return item.product.thumbnailUrl;
  if (item.productImage) return item.productImage;
  return null;
}

// ─── Update Dialog ────────────────────────────────────────────────────────

function UpdateOrderDialog({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const { data: order } = useOrder(orderId);
  const [fulfillStatus, setFulfillStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const updateMutation = useUpdateOrder();

  const handleOpen = () => {
    if (order) {
      setFulfillStatus(order.fulfillStatus);
      setPaymentStatus(order.paymentStatus);
      setTrackingCode(order.trackingCode ?? '');
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!order) return;

    const updateData: UpdateOrderPayload = {};
    if (fulfillStatus !== order.fulfillStatus) updateData.fulfillStatus = fulfillStatus as FulfillStatus;
    if (paymentStatus !== order.paymentStatus) updateData.paymentStatus = paymentStatus as PaymentStatus;
    if (trackingCode !== (order.trackingCode ?? '')) updateData.trackingCode = trackingCode || undefined;

    if (Object.keys(updateData).length === 0) {
      setOpen(false);
      return;
    }

    try {
      await updateMutation.mutateAsync({ orderId, data: updateData });
      setOpen(false);
    } catch {
      // toast handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 rounded-full border-slate-200 text-xs" onClick={handleOpen}>
          <RefreshCw className="h-3.5 w-3.5" />
          Cập nhật
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-bold text-slate-900">Cập nhật đơn hàng</DialogTitle>
          <DialogDescription className="text-xs">
            Thay đổi trạng thái và thông tin đơn hàng #{order?.orderNo}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500">Trạng thái giao hàng</Label>
            <Select value={fulfillStatus} onValueChange={setFulfillStatus}>
              <SelectTrigger className="rounded-xl border-slate-200 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                <SelectItem value="PACKING">Đang đóng gói</SelectItem>
                <SelectItem value="SHIPPED">Đang giao hàng</SelectItem>
                <SelectItem value="DELIVERED">Đã giao hàng</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500">Trạng thái thanh toán</Label>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger className="rounded-xl border-slate-200 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="PENDING">Chờ thanh toán</SelectItem>
                <SelectItem value="PAID">Đã thanh toán</SelectItem>
                <SelectItem value="FAILED">Thanh toán thất bại</SelectItem>
                <SelectItem value="REFUNDED">Đã hoàn tiền</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500">Mã vận đơn</Label>
            <Input
              placeholder="GHTK-1234567890"
              className="rounded-xl border-slate-200 h-10"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
          <Button variant="ghost" className="rounded-full h-10 px-6 font-bold text-slate-500" onClick={() => setOpen(false)} disabled={updateMutation.isPending}>
            Hủy
          </Button>
          <Button className="rounded-full h-10 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={handleSubmit} isLoading={updateMutation.isPending}>
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Order Detail Sheet ─────────────────────────────────────────────────

function OrderDetailSheet({ orderId }: { orderId: string }) {
  const { data: order, isLoading } = useOrder(orderId);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-emerald-50 text-emerald-600 transition-colors">
          <Eye className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[420px] sm:max-w-[520px] overflow-y-auto font-manrope border-l-emerald-100">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <ShoppingCart className="size-4" />
            </div>
            Chi tiết đơn hàng
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="mt-8 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full rounded-lg" />
            ))}
          </div>
        ) : order ? (
          <div className="mt-8 space-y-6">
            {/* Header */}
            <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mã đơn</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">#{order.orderNo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày đặt</span>
                <span className="text-sm font-medium text-slate-700">{new Date(order.orderedAt).toLocaleDateString('vi-VN', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}</span>
              </div>
              <Separator className="bg-white" />
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thanh toán</span>
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Giao hàng</span>
                <FulfillStatusBadge status={order.fulfillStatus} />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900">
                <div className="h-1 w-4 bg-emerald-500 rounded-full" />
                <h4 className="text-sm font-bold uppercase tracking-wider">Thông tin nhận hàng</h4>
              </div>
              <div className="rounded-2xl border border-slate-100 p-4 space-y-2">
                <p className="font-bold text-slate-900 text-sm">{order.shippingAddr.fullName} — {order.shippingAddr.phone}</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {order.shippingAddr.addressLine}{order.shippingAddr.district ? `, ${order.shippingAddr.district}` : ''}, {order.shippingAddr.province}
                </p>
                {order.trackingCode && (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Mã vận đơn</span>
                    <span className="font-mono text-xs font-bold text-emerald-800">{order.trackingCode}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900">
                <div className="h-1 w-4 bg-emerald-500 rounded-full" />
                <h4 className="text-sm font-bold uppercase tracking-wider">Sản phẩm ({order.orderItems.length})</h4>
              </div>
              <div className="space-y-3">
                {order.orderItems.map((item) => {
                  const img = getImageUrl(item);
                  return (
                    <div key={item.id} className="flex gap-4 p-3 rounded-2xl border border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <div className="size-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100 shadow-xs">
                        {img && <img src={img} alt={item.nameSnapshot} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{item.nameSnapshot}</p>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                          {item.quantityKg}kg × {formatPrice(item.priceSnapshot)}
                        </p>
                        <p className="text-sm font-bold text-emerald-600 mt-0.5">
                          {formatPrice(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-3">
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Tạm tính</span>
                <span className="tabular-nums font-bold text-slate-700">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Phí vận chuyển</span>
                <span className="tabular-nums font-bold text-slate-700">{order.shippingFee === 0 ? 'Miễn phí' : formatPrice(order.shippingFee)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-xs font-bold text-emerald-600">
                  <span>Giảm giá</span>
                  <span className="tabular-nums">-{formatPrice(order.discount)}</span>
                </div>
              )}
              <Separator className="bg-white shadow-sm" />
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-bold text-slate-900">Tổng cộng</span>
                <span className="text-xl font-bold text-emerald-600 tabular-nums leading-none">{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* Admin Actions */}
            {order.fulfillStatus !== 'CANCELLED' && order.fulfillStatus !== 'DELIVERED' && (
              <div className="pt-2">
                <UpdateOrderDialog orderId={order.id} />
              </div>
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

// ─── Table Skeleton ─────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4">
          <Skeleton className="h-5 w-24 rounded-lg" />
          <Skeleton className="h-5 w-40 rounded-lg" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-lg ml-auto" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────

export default function InventoryOrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [fulfillFilter, setFulfillFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');

  const { data, isLoading, isFetching, refetch } = useOrders({
    page,
    limit: 20,
    search: search || undefined,
    fulfillStatus: fulfillFilter || undefined,
    paymentStatus: paymentFilter || undefined,
  });

  const items = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <div className="h-full min-h-0 flex flex-col gap-5 p-4 sm:p-6 font-manrope">
      {/* Header Card - Admin Style */}
      <Card className="border-dashed border-emerald-400/50 bg-white shadow-xs">
        <CardContent className="p-4 sm:p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <ShoppingCart className="size-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Quản lý đơn hàng
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Theo dõi và cập nhật trạng thái đơn hàng hệ thống
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group min-w-[200px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-600 transition-colors" />
              <Input
                placeholder="Tìm mã đơn hàng..."
                className="h-9 rounded-full border-slate-200 pl-9 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-full border-slate-200"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={fulfillFilter || 'all'}
          onValueChange={(v) => { setFulfillFilter(v === 'all' ? '' : v); setPage(1); }}
        >
          <SelectTrigger className="h-9 w-[160px] rounded-full border-slate-200 bg-white">
            <SelectValue placeholder="Trạng thái giao" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Tất cả giao hàng</SelectItem>
            <SelectItem value="PENDING">Chờ xử lý</SelectItem>
            <SelectItem value="PACKING">Đang đóng gói</SelectItem>
            <SelectItem value="SHIPPED">Đang giao</SelectItem>
            <SelectItem value="DELIVERED">Đã giao</SelectItem>
            <SelectItem value="CANCELLED">Đã hủy</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={paymentFilter || 'all'}
          onValueChange={(v) => { setPaymentFilter(v === 'all' ? '' : v); setPage(1); }}
        >
          <SelectTrigger className="h-9 w-[160px] rounded-full border-slate-200 bg-white">
            <SelectValue placeholder="Thanh toán" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Tất cả thanh toán</SelectItem>
            <SelectItem value="PENDING">Chờ thanh toán</SelectItem>
            <SelectItem value="PAID">Đã thanh toán</SelectItem>
            <SelectItem value="FAILED">Thất bại</SelectItem>
            <SelectItem value="REFUNDED">Hoàn tiền</SelectItem>
          </SelectContent>
        </Select>

        {(search || fulfillFilter || paymentFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(''); setFulfillFilter(''); setPaymentFilter(''); setPage(1); }}
            className="h-9 rounded-full px-3 text-muted-foreground hover:bg-slate-100"
          >
            <FilterX className="size-3.5 mr-1" />
            Xóa lọc
          </Button>
        )}
      </div>

      {/* Table Section */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="h-full overflow-auto custom-scrollbar">
          {isLoading ? (
            <div className="p-4"><TableSkeleton /></div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 rounded-full bg-slate-50 p-4 border border-dashed border-slate-200">
                <Package className="text-slate-300 size-8" />
              </div>
              <h3 className="font-bold text-slate-600">Không có đơn hàng nào</h3>
              <p className="text-xs text-muted-foreground mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-slate-50/80 sticky top-0 z-10">
                    <TableRow className="border-b-slate-100 hover:bg-transparent">
                      <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px] pl-6">Mã đơn</TableHead>
                      <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Khách hàng</TableHead>
                      <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Thanh toán</TableHead>
                      <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Giao hàng</TableHead>
                      <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right">Tổng tiền</TableHead>
                      <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right">Ngày đặt</TableHead>
                      <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right pr-6">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((order) => (
                      <TableRow key={order.id} className="group border-b-slate-50 hover:bg-emerald-50/30 transition-colors">
                        <TableCell className="pl-6">
                          <span className="font-mono font-bold text-emerald-600 group-hover:underline transition-all">
                            #{order.orderNo}
                          </span>
                        </TableCell>
                        <TableCell>
                          {order.client?.user ? (
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-900 text-sm line-clamp-1">{order.client.user.fullName}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{order.client.user.email}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[10px] font-medium">Khách lẻ</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={order.paymentStatus} />
                        </TableCell>
                        <TableCell>
                          <FulfillStatusBadge status={order.fulfillStatus} />
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-sm text-emerald-600 tabular-nums">
                            {formatPrice(order.total)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            {new Date(order.orderedAt).toLocaleDateString('vi-VN', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <OrderDetailSheet orderId={order.id} />
                            <UpdateOrderDialog orderId={order.id} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {items.map((order) => (
                  <div key={order.id} className="p-4 space-y-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-mono font-bold text-emerald-600">#{order.orderNo}</p>
                        {order.client?.user && (
                          <p className="text-sm font-bold text-slate-900">{order.client.user.fullName}</p>
                        )}
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end">
                        <PaymentStatusBadge status={order.paymentStatus} />
                        <FulfillStatusBadge status={order.fulfillStatus} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <p className="font-bold text-emerald-600 tabular-nums">{formatPrice(order.total)}</p>
                      <div className="flex gap-1">
                        <OrderDetailSheet orderId={order.id} />
                        <UpdateOrderDialog orderId={order.id} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination Container */}
      {!isLoading && totalPages > 1 && (
        <Card className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Trang {page} / {totalPages} — {total} đơn hàng
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-8 rounded-full border-slate-200 px-4 text-xs font-bold"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                className="h-8 rounded-full border-slate-200 px-4 text-xs font-bold"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isFetching}
              >
                Sau
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
