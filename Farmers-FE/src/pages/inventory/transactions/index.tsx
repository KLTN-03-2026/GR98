import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingDown,
  Package,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTodayTransactionStats, useWarehouseTransactions } from '@/client/hooks/use-queries';

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'inbound':
      return <ArrowDownToLine className="h-4 w-4 text-green-600" />;
    case 'outbound':
      return <ArrowUpFromLine className="h-4 w-4 text-red-600" />;
    case 'adjustment':
      return <TrendingDown className="h-4 w-4 text-amber-600" />;
    default:
      return <Package className="h-4 w-4 text-gray-600" />;
  }
};

const getTransactionBadge = (type: string) => {
  switch (type) {
    case 'inbound':
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Nhập kho</Badge>;
    case 'outbound':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">Xuất kho</Badge>;
    case 'adjustment':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">Điều chỉnh</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

const formatQuantity = (qty: number, type: string) => {
  if (type === 'adjustment') {
    return qty > 0 ? `+${qty} kg` : `${qty} kg`;
  }
  return `${Math.abs(qty)} kg`;
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default function InventoryTransactionsPage() {
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useTodayTransactionStats();
  const { data: transactions, isLoading: txLoading, refetch: refetchTx } = useWarehouseTransactions({
    page,
    limit: 10,
    date: 'today',
    warehouseId: warehouseFilter || undefined,
    type: (typeFilter as 'inbound' | 'outbound' | 'adjustment') || undefined,
  });

  const handleRefresh = () => {
    refetchStats();
    refetchTx();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Giao dịch Kho</h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi số lượng giao dịch nhập, xuất và điều chỉnh kho hôm nay
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={statsLoading || txLoading}>
            <RefreshCw className={`h-4 w-4 ${(statsLoading || txLoading) ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild>
            <Link to="/inventory/overview">
              Tổng quan
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Tổng giao dịch */}
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng giao dịch</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <div className="text-3xl font-bold text-slate-700">{stats?.total ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Giao dịch hôm nay</p>
          </CardContent>
        </Card>

        {/* Nhập kho */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nhập kho</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-9 w-12" />
            ) : (
              <div className="text-3xl font-bold text-green-700">{stats?.inbound ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Phiếu nhập hôm nay</p>
          </CardContent>
        </Card>

        {/* Xuất kho */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Xuất kho</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-9 w-12" />
            ) : (
              <div className="text-3xl font-bold text-red-700">{stats?.outbound ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Phiếu xuất hôm nay</p>
          </CardContent>
        </Card>

        {/* Điều chỉnh */}
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Điều chỉnh</CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-9 w-12" />
            ) : (
              <div className="text-3xl font-bold text-amber-700">{stats?.adjustment ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Biến động kho hôm nay</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Loại giao dịch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              <SelectItem value="inbound">Nhập kho</SelectItem>
              <SelectItem value="outbound">Xuất kho</SelectItem>
              <SelectItem value="adjustment">Điều chỉnh</SelectItem>
            </SelectContent>
          </Select>
          <Select value={warehouseFilter} onValueChange={(v) => { setWarehouseFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc theo kho" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả kho</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(typeFilter || warehouseFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setTypeFilter(''); setWarehouseFilter(''); setPage(1); }}
          >
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách giao dịch hôm nay</CardTitle>
            <Badge variant="outline">
              {transactions?.total ?? 0} giao dịch
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loại</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Số lượng</TableHead>
                <TableHead>Kho</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Giờ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txLoading ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    </TableRow>
                  ))}
                </>
              ) : transactions?.data && transactions.data.length > 0 ? (
                transactions.data.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(tx.type)}
                        {getTransactionBadge(tx.type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{tx.product.name}</p>
                        <p className="text-xs text-muted-foreground">{tx.product.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          tx.type === 'outbound' || tx.quantityKg < 0
                            ? 'text-red-600 font-medium'
                            : 'text-green-600 font-medium'
                        }
                      >
                        {formatQuantity(tx.quantityKg, tx.type)}
                      </span>
                    </TableCell>
                    <TableCell>{tx.warehouse.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(tx.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTime(tx.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <ArrowLeftRight className="h-10 w-10 text-muted-foreground/40" />
                      <div>
                        <p className="font-medium text-muted-foreground">Chưa có giao dịch nào hôm nay</p>
                        <p className="text-sm text-muted-foreground">Danh sách sẽ cập nhật khi có giao dịch mới</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {transactions && transactions.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Trang {transactions.page} / {transactions.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= transactions.totalPages}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
