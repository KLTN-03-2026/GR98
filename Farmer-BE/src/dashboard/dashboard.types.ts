export type DashboardScope = 'global' | 'supervisor';

export type DashboardKpi = {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  /** null khi không so sánh được (vd. tháng trước = 0) */
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
  /** Chỉ phạm vi supervisor: số lô phụ trách chưa có báo cáo SUBMITTED/REVIEWED trong ngày (theo giờ máy chủ). */
  missingDailyReportsToday?: number;
  /** Chỉ supervisor: phân bổ báo cáo theo trạng thái trong kỳ đã chọn. */
  dailyReportStatusDistribution?: DashboardStatusSlice[];
};

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

export type AdminDashboardTimeseriesPoint = {
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
  type: 'order' | 'contract' | 'daily_report';
  title: string;
  subtitle: string | null;
  at: string;
  status: string;
  statusLabel: string;
  href: string;
};

export type AdminDashboardOverviewDto = {
  scope: 'global';
  sections: AdminDashboardSection[];
  timeseries: AdminDashboardTimeseriesPoint[];
  orderFulfillDistribution: AdminDashboardStatusSlice[];
  orderPaymentDistribution: AdminDashboardStatusSlice[];
  contractStatusDistribution: AdminDashboardStatusSlice[];
  recentActivity: AdminDashboardActivity[];
};
