import { apiGet, apiPost, apiPatch } from '@/client/lib/api-client';
import type {
  OrderResponse,
  PaginatedOrdersResponse,
  CreateOrderPayload,
  UpdateOrderPayload,
  CancelOrderPayload,
} from './types';

// ============================================================
// ORDER API ENDPOINTS
// ============================================================
export const orderApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    paymentStatus?: string;
    fulfillStatus?: string;
    paymentMethod?: string;
    myOrders?: string;
    fromDate?: string;
    toDate?: string;
  }) => apiGet<PaginatedOrdersResponse>('/orders', { params }),

  getById: (orderId: string) =>
    apiGet<OrderResponse>(`/orders/${orderId}`),

  create: (data: CreateOrderPayload) =>
    apiPost<OrderResponse>('/orders', data),

  update: (orderId: string, data: UpdateOrderPayload) =>
    apiPatch<OrderResponse>(`/orders/${orderId}`, data),

  cancel: (orderId: string, data?: CancelOrderPayload) =>
    apiPost<OrderResponse>(`/orders/${orderId}/cancel`, data ?? {}),

  // ─── State machine (Admin/Supervisor/Inventory/Shipper) ───
  confirmPacking: (orderId: string, note?: string) =>
    apiPost<OrderResponse>(`/orders/${orderId}/confirm`, { note }),

  assignShipper: (orderId: string, shipperId: string) =>
    apiPost<OrderResponse>(`/orders/${orderId}/assign-shipper`, { shipperId }),

  markDelivered: (
    orderId: string,
    data?: { deliveryProofUrl?: string; note?: string },
  ) => apiPost<OrderResponse>(`/orders/${orderId}/deliver`, data ?? {}),

  adminCancel: (orderId: string, reason?: string) =>
    apiPost<OrderResponse>(`/orders/${orderId}/admin-cancel`, { reason }),
};
