export type DashboardScope = 'global' | 'supervisor';

export type DashboardKpi = {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  changePercent: number | null;
};

export type DashboardTimePoint = {
  date: string;
  value: number;
};

export type DashboardStatusSlice = {
  status: string;
  label: string;
  count: number;
};

export type DashboardActivityType = 'contract' | 'daily_report' | 'order';

export type DashboardActivity = {
  id: string;
  type: DashboardActivityType;
  title: string;
  subtitle: string | null;
  at: string;
  status: string;
  statusLabel: string;
  href: string | null;
};

export type DashboardOverviewDto = {
  scope: DashboardScope;
  kpis: DashboardKpi[];
  timeseries: DashboardTimePoint[];
  statusDistribution: DashboardStatusSlice[];
  recentActivity: DashboardActivity[];
  /** Số lô chưa có báo cáo đã gửi/duyệt trong ngày (theo máy chủ). */
  missingDailyReportsToday?: number;
  /** Phân bổ báo cáo theo trạng thái trong kỳ. */
  dailyReportStatusDistribution?: DashboardStatusSlice[];
};

export type SupervisorOverviewRangePreset = '7d' | '14d' | '30d' | 'mtd';

export type SupervisorOverviewFilters = {
  rangePreset: SupervisorOverviewRangePreset;
  from?: string;
  to?: string;
};