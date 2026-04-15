import { apiGet, apiPost, apiPatch, type ApiSuccessResponse } from '@/client/lib/api-client';
import type {
  PlotCropType,
  PlotResponse,
  PaginatedPlotsResponse,
  CreatePlotPayload,
  UpdatePlotPayload,
} from './types';

export const plotApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    cropType?: PlotCropType;
    id_suppervisor?: string;
  }) => apiGet<ApiSuccessResponse<PaginatedPlotsResponse>>('/plots', { params }),

  create: (data: CreatePlotPayload) =>
    apiPost<ApiSuccessResponse<PlotResponse>>('/plots', data),

  update: (id: string, data: UpdatePlotPayload) =>
    apiPatch<ApiSuccessResponse<PlotResponse>>(`/plots/${id}`, data),
};
