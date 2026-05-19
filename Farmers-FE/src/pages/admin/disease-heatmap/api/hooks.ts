import { useQuery } from '@tanstack/react-query';
import { diseaseHeatmapApi } from './api';
import type { DiseaseHeatmapQuery, DiseaseHeatmapResponse } from './types';

export const useDiseaseHeatmap = (params?: DiseaseHeatmapQuery) => {
  return useQuery({
    queryKey: ['disease-heatmap', params],
    queryFn: async (): Promise<DiseaseHeatmapResponse> => {
      const res = await diseaseHeatmapApi.fetch(params);
      // BE wrap response: { success, data: ... }
      const body: any = res?.data ?? res;
      return body?.data ?? body;
    },
    refetchOnWindowFocus: false,
    staleTime: 60_000, // cache 1 phút
  });
};
