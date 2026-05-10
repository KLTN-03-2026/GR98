import { useCallback, useMemo, useState } from 'react';
import type { PaginationState, Updater } from '@tanstack/react-table';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, Search, Package, CheckCircle2, Truck, Clock, XCircle, ImageIcon } from 'lucide-react';
import { useOrders, useOrder } from '@/client/api';
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
import { DataTable } from '@/components/data-table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { createOrdersColumns } from './orders-columns';

// ─── Helpers ──────────────────────────────────────────────────────────────

const FULFILL_COLORS: Record<string, string> = {
  PENDING: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  PACKING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  SHIPPED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const PAYMENT_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  REFUNDED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

function FulfillStatusBadge({ status }: { status: string }) {
  const icons: Record<string, React.ReactNode> = {
    PENDING: <Clock className="h-3.5 w-3.5" />,
    PACKING: <Package className="h-3.5 w-3.5" />,
    SHIPPED: <Truck className="h-3.5 w-3.5" />,
    DELIVERED: <CheckCircle2 className="h-3.5 w-3.5" />,
    CANCELLED: <XCircle className="h-3.5 w-3.5" />,
  };
  return (
    <Badge className={cn('gap-1 font-medium text-xs', FULFILL_COLORS[status] ?? '')}>
      {icons[status]}
      {FULFILL_STATUS_LABELS[status as keyof typeof FULFILL_STATUS_LABELS] ?? status}
    </Badge>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn('font-medium text-xs', PAYMENT_COLORS[status] ?? '')}>
      {PAYMENT_STATUS_LABELS[status as keyof typeof PAYMENT_STATUS_LABELS] ?? status}
    </Badge>
  );
}

function getImageUrl(item: Order['orderItems'][0]): string | null {
  if (item.product?.imageUrls?.length) return item.product.imageUrls[0];
  if (item.product?.thumbnailUrl) return item.product.thumbnailUrl;
  if (item.productImage) return item.productImage;
  return null;
}

// ─── Order Detail Sheet (read-only) ─────────────────────────────────────

function OrderDetailSheet({ orderId }: { orderId: string }) {
  const { data: order, isLoading } = useOrder(orderId);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Eye className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[420px] sm:max-w-[520px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Chi tiết đơn hàng</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : order ? (
          <div className="mt-6 space-y-5">
            {/* Header */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mã đơn</span>
                <span className="font-mono font-semibold">{order.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ngày đặt</span>
                <span>{new Date(order.orderedAt).toLocaleDateString('vi-VN', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}</span>
              </div>
              {order.client && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Khách hàng</span>
                  <span className="font-medium">{order.client.user.fullName}</span>
                </div>
              )}
              {order.client?.user?.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SĐT</span>
                  <span>{order.client.user.phone}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Thanh toán</span>
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Giao hàng</span>
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

            {/* Address */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Địa chỉ giao hàng</h4>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{order.shippingAddr.fullName} — {order.shippingAddr.phone}</p>
                <p>{order.shippingAddr.addressLine}{order.shippingAddr.district ? `, ${order.shippingAddr.district}` : ''}, {order.shippingAddr.province}</p>
              </div>
            </div>

            <Separator />

            {/* Items */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Sản phẩm ({order.orderItems.length})</h4>
              {order.orderItems.map((item) => {
                const img = getImageUrl(item);
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                      {img && <img src={img} alt={item.nameSnapshot} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">{item.nameSnapshot}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantityKg}kg × {formatPrice(item.priceSnapshot)}
                      </p>
                      <p className="text-sm font-semibold text-primary mt-0.5">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator />

            {/* Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span>{order.shippingFee === 0 ? 'Miễn phí' : formatPrice(order.shippingFee)}</span>
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

            {/* Delivery Proof */}
            {order.deliveryProofUrl && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-emerald-600" />
                  Ảnh chứng minh giao hàng
                </h4>
                <a
                  href={order.deliveryProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-300 transition-colors"
                >
                  <img
                    src={order.deliveryProofUrl}
                    alt="Chứng minh giao hàng"
                    className="w-full h-40 object-cover"
                  />
                </a>
              </div>
            )}

            {/* Payment Method */}
            <div className="bg-muted/30 rounded-xl p-4 text-sm">
              <h4 className="font-medium mb-1">Phương thức</h4>
              <p className="text-muted-foreground">
                {order.paymentMethod === 'COD' && 'COD — Thanh toán khi nhận hàng'}
                {order.paymentMethod === 'VNPAY' && 'VNPay'}
                {order.paymentMethod === 'MOMO' && 'MoMo'}
              </p>
            </div>

            <div className="rounded-xl border border-dashed border-muted-foreground/20 bg-muted/20 p-3 text-xs text-muted-foreground">
              Các thao tác xác nhận đơn, gán shipper, đánh dấu đã giao và huỷ đơn được thực hiện bởi bộ phận <span className="font-semibold text-foreground">Quản lý kho (Inventory)</span>.
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [fulfillFilter, setFulfillFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const { data, isLoading } = useOrders({
    page,
    limit,
    search: search || undefined,
    fulfillStatus: fulfillFilter || undefined,
    paymentStatus: paymentFilter || undefined,
  });

  const items = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;
  const paginationState = useMemo(
    () => ({ pageIndex: page - 1, pageSize: limit }),
    [page, limit],
  );
  const handlePaginationChange = useCallback((updater: Updater<PaginationState>) => {
    const prev: PaginationState = { pageIndex: page - 1, pageSize: limit };
    const next = typeof updater === 'function' ? updater(prev) : updater;
    setPage(next.pageIndex + 1);
    setLimit(next.pageSize);
  }, [page, limit]);
  const columns = useMemo(
    () =>
      createOrdersColumns({
        formatCurrency: formatPrice,
        renderPaymentStatus: (status) => <PaymentStatusBadge status={status} />,
        renderFulfillStatus: (status) => <FulfillStatusBadge status={status} />,
        renderActions: (order) => (
          <OrderDetailSheet orderId={order.id} />
        ),
      }),
    [],
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/8">
            <Package className="size-4 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Quản lý đơn hàng</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Theo dõi và cập nhật trạng thái đơn hàng của khách hàng
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={items}
            isLoading={isLoading}
            hiddenSearch
            enableSorting={false}
            manualPagination
            pageCount={Math.max(1, totalPages)}
            totalItems={total}
            onPaginationChange={handlePaginationChange}
            state={{ pagination: paginationState }}
            pageSizeOptions={[10, 20, 30, 50, 100]}
            initialColumnVisibility={{
              phone: false,
              subtotal: false,
              shippingFee: false,
              itemCount: false,
              shippingAddress: false,
              trackingCode: false,
              note: false,
            }}
            onReload={() => queryClient.invalidateQueries({ queryKey: ['orders'] })}
            noResults={
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 rounded-full bg-muted p-3">
                  <Package className="text-muted-foreground size-6" />
                </div>
                <p className="font-medium">Không có đơn hàng nào</p>
                <p className="text-muted-foreground text-sm mt-1">Thử thay đổi bộ lọc</p>
              </div>
            }
            filterToolbar={
              <div className="flex flex-wrap items-end gap-3 w-full">
                <div className="flex-1 min-w-48 space-y-1.5">
                  <Label className="text-xs">Tìm kiếm</Label>
                  <div className="relative">
                    <Search className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 size-4" />
                    <Input
                      placeholder="Tìm mã đơn..."
                      className="pl-9 h-9"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Trạng thái giao</Label>
                  <Select
                    value={fulfillFilter || 'all'}
                    onValueChange={(v) => {
                      setFulfillFilter(v === 'all' ? '' : v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-48 h-9">
                      <SelectValue placeholder="Trạng thái giao" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                      <SelectItem value="PACKING">Đang đóng gói</SelectItem>
                      <SelectItem value="SHIPPED">Đang giao</SelectItem>
                      <SelectItem value="DELIVERED">Đã giao</SelectItem>
                      <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Thanh toán</Label>
                  <Select
                    value={paymentFilter || 'all'}
                    onValueChange={(v) => {
                      setPaymentFilter(v === 'all' ? '' : v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-48 h-9">
                      <SelectValue placeholder="Thanh toán" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="PENDING">Chờ thanh toán</SelectItem>
                      <SelectItem value="PAID">Đã thanh toán</SelectItem>
                      <SelectItem value="FAILED">Thất bại</SelectItem>
                      <SelectItem value="REFUNDED">Hoàn tiền</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
