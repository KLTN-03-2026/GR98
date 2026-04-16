import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  ChevronRight,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  MapPin,
  Eye,
  X,
  AlertTriangle,
} from 'lucide-react';
import {
  useOrders,
  useOrder,
  useCancelOrder,
} from '@/client/api';
import { formatPrice } from '@/client/data/mock-data';
import {
  PAYMENT_STATUS_LABELS,
  FULFILL_STATUS_LABELS,
  type Order,
} from '@/client/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
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
import { Input } from '@/components/ui/input';

// ─── Helpers ────────────────────────────────────────────────────────────────

function FulfillStatusIcon({ status }: { status: Order['fulfillStatus'] }) {
  switch (status) {
    case 'PENDING':
      return <Clock className="h-4 w-4 text-orange-500" />;
    case 'PACKING':
      return <Package className="h-4 w-4 text-blue-500" />;
    case 'SHIPPED':
      return <Truck className="h-4 w-4 text-purple-500" />;
    case 'DELIVERED':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'CANCELLED':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return null;
  }
}

function PaymentStatusBadge({ status }: { status: Order['paymentStatus'] }) {
  const variants: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    REFUNDED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };
  return (
    <Badge className={`${variants[status] ?? ''} font-medium text-xs`}>
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  );
}

function FulfillStatusBadge({ status }: { status: Order['fulfillStatus'] }) {
  const variants: Record<string, string> = {
    PENDING: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    PACKING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    SHIPPED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };
  return (
    <Badge className={`${variants[status] ?? ''} font-medium text-xs gap-1`}>
      <FulfillStatusIcon status={status} />
      {FULFILL_STATUS_LABELS[status]}
    </Badge>
  );
}

// ─── Cancel Dialog ─────────────────────────────────────────────────────────

function CancelOrderDialog({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const cancelMutation = useCancelOrder();

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync({ orderId, reason });
      setOpen(false);
      setReason('');
    } catch {
      // toast đã xử lý trong hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="gap-1.5"
          disabled={cancelMutation.isPending}
        >
          <X className="h-4 w-4" />
          Hủy đơn
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Hủy đơn hàng
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Lý do hủy (tùy chọn)</Label>
          <Input
            placeholder="Ví dụ: Thay đổi ý định, giao chậm..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={cancelMutation.isPending}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={cancelMutation.isPending}>
            Không hủy
          </Button>
          <Button variant="destructive" onClick={handleCancel} isLoading={cancelMutation.isPending}>
            Xác nhận hủy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Order Detail Sheet ────────────────────────────────────────────────────

function OrderDetailSheet({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const { data: order, isLoading } = useOrder(orderId);

  const getImageUrl = (item: Order['orderItems'][0]) => {
    if (item.product?.imageUrls?.length) return item.product.imageUrls[0];
    if (item.product?.thumbnailUrl) return item.product.thumbnailUrl;
    if (item.productImage) return item.productImage;
    return null;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5">
          <Eye className="h-4 w-4" />
          Chi tiết
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[420px] sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Chi tiết đơn hàng</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : order ? (
          <div className="mt-6 space-y-6">
            {/* Order Info */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mã đơn</span>
                <span className="font-mono font-semibold">{order.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ngày đặt</span>
                <span>
                  {new Date(order.orderedAt).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Thanh toán</span>
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Trạng thái</span>
                <FulfillStatusBadge status={order.fulfillStatus} />
              </div>
              {order.trackingCode && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã vận đơn</span>
                  <span className="font-mono text-sm">{order.trackingCode}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Shipping Address */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Địa chỉ giao hàng</h4>
              <div className="flex gap-3 text-sm">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="text-muted-foreground">
                  <p className="font-medium text-foreground">{order.shippingAddr.fullName}</p>
                  <p>{order.shippingAddr.phone}</p>
                  <p>
                    {order.shippingAddr.addressLine}
                    {order.shippingAddr.district && `, ${order.shippingAddr.district}`}
                    {order.shippingAddr.province && `, ${order.shippingAddr.province}`}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Order Items */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Sản phẩm</h4>
              {order.orderItems.map((item) => {
                const imgUrl = getImageUrl(item);
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                      {imgUrl && (
                        <img
                          src={imgUrl}
                          alt={item.nameSnapshot}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">{item.nameSnapshot}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantityKg}kg × {formatPrice(item.priceSnapshot)}
                      </p>
                      <p className="text-sm font-semibold text-primary mt-1">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator />

            {/* Price Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span className={order.shippingFee === 0 ? 'text-green-600' : ''}>
                  {order.shippingFee === 0 ? 'Miễn phí' : formatPrice(order.shippingFee)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Tổng cộng</span>
                <span className="text-primary text-lg">{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="font-medium text-sm mb-2">Phương thức thanh toán</h4>
              <p className="text-sm text-muted-foreground">
                {order.paymentMethod === 'COD' && 'Thanh toán khi nhận hàng (COD)'}
                {order.paymentMethod === 'VNPAY' && 'VNPay'}
                {order.paymentMethod === 'MOMO' && 'MoMo'}
              </p>
            </div>

            {/* Cancel Button - only if pending */}
            {order.fulfillStatus === 'PENDING' && (
              <CancelOrderDialog orderId={order.id} />
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

// ─── Order Card ────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-5 sm:p-6">
          {/* Order Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold">{order.orderNo}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(order.orderedAt).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <PaymentStatusBadge status={order.paymentStatus} />
              <FulfillStatusBadge status={order.fulfillStatus} />
            </div>
          </div>

          {/* Order Items Preview */}
          <div className="flex gap-3 mb-4">
            {order.orderItems.slice(0, 3).map((item) => {
              const imgUrl = item.product?.imageUrls?.[0]
                ?? item.product?.thumbnailUrl
                ?? item.productImage;
              return (
                <div key={item.id} className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                  {imgUrl && (
                    <img
                      src={imgUrl}
                      alt={item.nameSnapshot}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              );
            })}
            {order.orderItems.length > 3 && (
              <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                +{order.orderItems.length - 3}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {order.orderItems.map((i) => i.nameSnapshot).join(', ')}
              </p>
            </div>
          </div>

          {/* Order Footer */}
          <Separator className="mb-4" />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm text-muted-foreground">Tổng thanh toán</span>
              <p className="text-xl font-bold text-primary">
                {formatPrice(order.total)}
              </p>
            </div>
            <OrderDetailSheet orderId={order.id} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Orders List Skeleton ─────────────────────────────────────────────────

function OrdersListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5 sm:p-6 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-36" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-28" />
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton className="w-14 h-14 rounded-lg" />
              <Skeleton className="w-14 h-14 rounded-lg" />
              <Skeleton className="flex-1 h-14" />
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-8 w-20 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [page] = useState(1);

  const { data, isLoading } = useOrders({
    page,
    limit: 20,
    myOrders: 'true',
  });

  const items = data?.data ?? [];

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Đơn Hàng Của Tôi</h1>
          <p className="text-muted-foreground">
            Theo dõi và quản lý các đơn hàng của bạn
          </p>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <OrdersListSkeleton />
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 mx-auto bg-muted/30 rounded-full flex items-center justify-center mb-4">
              <Package className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Chưa có đơn hàng nào</h2>
            <p className="text-muted-foreground mb-4">
              Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm ngay!
            </p>
            <Button asChild>
              <Link to="/products">Khám phá sản phẩm</Link>
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {items.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <OrderCard order={order} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
