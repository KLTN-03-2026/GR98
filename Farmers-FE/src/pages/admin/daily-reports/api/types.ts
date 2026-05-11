import type { ApiSuccessResponse } from '@/client/lib/api-client';

export type DailyReportStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'REJECTED';
export type DailyReportType = 'ROUTINE' | 'INCIDENT' | 'HARVEST';
export type IncidentHandlingStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';

export const INCIDENT_HANDLING_LABEL: Record<IncidentHandlingStatus, string> = {
  PENDING: 'Chờ xử lý',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã xử lý xong',
};

export interface DailyReportPlotSummary {
  id: string;
  plotCode: string;
  cropType: string;
  areaHa: number;
  contracts: Array<{
    id: string;
    contractNo: string;
    grade: string;
    product: {
      id: string;
      name: string;
    };
  }>;
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
  /** Trạng thái xử lý sự cố (chỉ có với type=INCIDENT đã gửi). */
  incidentHandlingStatus: IncidentHandlingStatus | null;
  incidentHandlingNote: string | null;
  incidentHandledAt: string | null;
  plot: DailyReportPlotSummary;
  supervisor: DailyReportSupervisorSummary;
}

export interface UpdateIncidentHandlingPayload {
  status: IncidentHandlingStatus;
  note?: string;
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
