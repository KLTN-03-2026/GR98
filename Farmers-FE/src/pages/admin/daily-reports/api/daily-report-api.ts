import {
  apiGet,
  apiPatch,
  apiPost,
  type ApiSuccessResponse,
} from '@/client/lib/api-client';
import type {
  CreateDailyReportPayload,
  DailyReportResponse,
  DailyReportStatus,
  DailyReportType,
  IncidentHandlingStatus,
  PaginatedDailyReportsResponse,
  UpdateDailyReportPayload,
  UpdateIncidentHandlingPayload,
} from './types';

const longTimeout = { timeout: 120_000 as const };

export const dailyReportApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    status?: DailyReportStatus;
    type?: DailyReportType;
    supervisorId?: string;
    plotId?: string;
    from?: string;
    to?: string;
    search?: string;
    isHarvest?: string;
    incidentHandlingStatus?: IncidentHandlingStatus;
  }) =>
    apiGet<ApiSuccessResponse<PaginatedDailyReportsResponse>>('/daily-reports', { params }),

  getById: (id: string) =>
    apiGet<ApiSuccessResponse<DailyReportResponse>>(`/daily-reports/${id}`),

  create: (data: CreateDailyReportPayload) =>
    apiPost<ApiSuccessResponse<DailyReportResponse>>('/daily-reports', data, longTimeout),

  update: (id: string, data: UpdateDailyReportPayload) =>
    apiPatch<ApiSuccessResponse<DailyReportResponse>>(`/daily-reports/${id}`, data, longTimeout),

  submit: (id: string) =>
    apiPost<ApiSuccessResponse<DailyReportResponse>>(`/daily-reports/${id}/submit`, {}, longTimeout),

  review: (id: string, status: 'APPROVED' | 'REJECTED') =>
    apiPatch<ApiSuccessResponse<DailyReportResponse>>(
      `/daily-reports/${id}/review`,
      { status },
      longTimeout,
    ),

  updateIncidentHandling: (id: string, payload: UpdateIncidentHandlingPayload) =>
    apiPatch<ApiSuccessResponse<DailyReportResponse>>(
      `/daily-reports/${id}/incident-handling`,
      payload,
      longTimeout,
    ),
};
