import { apiGet, type ApiSuccessResponse } from '@/client/lib/api-client';
import type { DiseaseHeatmapQuery, DiseaseHeatmapResponse } from './types';

export const diseaseHeatmapApi = {
  fetch: (params?: DiseaseHeatmapQuery) =>
    apiGet<ApiSuccessResponse<DiseaseHeatmapResponse>>(
      '/dashboard/disease-heatmap',
      { params },
    ),
};
