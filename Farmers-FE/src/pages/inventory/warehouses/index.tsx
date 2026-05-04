import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Warehouse as WarehouseIcon,
  MapPin,
  Calendar,
  Box,
  RefreshCcw,
  LayoutGrid,
  Map,
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGetWarehouses } from './api/hooks';
import type { Warehouse } from './api/types';
import { cn } from '@/lib/utils';
import { DataGrid } from '@/components/data-grid';

type ScaleFilter = 'all' | 'small' | 'medium' | 'large';

export default function InventoryWarehousesPage() {
  const navigate = useNavigate();
  const { data: warehouses = [], isLoading, isRefetching, refetch } = useGetWarehouses();
  const [searchQuery, setSearchQuery] = useState('');
  const [scaleFilter, setScaleFilter] = useState<ScaleFilter>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  // Trích xuất danh sách khu vực từ địa chỉ kho
  const regions = useMemo(() => {
    const uniqueRegions = new Set<string>();
    warehouses.forEach(w => {
      if (w.locationAddress) {
        const parts = w.locationAddress.split(',');
        const region = parts[parts.length - 1]?.trim();
        if (region) uniqueRegions.add(region);
      }
    });
    return Array.from(uniqueRegions).sort();
  }, [warehouses]);

  // Logic lọc tổng hợp
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((w: Warehouse) => {
      const matchesSearch = 
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.locationAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      
      let matchesScale = true;
      if (scaleFilter === 'small') matchesScale = w.lotCount < 5;
      else if (scaleFilter === 'medium') matchesScale = w.lotCount >= 5 && w.lotCount <= 15;
      else if (scaleFilter === 'large') matchesScale = w.lotCount > 15;

      let matchesRegion = true;
      if (regionFilter !== 'all') {
        matchesRegion = w.locationAddress?.includes(regionFilter) ?? false;
      }

      return matchesSearch && matchesScale && matchesRegion;
    });
  }, [warehouses, searchQuery, scaleFilter, regionFilter]);

  const totalLots = useMemo(() => {
    return warehouses.reduce((sum, w) => sum + (w.lotCount || 0), 0);
  }, [warehouses]);

  return (
    <div className="h-full min-h-0 flex flex-col gap-6 p-0 font-manrope">
      <DataGrid<Warehouse>
        items={filteredWarehouses}
        title="Quản lý Kho hàng"
        titleIcon={<WarehouseIcon className="size-4 text-primary" />}
        description="Danh sách các kho hàng được phân công. Theo dõi tồn kho và vận hành từng chi nhánh."
        keyExtractor={(warehouse) => warehouse.id}
        renderCard={(warehouse) => (
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/inventory/warehouses/${warehouse.id}`)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                navigate(`/inventory/warehouses/${warehouse.id}`);
              }
            }}
            className={cn(
              "group flex h-full min-h-0 w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-l-4 border-border/70 border-l-primary bg-linear-to-br from-white to-slate-50 p-4 text-left shadow-xs transition duration-200 hover:border-emerald-300 hover:shadow-md",
            )}
          >
            <div className="flex shrink-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-semibold text-slate-900 group-hover:text-emerald-900 transition-colors">
                  {warehouse.name}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3 text-emerald-500" />
                  <span className="truncate">{warehouse.locationAddress ?? 'Chưa cập nhật địa chỉ'}</span>
                </p>
              </div>
              <Badge
                variant="outline"
                className="rounded-full border-none bg-emerald-500/10 text-emerald-700 px-2 py-0.5 text-[10px] font-bold shrink-0"
              >
                Hoạt động
              </Badge>
            </div>

            <div className="mt-4 min-h-0 flex-1 grid grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col gap-1 rounded-xl border border-slate-200/60 bg-white/50 p-2.5 transition-colors group-hover:bg-white">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Lô hàng</span>
                <div className="flex items-center gap-1.5">
                  <Box className="size-3.5 text-emerald-600" />
                  <span className="font-manrope text-sm font-bold text-slate-900">{warehouse.lotCount}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 rounded-xl border border-slate-200/60 bg-white/50 p-2.5 transition-colors group-hover:bg-white">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Thành lập</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-emerald-600" />
                  <span className="font-manrope text-sm font-bold text-slate-900">
                    {format(new Date(warehouse.createdAt), 'MM/yyyy')}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-auto flex shrink-0 items-center justify-between border-t border-dashed border-primary/30 pt-3">
               <span className="text-xs font-medium text-muted-foreground">ID: {warehouse.id.slice(0, 8)}</span>
               <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <WarehouseIcon className="size-3.5" />
               </div>
            </div>
          </div>
        )}
        isLoading={isLoading}
        isAwaitingResults={isRefetching && !isLoading}
        toolbar={{
          search: {
            value: searchQuery,
            onChange: setSearchQuery,
            placeholder: "Tìm tên kho, địa chỉ...",
          },
          filters: (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'small', label: 'Nhỏ' },
                  { id: 'large', label: 'Lớn' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setScaleFilter(s.id as ScaleFilter)}
                    className={cn(
                      "px-4 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap",
                      scaleFilter === s.id 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="relative flex items-center">
                <Map className="absolute left-3 size-4 text-emerald-600 z-10" />
                <select
                  value={regionFilter}
                  onChange={(event) => setRegionFilter(event.target.value)}
                  className="h-9 min-w-[8rem] max-w-[12rem] rounded-full border border-slate-200 bg-white pl-9 pr-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                >
                  <option value="all">Khu vực</option>
                  {regions.map((region) => (
                    <option key={`warehouse-filter-region-${region}`} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="outline"
                size="icon"
                className="size-9 rounded-full border-slate-200 bg-white shadow-sm shrink-0"
                onClick={() => refetch()}
                disabled={isRefetching}
              >
                <RefreshCcw className={cn("size-4 text-muted-foreground", isRefetching && "animate-spin")} />
              </Button>
            </div>
          ),
          quickStats: (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs text-sky-800">
                <LayoutGrid className="size-3.5" />
                <span className="font-bold">{warehouses.length} kho</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
                <Box className="size-3.5" />
                <span className="font-bold">{totalLots} lô</span>
              </div>
            </div>
          ),
        }}
        emptyState={{
          description: "Không tìm thấy kho hàng nào phù hợp với bộ lọc hiện tại.",
        }}
        skeleton={{ count: 6 }}
        layout={{
          minCardWidth: 300,
          equalHeightCards: true,
        }}
        classNames={{ root: "h-full min-h-0", content: "min-h-0 flex-1" }}
      />
    </div>
  );
}
