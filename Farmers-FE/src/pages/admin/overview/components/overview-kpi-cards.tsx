import {
  BadgeDollarSign,
  ClipboardList,
  FileText,
  PackageSearch,
  ShoppingCart,
  Store,
  UserCheck,
  Users,
  Warehouse,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminDashboardSection } from '../api/types';
import { StatsCard } from './stats-card';

const kpiGridClass =
  'grid w-full gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,11rem),1fr))]';

const iconMap: Record<string, typeof Users> = {
  contracts: FileText,
  orders_mtd: ShoppingCart,
  revenue_mtd: BadgeDollarSign,
  buyers_mtd: UserCheck,
  clients_total: Users,
  reports_mtd: ClipboardList,
  scans_mtd: PackageSearch,
  published_products: Store,
  active_warehouses: Warehouse,
  pending_reviews: FileText,
  contracts_mtd: FileText,
};

export function OverviewKpiCards({
  sections,
  isLoading,
}: {
  sections: AdminDashboardSection[] | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-48" />
        <div className={kpiGridClass}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`s1-${i}`} className="h-32 min-w-0 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-4 w-40" />
        <div className={kpiGridClass}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={`s2-${i}`} className="h-32 min-w-0 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!sections?.length) return null;

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <Card
          key={section.id}
          className="rounded-2xl border border-primary/15 bg-card shadow-sm dark:border-primary/20"
        >
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary">
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className={kpiGridClass}>
              {section.cards.map((kpi) => {
                const Icon = iconMap[kpi.id] ?? Users;
                return (
                  <StatsCard
                    key={kpi.id}
                    icon={Icon}
                    label={kpi.label}
                    value={kpi.value}
                    previousValue={kpi.previousValue}
                    changePercent={kpi.changePercent}
                    format={kpi.format}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
