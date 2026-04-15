import { useQuery } from '@tanstack/react-query';
import { extractData } from '@/client/lib/api-client';
import { supplyDemandApi } from './api';
import type { SupplyDemandFilters, SupplyDemandResponse } from './types';

export const supplyDemandKeys = {
  all: ['supply-demand'] as const,
  list: (filters: SupplyDemandFilters) =>
    [...supplyDemandKeys.all, 'list', filters] as const,
};

export const useSupplyDemand = (filters: SupplyDemandFilters) => {
  return useQuery({
    queryKey: supplyDemandKeys.list(filters),
    queryFn: async () => {
      const response = await supplyDemandApi.getSupplyDemand(filters);
      return extractData<SupplyDemandResponse>(response);
    },
  });
};
