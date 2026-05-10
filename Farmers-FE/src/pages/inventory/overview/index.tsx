import { LayoutDashboard, RefreshCcw, Warehouse, AlertCircle, Package, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useInventoryDashboard, useInventoryChartData } from './api';
import { cn } from '@/lib/utils';

// New Components
import { InventoryKpiCards } from './components/InventoryKpiCards';
import { InventoryCharts } from './components/InventoryCharts';
import { InventoryActivityTable } from './components/InventoryActivityTable';

import { useNavigate } from 'react-router-dom';

export default function InventoryOverviewPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch, isRefetching } = useInventoryDashboard();
  const { data: chartData, isLoading: isChartLoading } = useInventoryChartData();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-primary/[0.07] via-background to-background pb-8 pt-4 dark:from-primary/15 font-manrope">
      <div className="mx-auto w-full max-w-none space-y-6 px-4 sm:px-6 lg:px-8">
        
        {/* Exact Admin Style Header */}
        <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card px-5 py-6 shadow-sm sm:px-8">
          <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                <LayoutDashboard className="size-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Tổng quan Kho hàng
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Đơn hàng, lô hàng và vận hành kho toàn hệ thống — theo thời gian thực.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="size-10 rounded-xl bg-white border-border shadow-sm hover:bg-slate-50 transition-all hover:scale-105 active:scale-95"
                onClick={() => refetch()}
                disabled={isRefetching}
              >
                <RefreshCcw className={cn("size-4 text-muted-foreground", isRefetching && "animate-spin")} />
              </Button>
            </div>
          </div>
        </section>

        {isError && (
          <Alert variant="destructive" className="rounded-xl border-destructive/20 bg-destructive/5">
            <AlertCircle className="size-4" />
            <AlertTitle>Không tải được dashboard kho</AlertTitle>
            <AlertDescription className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center">
              <span>{error instanceof Error ? error.message : 'Lỗi không xác định'}</span>
              <button
                type="button"
                className="font-medium underline underline-offset-4 hover:opacity-80"
                onClick={() => void refetch()}
              >
                Thử lại
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Content Section */}
        <div className="space-y-5">
          <InventoryKpiCards data={data} isLoading={isLoading} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
             <div className="lg:col-span-2">
                <InventoryCharts data={chartData} isLoading={isChartLoading} />
             </div>
             <div className="lg:col-span-1">
                <div className="h-full rounded-2xl border border-primary/15 bg-card flex flex-col shadow-sm transition-all hover:shadow-md overflow-hidden">
                   <div className="p-5 border-b border-border/50 flex items-center justify-between bg-primary/[0.02]">
                     <div className="flex items-center gap-2">
                       <Warehouse className="size-5 text-primary" />
                       <h3 className="font-semibold tracking-tight text-foreground">Nhà kho</h3>
                     </div>
                     <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                       {data?.activeWarehouses ?? 0} đang hoạt động
                     </span>
                   </div>
                   
                   <div className="flex-1 p-0 flex flex-col">
                     {!data?.warehousesList || data.warehousesList.length === 0 ? (
                       <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-2">
                         <div className="flex size-12 items-center justify-center rounded-full bg-muted/50">
                            <Warehouse className="size-6 text-muted-foreground/50" />
                         </div>
                         <p className="text-sm text-muted-foreground">Chưa có kho hàng nào</p>
                       </div>
                     ) : (
                        <div className="divide-y divide-border/50">
                          {data.warehousesList.map((warehouse) => {
                            const hasCapacity = warehouse.capacityKg != null && warehouse.capacityKg > 0;
                            const usagePercent = hasCapacity
                              ? Math.min(Math.round((warehouse.currentStock / warehouse.capacityKg!) * 100), 100)
                              : null;
                            const barColor = usagePercent === null
                              ? 'bg-primary/60'
                              : usagePercent >= 90
                                ? 'bg-red-500'
                                : usagePercent >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500';

                            return (
                              <div key={warehouse.id} className="p-4 hover:bg-muted/30 transition-colors flex items-start gap-3">
                                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                  <Warehouse className="size-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-foreground">{warehouse.name}</p>
                                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1 shrink-0">
                                      <Package className="size-3" />
                                      {warehouse.lotCount} lô
                                    </span>
                                    {warehouse.locationAddress && (
                                      <span className="flex items-center gap-1 truncate">
                                        <MapPin className="size-3 shrink-0" />
                                        <span className="truncate">{warehouse.locationAddress}</span>
                                      </span>
                                    )}
                                  </div>
                                  {/* Progress bar sức chứa */}
                                  <div className="mt-2.5">
                                    <div className="flex items-center justify-between text-[11px] mb-1">
                                      <span className="font-medium text-muted-foreground">
                                        {warehouse.currentStock.toLocaleString('vi-VN')} kg
                                        {hasCapacity && ` / ${warehouse.capacityKg!.toLocaleString('vi-VN')} kg`}
                                      </span>
                                      <span className={cn(
                                        "font-bold",
                                        usagePercent === null ? "text-primary" : usagePercent >= 90 ? "text-red-600" : usagePercent >= 70 ? "text-amber-600" : "text-emerald-600"
                                      )}>
                                        {usagePercent !== null ? `${usagePercent}%` : 'Không giới hạn'}
                                      </span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                                      <div
                                        className={cn("h-full rounded-full transition-all duration-500", barColor)}
                                        style={{ width: usagePercent !== null ? `${usagePercent}%` : '100%' }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                     )}
                   </div>
                   
                   <div className="p-4 border-t border-border/50 bg-muted/10 mt-auto">
                     <Button 
                       variant="outline" 
                       className="w-full h-9 rounded-xl border-primary/20 text-sm font-semibold text-primary hover:bg-primary/5"
                       onClick={() => navigate('/inventory/warehouses')}
                     >
                        Quản lý toàn bộ kho
                     </Button>
                   </div>
                </div>
             </div>
          </div>

          <InventoryActivityTable transactions={data?.recentTransactions} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
