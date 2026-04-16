import { useQuery } from '@tanstack/react-query';
import { extractData } from '@/client/lib/api-client';
import { plotApi } from '@/pages/admin/plots/api';
import type { PaginatedPlotsResponse, PlotCropType } from './types';

export function useSupervisorPlots(params: {
  supervisorProfileId: string;
  page?: number;
  limit?: number;
  search?: string;
  cropType?: PlotCropType;
  enabled?: boolean;
}) {
  const {
    supervisorProfileId,
    enabled = true,
    ...queryParams
  } = params;

  return useQuery({
    queryKey: ['supervisor-plots', supervisorProfileId, queryParams],
    enabled: enabled && Boolean(supervisorProfileId),
    queryFn: async () => {
      const response = await plotApi.list({
        ...queryParams,
        id_suppervisor: supervisorProfileId,
      });
      return extractData<PaginatedPlotsResponse>(response);
    },
    placeholderData: (prev) => prev,
  });
}
