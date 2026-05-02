import React, { useState, useMemo } from 'react';
import { History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { useGetTransactions, useGetTransactionWarehouses, useGetTransactionProducts } from './api/hooks';
import { createTransactionColumns } from './components/transactions-columns';
import { TransactionsFilterBar } from './components/TransactionsFilterBar';
import CreateTransactionDialog from './components/CreateTransactionDialog';
import type { TransactionFilters } from './api/types';

export default function InventoryTransactionsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({});

  const apiFilters = useMemo(() => ({
    warehouseId: filters.warehouseId,
    type: filters.type,
    productId: filters.productId,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    inventoryLotId: filters.inventoryLotId,
    noteSearch: filters.noteSearch,
  }), [filters]);

  const { data: transactions = [], isLoading, isFetching, refetch } = useGetTransactions(apiFilters);
  const { data: warehouses = [] } = useGetTransactionWarehouses();
  const { data: products = [] } = useGetTransactionProducts();

  const columns = useMemo(() => createTransactionColumns(), []);

  const filterToolbar = (
    <TransactionsFilterBar
      filters={filters}
      onFiltersChange={setFilters}
      warehouses={warehouses.map(w => ({ id: w.id, name: w.name }))}
      products={products.map(p => ({ id: p.id, name: p.name }))}
    />
  );

  const customActions = (
    <Button 
      onClick={() => setIsDialogOpen(true)}
      className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2"
    >
      <Plus className="size-4" />
      Tạo giao dịch
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
            Theo dõi toàn bộ biến động nhập, xuất và điều chỉnh kho hàng theo thời gian thực.
          </p>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <DataTable
          columns={columns}
          data={transactions}
          isLoading={isLoading || isFetching}
          onReload={() => refetch()}
          filterToolbar={filterToolbar}
          customActions={customActions}
          searchPlaceholder="Tìm kiếm ghi chú..."
          manualFiltering={true}
          onGlobalFilterChange={(val) => setFilters(f => ({ ...f, noteSearch: val }))}
        />
      </div>

      {/* Dialogs */}
      <CreateTransactionDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
      />
    </div>
  );
}
