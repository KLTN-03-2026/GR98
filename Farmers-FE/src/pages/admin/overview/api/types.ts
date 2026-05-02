export type AdminDashboardKpi = {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  changePercent: number | null;
  format?: 'number' | 'currency';
};

export type AdminDashboardSection = {
  id: string;
  title: string;
  cards: AdminDashboardKpi[];
};

export type AdminDashboardTimePoint = {
  date: string;
  orders: number;
  revenue: number;
  contracts: number;
};

export type AdminDashboardStatusSlice = {
  key: string;
  label: string;
  count: number;
};

export type AdminDashboardActivity = {
  id: string;
  type: 'contract' | 'daily_report' | 'order';
  title: string;
  subtitle: string | null;
  at: string;
  status: string;
  statusLabel: string;
  href: string | null;
};

export type AdminDashboardOverviewDto = {
  scope: 'global';
  sections: AdminDashboardSection[];
  timeseries: AdminDashboardTimePoint[];
  orderFulfillDistribution: AdminDashboardStatusSlice[];
  orderPaymentDistribution: AdminDashboardStatusSlice[];
  contractStatusDistribution: AdminDashboardStatusSlice[];
  recentActivity: AdminDashboardActivity[];
};

export type AdminOverviewRangePreset = '7d' | '14d' | '30d' | 'mtd';

export type AdminOverviewFilters = {
  rangePreset: AdminOverviewRangePreset;
  from?: string;
  to?: string;
};
