import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn, getImageUrl } from '@/lib/utils';
import { 
  Eye, 
  Search, 
  Package, 
  CheckCircle2, 
  Truck, 
  Clock, 
  XCircle, 
  RefreshCw, 
  ShoppingCart, 
  FilterX 
} from 'lucide-react';
import { useOrders, useUpdateOrder } from '@/client/api';
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
import type { FulfillStatus, PaymentStatus } from '@/client/types';

// ─── Sub-Components ───────────────────────────────────────────────────────

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
      {FULFILL_STATUS_LABELS[status] ?? status}
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

function UpdateOrderDialog({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<FulfillStatus>('PENDING');
  const { mutate: updateOrder, isPending } = useUpdateOrder();

  const handleUpdate = () => {
    updateOrder(
      { orderId, data: { fulfillStatus: status } },
      {
        onSuccess: () => {
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-1 rounded-full border-slate-200 text-xs" 
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Cập nhật
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[32px] border-none shadow-2xl font-manrope" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900">Cập nhật đơn hàng</DialogTitle>
          <DialogDescription className="font-medium text-slate-500">
            Thay đổi trạng thái xử lý cho đơn hàng này.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Trạng thái xử lý</Label>
            <Select value={status} onValueChange={(val) => setStatus(val as FulfillStatus)}>
              <SelectTrigger className="rounded-2xl border-slate-100 h-12 font-bold focus:ring-emerald-500/20">
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
            className="rounded-2xl font-bold hover:bg-slate-50"
          >
            Hủy
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isPending}
            className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black px-8 transition-all active:scale-95 text-white"
          >
            {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────

export default function InventoryOrdersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [fulfillFilter, setFulfillFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  const { data, isLoading, isFetching, refetch } = useOrders({
    page,
    limit: 10,
    search: search || undefined,
    fulfillStatus: fulfillFilter === 'ALL' ? undefined : (fulfillFilter as FulfillStatus),
    paymentStatus: paymentFilter === 'ALL' ? undefined : (paymentFilter as PaymentStatus),
  });

  const items = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleRowClick = (id: string) => {
    navigate(`/inventory/orders/${id}`);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto font-manrope animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShoppingCart className="size-8 text-emerald-600" />
            Đơn hàng & Thanh toán
          </h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Quản lý và giám sát vận hành</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => refetch()}
            variant="ghost"
            size="icon"
            className={cn('rounded-full hover:bg-emerald-50 text-emerald-600 transition-all active:rotate-180 duration-500', isFetching && 'animate-spin')}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Statistics Quick View */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng đơn hàng', value: data?.total ?? 0, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Chờ xử lý', value: items.filter(o => o.fulfillStatus === 'PENDING').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Đang giao', value: items.filter(o => o.fulfillStatus === 'SHIPPED').length, icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Hoàn tất', value: items.filter(o => o.fulfillStatus === 'DELIVERED').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-[32px] overflow-hidden group hover:shadow-md transition-all duration-300">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn('size-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500', stat.bg, stat.color)}>
                <stat.icon className="size-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{stat.label}</p>
                <p className="text-xl font-black text-slate-900 tracking-tight">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Bar */}
      <Card className="border-none shadow-sm rounded-[32px] bg-slate-50/50">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
            <Input
              placeholder="Tìm theo mã vận đơn, mã đơn hàng..."
              className="pl-11 h-12 rounded-2xl border-none bg-white shadow-xs focus-visible:ring-emerald-500/20 font-medium"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <Select value={fulfillFilter} onValueChange={(v) => { setFulfillFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px] h-12 rounded-2xl border-none bg-white shadow-xs font-bold text-xs text-slate-600">
                <SelectValue placeholder="Trạng thái đơn" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl font-bold border-none shadow-xl">
                <SelectItem value="ALL" className="rounded-xl">Tất cả trạng thái</SelectItem>
                {Object.entries(FULFILL_STATUS_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val} className="rounded-xl">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px] h-12 rounded-2xl border-none bg-white shadow-xs font-bold text-xs text-slate-600">
                <SelectValue placeholder="Thanh toán" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl font-bold border-none shadow-xl">
                <SelectItem value="ALL" className="rounded-xl">Tất cả thanh toán</SelectItem>
                {Object.entries(PAYMENT_STATUS_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val} className="rounded-xl">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(search || fulfillFilter !== 'ALL' || paymentFilter !== 'ALL') && (
              <Button
                variant="ghost"
                className="h-12 rounded-2xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs gap-2 px-4"
                onClick={() => {
                  setSearch('');
                  setFulfillFilter('ALL');
                  setPaymentFilter('ALL');
                  setPage(1);
                }}
              >
                <FilterX className="size-4" /> Xóa lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-[32px]" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <div className="size-24 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <Package className="size-12" />
            </div>
            <p className="font-bold text-lg text-slate-400">Không có đơn hàng nào</p>
            <p className="text-sm font-medium text-slate-300 mt-1">Vui lòng kiểm tra lại bộ lọc hoặc tìm kiếm</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-b-slate-100">
                    <TableHead className="pl-6 h-14 text-[10px] font-black uppercase tracking-widest text-slate-400">Đơn hàng</TableHead>
                    <TableHead className="h-14 text-[10px] font-black uppercase tracking-widest text-slate-400">Khách hàng</TableHead>
                    <TableHead className="h-14 text-[10px] font-black uppercase tracking-widest text-slate-400">Thanh toán</TableHead>
                    <TableHead className="h-14 text-[10px] font-black uppercase tracking-widest text-slate-400">Vận hành</TableHead>
                    <TableHead className="h-14 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng tiền</TableHead>
                    <TableHead className="h-14 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Ngày đặt</TableHead>
                    <TableHead className="h-14 text-right pr-6 text-[10px] font-black uppercase tracking-widest text-slate-400"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((order) => (
                    <TableRow 
                      key={order.id} 
                      className="group border-b-slate-50 hover:bg-emerald-50/30 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(order.id)}
                    >
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
                      <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full hover:bg-emerald-50 text-emerald-600" 
                            onClick={() => handleRowClick(order.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
                <div 
                  key={order.id} 
                  className="p-4 space-y-3 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(order.id)}
                >
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
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full hover:bg-emerald-50 text-emerald-600" 
                        onClick={() => handleRowClick(order.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <UpdateOrderDialog orderId={order.id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pagination Container */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Trang <span className="text-slate-900">{page}</span> / {totalPages} — {data?.total ?? 0} đơn hàng
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isFetching}
            className="rounded-xl font-bold text-xs"
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isFetching}
            className="rounded-xl font-bold text-xs"
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}
