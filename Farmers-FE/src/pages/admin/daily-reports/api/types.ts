import type { ApiSuccessResponse } from '@/client/lib/api-client';

export type DailyReportStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEWED';
export type DailyReportType = 'ROUTINE' | 'INCIDENT';

export interface DailyReportPlotSummary {
  id: string;
  plotCode: string;
  cropType: string;
  areaHa: number;
  farmer: {
    id: string;
    fullName: string;
    phone: string;
  };
}

export interface DailyReportSupervisorSummary {
  id: string;
  user: {
    fullName: string;
    phone: string | null;
  };
}

export interface DailyReportResponse {
  id: string;
  supervisorId: string;
  plotId: string;
  adminId: string;
  type: DailyReportType;
  content: string;
  imageUrls: string[];
  isSynced: boolean;
  reportedAt: string;
  syncedAt: string | null;
  status: DailyReportStatus;
  aiVisionResult: unknown;
  yieldEstimateKg: number | null;
  plot: DailyReportPlotSummary;
  supervisor: DailyReportSupervisorSummary;
}

export interface PaginatedDailyReportsResponse {
  data: DailyReportResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  meta?: {
    totalYield: number;
  };
}

export interface CreateDailyReportPayload {
  plotId: string;
  type?: DailyReportType;
  content?: string;
  imageUrls?: string[];
  yieldEstimateKg?: number;
}

export interface UpdateDailyReportPayload {
  type?: DailyReportType;
  content?: string;
  imageUrls?: string[];
  yieldEstimateKg?: number;
}

export type { ApiSuccessResponse };
