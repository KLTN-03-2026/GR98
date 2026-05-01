import React, { useState } from 'react';
import { useGetLots } from './api/hooks';
import { LotsTable } from './components/LotsTable';
import { LotDetailDrawer } from './components/LotDetailDrawer';
import type { InventoryLot } from './api/types';
import { 
  Package, 
  Search, 
  Filter,
  RefreshCw
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function InventoryLotsPage() {
  const [selectedLot, setSelectedLot] = useState<InventoryLot | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: lots = [], isLoading, refetch, isRefetching } = useGetLots({});

  const handleViewDetail = (lot: InventoryLot) => {
    setSelectedLot(lot);
    setIsDrawerOpen(true);
  };

  const filteredLots = lots.filter(lot => 
    lot.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lot.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lot.product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 font-manrope uppercase">
            Quản lý Lô hàng
          </h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
            <Package className="size-4 text-slate-400" />
            Giám sát định danh & chất lượng nông sản
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-2xl border-slate-200 hover:bg-slate-100 transition-all active:rotate-180 duration-500"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn("size-4 text-slate-600", isRefetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
          <Input 
            placeholder="Tìm kiếm theo mã lô, tên sản phẩm hoặc SKU..." 
            className="pl-12 h-14 rounded-3xl border-slate-100 bg-white shadow-sm focus:bg-white focus:ring-slate-900 focus:border-slate-900 transition-all font-bold text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button className="h-14 rounded-3xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest gap-2 shadow-xl shadow-slate-200">
          <Filter className="size-4" />
          Bộ lọc nâng cao
        </Button>
      </div>

      {/* Main Table */}
      <LotsTable 
        lots={filteredLots} 
        isLoading={isLoading} 
        onViewDetail={handleViewDetail} 
      />

      {/* Detail Drawer */}
      <LotDetailDrawer 
        lot={selectedLot} 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </div>
  );
}

// Helper to use 'cn' since it was missed in imports in index.tsx if needed
import { cn } from '@/lib/utils';
