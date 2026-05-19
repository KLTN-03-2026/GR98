/**
 * Types khớp với DiseaseHeatmapDto từ BE (Farmer-BE/src/dashboard/dashboard.types.ts).
 */

export type HeatmapSeverity = 'none' | 'light' | 'medium' | 'severe';
export type HeatmapAlertLevel = 'low' | 'medium' | 'high';

export interface HeatmapPoint {
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
  infectionRate: number;
  severity: HeatmapSeverity;
  topDisease: string | null;
  diseaseBreakdown: { name: string; count: number; category: string | null }[];
  lastScanAt: string | null;
  weight: number;
}

export interface HeatmapProvinceStat {
  province: string;
  totalPlots: number;
  infectedPlots: number;
  infectionRate: number;
  alertLevel: HeatmapAlertLevel;
  topDisease: string | null;
  trendPct: number | null;
}

export interface HeatmapTopDisease {
  name: string;
  count: number;
  category: string | null;
  trendPct: number | null;
  trendingProvinces: string[];
}

export interface HeatmapSummary {
  totalPlots: number;
  infectedPlots: number;
  avgInfectionRate: number;
  alertLevel: HeatmapAlertLevel;
  estimatedYieldLossPct: number;
  topDiseases: HeatmapTopDisease[];
  provinces: HeatmapProvinceStat[];
  windowFrom: string;
  windowTo: string;
}

export interface DiseaseHeatmapResponse {
  scope: 'global' | 'supervisor';
  points: HeatmapPoint[];
  summary: HeatmapSummary;
}

export interface DiseaseHeatmapQuery {
  from?: string;
  to?: string;
  cropType?: string;
  category?: string;
  minSeverity?: HeatmapSeverity;
  windowDays?: number;
}
