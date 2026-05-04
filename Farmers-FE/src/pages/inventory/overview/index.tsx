import { useState } from 'react';
import { LayoutDashboard, RefreshCcw, Warehouse, Package, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useInventoryDashboard, useInventoryChartData } from './api';
import { cn } from '@/lib/utils';

// New Components
import { InventoryKpiCards } from './components/InventoryKpiCards';
import { InventoryCharts } from './components/InventoryCharts';
import { InventoryActivityTable } from './components/InventoryActivityTable';

export default function InventoryOverviewPage() {
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
                <div className="h-full rounded-2xl border border-primary/15 bg-gradient-to-b from-card to-primary/[0.03] p-6 shadow-sm flex flex-col items-center justify-center text-center gap-4 transition-all hover:shadow-md dark:to-primary/[0.06]">
                   <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm shadow-primary/5">
                      <Warehouse className="size-8" />
                   </div>
                   <div className="space-y-1">
                      <h3 className="text-lg font-semibold tracking-tight text-foreground">Hệ thống Nhà kho</h3>
                      <p className="text-sm text-muted-foreground max-w-[200px]">Giám sát trạng thái hoạt động và phân bổ nguồn lực tại các chi nhánh.</p>
                   </div>
                   <Button variant="outline" className="h-9 rounded-full border-primary/20 px-6 text-sm font-semibold text-primary hover:bg-primary/5">
                      Xem danh sách kho
                   </Button>
                </div>
             </div>
          </div>

          <InventoryActivityTable transactions={data?.recentTransactions} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
