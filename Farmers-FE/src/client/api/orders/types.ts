export interface OrderItemResponse {
  id: string;
  productId: string;
  nameSnapshot: string;
  priceSnapshot: number;
  quantityKg: number;
  subtotal: number;
  product?: { id: string; imageUrls: string[]; thumbnailUrl: string | null };
}

export interface ShippingAddrResponse {
  fullName: string;
  phone: string;
  addressLine: string;
  district: string | null;
  province: string;
}

export interface ClientInfo {
  id: string;
  user: { fullName: string; email: string; phone: string | null };
}

export interface AdminInfo {
  id: string;
  businessName: string;
}

export interface OrderResponse {
  id: string;
  orderNo: string;
  orderCode: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod: 'COD' | 'VNPAY' | 'MOMO';
  paymentRef: string | null;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  fulfillStatus: 'PENDING' | 'PACKING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shippingAddr: ShippingAddrResponse;
  shippingAddrText: string | null;
  trackingCode: string | null;
  note: string | null;
  orderedAt: string;
  paidAt: string | null;
  orderItems: OrderItemResponse[];
  client?: ClientInfo;
  admin?: AdminInfo;
}

export interface PaginatedOrdersResponse {
  data: OrderResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateOrderPayload {
  items: Array<{ productId: string; quantityKg: number }>;
  shippingAddr: {
    fullName: string;
    phone: string;
    addressLine: string;
    district?: string;
    province: string;
  };
  paymentMethod: 'COD' | 'VNPAY' | 'MOMO';
  note?: string;
  savedAddressId?: string;
}

export interface UpdateOrderPayload {
  paymentStatus?: OrderResponse['paymentStatus'];
  fulfillStatus?: OrderResponse['fulfillStatus'];
  trackingCode?: string;
  note?: string;
}

export interface CancelOrderPayload {
  reason?: string;
}
