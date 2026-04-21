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
  PaginatedDailyReportsResponse,
  UpdateDailyReportPayload,
} from './types';

const longTimeout = { timeout: 120_000 as const };

export const dailyReportApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    status?: DailyReportStatus;
    supervisorId?: string;
    plotId?: string;
    from?: string;
    to?: string;
    search?: string;
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
};
