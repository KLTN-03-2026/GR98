import { apiGet, apiPost, apiPatch, apiDelete } from '@/client/lib/api-client';

// ============================================================
// CART API ENDPOINTS
// ============================================================
export const cartApi = {
  get: () => apiGet<unknown>('/cart'),

  addItem: (data: { productId: string; quantityKg: number }) =>
    apiPost<unknown>('/cart/items', data),

  updateItem: (itemId: string, data: { quantityKg: number }) =>
    apiPatch<unknown>(`/cart/items/${itemId}`, data),

  removeItem: (itemId: string) =>
    apiDelete<unknown>(`/cart/items/${itemId}`),

  clear: () => apiDelete<unknown>('/cart'),
};
