import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Warehouse,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  useInventoryStats,
  useRecentTransactions,
  useLowStockAlerts,
  useExpiringAlerts,
} from '@/client/hooks/use-queries';

export default function InventoryOverviewPage() {
  const [timeRange, setTimeRange] = useState('today');

  const { data: stats, isLoading: statsLoading } = useInventoryStats();
  const { data: recentTx, isLoading: txLoading } = useRecentTransactions();
  const { data: lowStock, isLoading: lowStockLoading } = useLowStockAlerts();
  const { data: expiring, isLoading: expiringLoading } = useExpiringAlerts();

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

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  const getDaysLeft = (expiryDate: string | null) => {
    if (!expiryDate) return 0;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tổng quan Kho</h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi tình hình kho bãi và luân chuyển hàng hóa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Chọn thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hôm nay</SelectItem>
              <SelectItem value="week">Tuần này</SelectItem>
              <SelectItem value="month">Tháng này</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild>
            <Link to="/inventory/warehouses">
              <Warehouse className="h-4 w-4 mr-2" />
              Quản lý Kho
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Tổng số kho */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số kho</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalWarehouses ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">{stats?.totalWarehouses ?? 0}</span> đang hoạt động
            </p>
          </CardContent>
        </Card>

        {/* Tổng sản phẩm tồn kho */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tồn kho</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {Math.round(stats?.totalProducts ?? 0).toLocaleString()} kg
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Tổng sản lượng
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Nhập kho hôm nay */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nhập kho hôm nay</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{stats?.inboundToday ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Giao dịch nhập kho
            </p>
          </CardContent>
        </Card>

        {/* Xuất kho hôm nay */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Xuất kho hôm nay</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold text-red-600">{stats?.outboundToday ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Giao dịch xuất kho
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Cảnh báo tồn kho thấp */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Cảnh báo tồn kho thấp
              </CardTitle>
              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                {lowStock?.data?.length ?? 0} sản phẩm
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStockLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </>
            ) : lowStock?.data && lowStock.data.length > 0 ? (
              lowStock.data.map((lot) => (
                <div
                  key={lot.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{lot.product.name}</p>
                    <p className="text-xs text-muted-foreground">{lot.warehouse.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-amber-600">
                      {Math.round(lot.quantityKg)} / 50 kg
                    </p>
                    <div className="w-20 h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${Math.min((lot.quantityKg / 50) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Không có cảnh báo tồn kho thấp
              </p>
            )}
            <Button variant="outline" className="w-full mt-2" asChild>
              <Link to="/inventory/lots">
                Xem tất cả
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Cảnh báo hàng sắp hết hạn */}
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                Hàng sắp hết hạn
              </CardTitle>
              <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
                {expiring?.data?.length ?? 0} lô hàng
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {expiringLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </>
            ) : expiring?.data && expiring.data.length > 0 ? (
              expiring.data.map((lot) => (
                <div
                  key={lot.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-100"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{lot.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {lot.warehouse.name} • {Math.round(lot.quantityKg)} kg
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-orange-600">
                      Còn {getDaysLeft(lot.expiryDate)} ngày
                    </p>
                    <p className="text-xs text-muted-foreground">Hạn sử dụng</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Không có cảnh báo hết hạn
              </p>
            )}
            <Button variant="outline" className="w-full mt-2" asChild>
              <Link to="/inventory/lots">
                Xem tất cả
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Giao dịch gần đây</CardTitle>
            <Button variant="ghost" asChild>
              <Link to="/inventory/transactions" className="text-sm">
                Xem tất cả
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
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
                <TableHead>Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txLoading ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    </TableRow>
                  ))}
                </>
              ) : recentTx && recentTx.length > 0 ? (
                recentTx.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(tx.type)}
                        {getTransactionBadge(tx.type)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{tx.product.name}</TableCell>
                    <TableCell>
                      <span
                        className={
                          tx.type === 'outbound' || tx.quantityKg < 0
                            ? 'text-red-600'
                            : 'text-green-600'
                        }
                      >
                        {formatQuantity(tx.quantityKg, tx.type)}
                      </span>
                    </TableCell>
                    <TableCell>{tx.warehouse.name}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{formatTimeAgo(tx.createdAt)}</span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Chưa có giao dịch nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
          <Link to="/inventory/lots">
            <ArrowDownToLine className="h-5 w-5" />
            <span>Nhập kho mới</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
          <Link to="/inventory/transactions">
            <ArrowUpFromLine className="h-5 w-5" />
            <span>Xuất kho</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
          <Link to="/inventory/lots">
            <Package className="h-5 w-5" />
            <span>Kiểm kê kho</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
          <Link to="/inventory/products">
            <TrendingUp className="h-5 w-5" />
            <span>Báo cáo tồn kho</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
