import { useState } from 'react';
import {
  Plus,
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
  Settings2,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useGetTransactions } from './api';
import { useGetWarehouses } from '../warehouses/api';
import { format } from 'date-fns';
import CreateTransactionDialog from './components/CreateTransactionDialog';

export default function InventoryTransactionsPage() {
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch data
  const { data: transactions, isLoading } = useGetTransactions({
    warehouseId: warehouseFilter !== 'all' ? warehouseFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
  });

  const { data: warehouses } = useGetWarehouses();

  return (
    <div className="flex min-h-screen flex-col gap-8 p-4 md:p-8 font-manrope">
      {/* Header Section */}
      <section className="relative overflow-hidden rounded-[32px] bg-white p-8 shadow-sm border border-primary/5">
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-indigo-500/5 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 size-64 rounded-full bg-blue-500/10 blur-3xl" />
        
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 shadow-inner">
                <ArrowLeftRight className="size-6" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
                Nhật ký Giao dịch
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Đang tải dữ liệu...' : `Tổng cộng ${transactions?.length ?? 0} giao dịch gần đây`}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="h-10 gap-2 rounded-xl bg-indigo-600 text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg active:scale-95"
            >
              <Plus className="size-4" />
              <span>Ghi nhận giao dịch</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Filters */}
      <Card className="rounded-[28px] border-none shadow-sm bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-background p-1 border border-primary/5 shadow-sm">
              <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                <SelectTrigger className="h-8 w-[180px] border-none bg-transparent font-medium shadow-none focus:ring-0">
                  <SelectValue placeholder="Tất cả kho" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-primary/10">
                  <SelectItem value="all">Tất cả kho</SelectItem>
                  {warehouses?.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="h-4 w-px bg-muted mx-1" />
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8 w-[150px] border-none bg-transparent font-medium shadow-none focus:ring-0">
                  <SelectValue placeholder="Loại giao dịch" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-primary/10">
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="inbound">Nhập kho (In)</SelectItem>
                  <SelectItem value="outbound">Xuất kho (Out)</SelectItem>
                  <SelectItem value="adjustment">Điều chỉnh</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-primary/5 bg-white shadow-inner">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-primary/5">
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Thời gian</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Kho & Sản phẩm</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Loại</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Số lượng</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-12 w-full rounded-lg" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : !transactions || transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground p-8">
                      <div className="flex flex-col items-center gap-2">
                        <ArrowLeftRight className="size-8 text-muted/20" />
                        <span>Không tìm thấy giao dịch nào phù hợp.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((t) => (
                    <TableRow key={t.id} className="group border-primary/5 hover:bg-primary/[0.01] transition-colors">
                      <TableCell className="text-xs font-medium text-muted-foreground">
                        <div className="flex flex-col">
                          <span>{format(new Date(t.createdAt), 'dd/MM/yyyy')}</span>
                          <span className="text-[10px] opacity-70">{format(new Date(t.createdAt), 'HH:mm')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-foreground">
                            {t.product?.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                            {t.warehouse?.name} • Lô: {t.inventoryLotId.slice(-6).toUpperCase()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {t.type === 'inbound' && (
                            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <TrendingUp className="size-3" />
                              NHẬP
                            </div>
                          )}
                          {t.type === 'outbound' && (
                            <div className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <TrendingDown className="size-3" />
                              XUẤT
                            </div>
                          )}
                          {t.type === 'adjustment' && (
                            <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <Settings2 className="size-3" />
                              ĐIỀU CHỈNH
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold text-sm ${
                          t.type === 'inbound' ? 'text-emerald-600' : 
                          t.type === 'outbound' ? 'text-rose-600' : 'text-foreground'
                        }`}>
                          {t.quantityKg > 0 ? '+' : ''}{t.quantityKg.toLocaleString()} kg
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate italic">
                        {t.note || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CreateTransactionDialog 
        isOpen={isCreateDialogOpen} 
        onClose={() => setIsCreateDialogOpen(false)} 
      />
    </div>
  );
}
