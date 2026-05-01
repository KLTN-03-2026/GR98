import React, { useState } from 'react';
import { 
  History, 
  Plus, 
  Search, 
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useGetTransactions, useGetTransactionWarehouses } from './api/hooks';
import { TransactionTable } from './components/TransactionTable';
import CreateTransactionDialog from './components/CreateTransactionDialog';
import { cn } from '@/lib/utils';

export default function InventoryTransactionsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    warehouseId: 'all',
    type: 'all',
    productId: '',
  });

  const apiFilters = {
    warehouseId: filters.warehouseId === 'all' ? undefined : filters.warehouseId,
    type: filters.type === 'all' ? undefined : filters.type,
    productId: filters.productId || undefined,
  };

  const { data: transactions = [], isLoading, refetch } = useGetTransactions(apiFilters);
  const { data: warehouses = [] } = useGetTransactionWarehouses();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-200">
              <History className="size-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Lịch sử Giao dịch</h1>
              <p className="text-sm text-muted-foreground font-medium">
                Theo dõi toàn bộ biến động nhập, xuất và điều chỉnh kho hàng.
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="rounded-2xl h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xl shadow-slate-200 gap-2 transition-all active:scale-95"
        >
          <Plus className="size-5" />
          Tạo giao dịch mới
        </Button>
      </div>

      {/* Quick Stats or Highlights can go here */}

      {/* Filters Section */}
      <Card className="rounded-[24px] border-none shadow-sm bg-slate-50/50">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[240px] space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Tìm kiếm sản phẩm</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input 
                  placeholder="Nhập tên sản phẩm..." 
                  className="pl-10 h-11 rounded-xl bg-white border-slate-200 focus:ring-slate-900"
                  value={filters.productId}
                  onChange={(e) => setFilters(f => ({ ...f, productId: e.target.value }))}
                />
              </div>
            </div>

            <div className="w-[200px] space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Kho hàng</label>
              <Select 
                value={filters.warehouseId} 
                onValueChange={(val) => setFilters(f => ({ ...f, warehouseId: val }))}
              >
                <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200">
                  <SelectValue placeholder="Tất cả kho" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Tất cả kho</SelectItem>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[180px] space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Loại giao dịch</label>
              <Select 
                value={filters.type} 
                onValueChange={(val) => setFilters(f => ({ ...f, type: val }))}
              >
                <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200">
                  <SelectValue placeholder="Tất cả loại" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="inbound">Nhập kho</SelectItem>
                  <SelectItem value="outbound">Xuất kho</SelectItem>
                  <SelectItem value="adjustment">Điều chỉnh</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="outline" 
              onClick={() => setFilters({ warehouseId: 'all', type: 'all', productId: '' })}
              className="h-11 rounded-xl px-4 border-slate-200 text-slate-500 hover:text-slate-900"
            >
              <Filter className="size-4 mr-2" />
              Xóa lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Table Section */}
      <div className="rounded-[32px] border border-slate-100 bg-white shadow-sm overflow-hidden">
        <TransactionTable data={transactions} isLoading={isLoading} />
      </div>

      {/* Dialog */}
      <CreateTransactionDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
      />
    </div>
  );
}
