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
  Weight,
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
    <div className="h-full min-h-0">
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

            {(() => {
              const hasCapacity = warehouse.capacityKg != null && warehouse.capacityKg > 0;
              const usagePercent = hasCapacity
                ? Math.min(Math.round((warehouse.currentStock / warehouse.capacityKg!) * 100), 100)
                : null;
              const barColor = usagePercent === null
                ? 'bg-primary/50'
                : usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
              const textColor = usagePercent === null
                ? 'text-primary'
                : usagePercent >= 90 ? 'text-red-600' : usagePercent >= 70 ? 'text-amber-600' : 'text-emerald-600';

              return (
                <>
                  <div className="mt-4 min-h-0 flex-1 grid grid-cols-3 gap-2 text-sm">
                    <div className="flex flex-col gap-1 rounded-xl border border-slate-200/60 bg-white/50 p-2.5 transition-colors group-hover:bg-white">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Lô hàng</span>
                      <div className="flex items-center gap-1.5">
                        <Box className="size-3.5 text-emerald-600" />
                        <span className="font-manrope text-sm font-bold text-slate-900">{warehouse.lotCount}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 rounded-xl border border-slate-200/60 bg-white/50 p-2.5 transition-colors group-hover:bg-white">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Tồn kho</span>
                      <div className="flex items-center gap-1.5">
                        <Weight className="size-3.5 text-emerald-600" />
                        <span className="font-manrope text-xs font-bold text-slate-900">{warehouse.currentStock.toLocaleString('vi-VN')}kg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 rounded-xl border border-slate-200/60 bg-white/50 p-2.5 transition-colors group-hover:bg-white">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Thành lập</span>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-emerald-600" />
                        <span className="font-manrope text-xs font-bold text-slate-900">
                          {format(new Date(warehouse.createdAt), 'MM/yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto shrink-0 border-t border-dashed border-primary/30 pt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-muted-foreground">
                        {hasCapacity 
                          ? `${warehouse.currentStock.toLocaleString('vi-VN')} / ${warehouse.capacityKg!.toLocaleString('vi-VN')} kg`
                          : 'Không giới hạn sức chứa'}
                      </span>
                      <span className={cn("font-bold", textColor)}>
                        {usagePercent !== null ? `${usagePercent}%` : '∞'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200/70 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", barColor)}
                        style={{ width: usagePercent !== null ? `${usagePercent}%` : '100%' }}
                      />
                    </div>
                  </div>
                </>
              );
            })()}
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
              <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'small', label: 'Nhỏ' },
                  { id: 'large', label: 'Lớn' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setScaleFilter(s.id as ScaleFilter)}
                    className={cn(
                      "px-4 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap",
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
                  className="h-9 min-w-[8rem] max-w-[12rem] rounded-md border bg-background pl-9 pr-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
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
                className="size-9 shrink-0"
                onClick={() => refetch()}
                disabled={isRefetching}
              >
                <RefreshCcw className={cn("size-4 text-muted-foreground", isRefetching && "animate-spin")} />
              </Button>
            </div>
          ),
          quickStats: (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-md border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs text-sky-800">
                <LayoutGrid className="size-3.5" />
                <span className="font-bold">{warehouses.length} kho</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
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
