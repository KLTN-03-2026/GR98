import apiClient from './apiClient';

export type ShipperOrderStatus = 'SHIPPED' | 'DELIVERED';

export interface ShipperOrder {
  id: string;
  orderNo: string;
  total: number;
  fulfillStatus: ShipperOrderStatus;
  paymentMethod?: 'COD' | 'VNPAY' | 'MOMO' | string;
  paymentStatus?: string;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  deliveryProofUrl?: string | null;
  shippingAddr: {
    fullName: string;
    phone: string;
    addressLine: string;
    district?: string | null;
    province: string;
  };
  orderItems: Array<{
    id: string;
    nameSnapshot: string;
    quantityKg: number;
    subtotal: number;
    product?: {
      imageUrls?: string[];
      thumbnailUrl?: string | null;
    } | null;
  }>;
}

interface UploadResult {
  url: string;
  publicId: string;
}

function unwrapData<T>(value: unknown): T {
  const wrapped = value as { data?: unknown };
  return (wrapped?.data ?? value) as T;
}

export async function fetchMyShipperOrders(
  status: ShipperOrderStatus,
): Promise<ShipperOrder[]> {
  const response = await apiClient.get('/shippers/me/orders', {
    params: { status },
  });
  return unwrapData<ShipperOrder[]>(response.data);
}

export async function markShipperOrderDelivered({
  orderId,
  deliveryProofUrl,
  note,
}: {
  orderId: string;
  deliveryProofUrl?: string;
  note?: string;
}): Promise<ShipperOrder> {
  const response = await apiClient.post(`/orders/${orderId}/deliver`, {
    deliveryProofUrl,
    note,
  });
  return unwrapData<ShipperOrder>(response.data);
}

export async function uploadDeliveryProof(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post(
    '/upload/image?folder=delivery-proofs',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return unwrapData<UploadResult>(response.data);
}

export async function updateShipperLocation(lat: number, lng: number) {
  const response = await apiClient.post('/shippers/me/location', { lat, lng });
  return unwrapData<{ ok: boolean }>(response.data);
}
