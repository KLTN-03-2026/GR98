import { apiPost, apiPatch, apiDelete } from '@/client/lib/api-client';
import type { ShippingAddressApi, CreateShippingAddressPayload } from './types';

// ============================================================
// PROFILE API (địa chỉ giao hàng — /profile/*)
// ============================================================
export const profileApi = {
  createAddress: (data: CreateShippingAddressPayload) =>
    apiPost<ShippingAddressApi>('/profile/addresses', data),

  updateAddress: (id: string, data: Partial<CreateShippingAddressPayload>) =>
    apiPatch<ShippingAddressApi>(`/profile/addresses/${id}`, data),

  deleteAddress: (id: string) =>
    apiDelete<{ id: string; deletedAt: string }>(`/profile/addresses/${id}`),

  setDefaultAddress: (id: string) =>
    apiPatch<{ id: string; isDefault: boolean }>(`/profile/addresses/${id}/set-default`, {}),
};
