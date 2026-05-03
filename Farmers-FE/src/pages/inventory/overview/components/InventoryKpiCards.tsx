import { Warehouse, Package, ArrowRightLeft, Clock } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardResponse } from '../api/types';

const kpiGridClass =
  'grid w-full gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,11rem),1fr))]';

export function InventoryKpiCards({
  data,
  isLoading,
}: {
  data: DashboardResponse | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className={kpiGridClass}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className={kpiGridClass}>
      <StatsCard
        icon={Warehouse}
        label="Nhà kho hoạt động"
        value={12}
        accentColor="primary"
      />
      <StatsCard
        icon={Package}
        label="Tổng tồn kho thực tế"
        value={data?.totalStockKg ?? 0}
        format="kg"
        accentColor="tertiary"
        changePercent={2.5}
      />
      <StatsCard
        icon={ArrowRightLeft}
        label="Giao dịch kho gần đây"
        value={data?.recentTransactions?.length ?? 0}
        accentColor="amber"
        changePercent={-1.2}
      />
      <StatsCard
        icon={Clock}
        label="Lô hàng sắp hết hạn"
        value={data?.expiringLots ?? 0}
        accentColor="rose"
      />
    </div>
  );
}
