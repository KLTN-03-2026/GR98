import React, { useState, useMemo } from 'react';
import { History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { useGetTransactions, useGetTransactionWarehouses } from './api/hooks';
import { createTransactionColumns } from './components/transactions-columns';
import { TransactionsFilterBar } from './components/TransactionsFilterBar';
import CreateTransactionDialog from './components/CreateTransactionDialog';
import type { TransactionFilters } from './api/types';

export default function InventoryTransactionsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({
    warehouseId: 'all',
    type: 'all',
    productId: '',
  });

  const apiFilters = {
    warehouseId: filters.warehouseId === 'all' ? undefined : filters.warehouseId,
    type: filters.type === 'all' ? undefined : filters.type,
    productId: filters.productId || undefined,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    inventoryLotId: filters.inventoryLotId,
    noteSearch: filters.noteSearch,
  };

  const { data: transactions = [], isLoading, isFetching, refetch } = useGetTransactions(apiFilters);
  const { data: warehouses = [] } = useGetTransactionWarehouses();

  const columns = useMemo(() => createTransactionColumns(), []);

  const filterToolbar = (
    <TransactionsFilterBar
      filters={filters}
      onFiltersChange={setFilters}
      warehouses={warehouses.map(w => ({ id: w.id, name: w.name }))}
    />
  );

  const customActions = (
    <Button 
      onClick={() => setIsDialogOpen(true)}
      className="h-9 px-4 gap-2"
    >
      <Plus className="size-4" />
      Điều chỉnh tồn kho
    </Button>
  );

  return (
    <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-500">
      {/* Standard Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/8 text-primary">
              <History className="size-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Lịch sử Giao dịch
            </h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Theo dõi biến động tồn kho: nhập hàng từ thu hoạch và thực hiện điều chỉnh số liệu kiểm kê thực tế.
          </p>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-hide">
          <DataTable
            columns={columns}
            data={transactions}
            isLoading={isLoading || isFetching}
            onReload={() => refetch()}
            filterToolbar={filterToolbar}
            customActions={customActions}
            searchPlaceholder="Tìm kiếm sản phẩm..."
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {/* Dialogs */}
      <CreateTransactionDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
      />
    </div>
  );
}
