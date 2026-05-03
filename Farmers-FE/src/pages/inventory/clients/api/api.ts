import { apiGet } from '@/client/lib/api-client';
import type { Client } from './hooks';

export const clientApi = {
  getClients: () => apiGet<Client[]>('/inventory/clients'),
};
