import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  ShoppingCart, 
  RefreshCw, 
} from 'lucide-react';
import { useOrders } from '@/client/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table/data-table';
import { createOrderColumns } from './components/orders-columns';
import type { FulfillStatus, PaymentStatus } from '@/client/types';
import { FULFILL_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/client/types';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

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

  const orders = data?.data ?? [];

  const stats = useMemo(() => {
    return {
      total: data?.total ?? 0,
      pending: orders.filter(o => o.fulfillStatus === 'PENDING').length,
      shipped: orders.filter(o => o.fulfillStatus === 'SHIPPED').length,
      delivered: orders.filter(o => o.fulfillStatus === 'DELIVERED').length,
    };
  }, [data, orders]);

  const columns = useMemo(() => createOrderColumns({
    onViewDetail: (id) => navigate(`/inventory/orders/${id}`),
    onUpdateStatus: (id) => console.log('Update status', id), // Placeholder
  }), [navigate]);

  const filterToolbar = (
    <div className="flex flex-wrap items-end gap-3 w-full">
      <div className="space-y-1.5 min-w-[200px] flex-1 max-w-sm">
        <Label className="text-xs font-medium">Tìm kiếm</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Mã đơn, vận đơn..."
            className="pl-8 h-9 rounded-md text-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="space-y-1.5 min-w-[150px]">
        <Label className="text-xs font-medium">Trạng thái xử lý</Label>
        <Select value={fulfillFilter} onValueChange={(v) => { setFulfillFilter(v); setPage(1); }}>
          <SelectTrigger className={cn("h-9 rounded-md text-xs", fulfillFilter !== 'ALL' && "border-primary")}>
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent className="rounded-md">
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            {Object.entries(FULFILL_STATUS_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 min-w-[150px]">
        <Label className="text-xs font-medium">Thanh toán</Label>
        <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setPage(1); }}>
          <SelectTrigger className={cn("h-9 rounded-md text-xs", paymentFilter !== 'ALL' && "border-primary")}>
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent className="rounded-md">
            <SelectItem value="ALL">Tất cả thanh toán</SelectItem>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(search || fulfillFilter !== 'ALL' || paymentFilter !== 'ALL') && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-xs text-muted-foreground hover:text-rose-600"
          onClick={() => {
            setSearch('');
            setFulfillFilter('ALL');
            setPaymentFilter('ALL');
            setPage(1);
          }}
        >
          <X className="mr-2 h-4 w-4" />
          Xóa lọc
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-6 font-manrope">
      {/* Header Section - Admin Style */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/8">
                    <ShoppingCart className="size-4 text-primary" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Đơn hàng & Thanh toán</h1>
            </div>
            <Button
                variant="outline"
                size="icon"
                className="size-9 rounded-xl border-slate-200"
                onClick={() => refetch()}
                disabled={isFetching}
            >
                <RefreshCw className={`size-4 text-muted-foreground ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Quản lý và giám sát quy trình xử lý đơn hàng, giao nhận và đối soát thanh toán.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100 font-bold uppercase text-[10px] tracking-wider px-2.5 py-0.5">
            Chờ xử lý: {stats.pending}
          </Badge>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 font-bold uppercase text-[10px] tracking-wider px-2.5 py-0.5">
            Đang giao: {stats.shipped}
          </Badge>
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold uppercase text-[10px] tracking-wider px-2.5 py-0.5">
            Hoàn tất: {stats.delivered}
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={orders}
            isLoading={isLoading || isFetching}
            onRowClick={(row) => navigate(`/inventory/orders/${row.id}`)}
            onReload={() => refetch()}
            hiddenSearch
            enableSorting={false}
            filterToolbar={filterToolbar}
            noResults={<span className="text-muted-foreground">Không tìm thấy đơn hàng nào.</span>}
          />
        </CardContent>
      </Card>
    </div>
  );
}
