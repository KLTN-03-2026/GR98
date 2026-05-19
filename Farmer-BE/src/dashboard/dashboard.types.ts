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

// ── Disease Heatmap (GIS) ───────────────────────────────────────────────────

export type DiseaseHeatmapPoint = {
  plotId: string;
  plotCode: string;
  farmerName: string;
  supervisorName: string | null;
  cropType: string;
  variety: string | null;
  province: string | null;
  district: string | null;
  lat: number;
  lng: number;
  areaHa: number;
  totalScans: number;
  infectedCount: number;
  /** 0..1 — tỉ lệ cây nhiễm trong phiên/lần quét gần nhất */
  infectionRate: number;
  severity: 'none' | 'light' | 'medium' | 'severe';
  topDisease: string | null;
  diseaseBreakdown: { name: string; count: number; category: string | null }[];
  lastScanAt: string | null;
  /** 0..1 — trọng số cho heatmap intensity (kết hợp infectionRate + severity + areaHa) */
  weight: number;
};

export type DiseaseHeatmapProvinceStat = {
  province: string;
  totalPlots: number;
  infectedPlots: number;
  infectionRate: number;
  alertLevel: 'low' | 'medium' | 'high';
  /** Bệnh phổ biến nhất ở tỉnh */
  topDisease: string | null;
  /** % thay đổi infection rate so với cùng kỳ trước (null khi không tính được) */
  trendPct: number | null;
};

export type DiseaseHeatmapTopDisease = {
  name: string;
  count: number;
  category: string | null;
  /** % thay đổi so với chu kỳ trước (null nếu thiếu data) */
  trendPct: number | null;
  /** Các tỉnh đang có ca tăng nhanh */
  trendingProvinces: string[];
};

export type DiseaseHeatmapSummary = {
  totalPlots: number;
  infectedPlots: number;
  avgInfectionRate: number;
  alertLevel: 'low' | 'medium' | 'high';
  /** Dự báo % thiệt hại sản lượng — heuristic */
  estimatedYieldLossPct: number;
  topDiseases: DiseaseHeatmapTopDisease[];
  provinces: DiseaseHeatmapProvinceStat[];
  windowFrom: string;
  windowTo: string;
};

export type DiseaseHeatmapDto = {
  scope: DashboardScope;
  points: DiseaseHeatmapPoint[];
  summary: DiseaseHeatmapSummary;
};
