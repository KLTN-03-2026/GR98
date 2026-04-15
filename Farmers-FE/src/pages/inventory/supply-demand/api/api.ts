import { apiGet } from '@/client/lib/api-client';
import type { SupplyDemandResponse, SupplyDemandFilters } from './types';

export const supplyDemandApi = {
  getSupplyDemand: (params?: SupplyDemandFilters) =>
    apiGet<SupplyDemandResponse>('/inventory/supply-demand', { params }),
};
