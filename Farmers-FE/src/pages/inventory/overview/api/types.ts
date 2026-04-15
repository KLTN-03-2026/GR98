export interface TransactionResponse {
  id: string;
  warehouseId: string;
  productId: string;
  inventoryLotId: string;
  type: 'inbound' | 'outbound' | 'adjustment';
  quantityKg: number;
  note: string | null;
  createdBy: string;
  createdAt: string;
  warehouse: { id: string; name: string };
  product: { id: string; name: string };
}

export interface PendingOrderResponse {
  id: string;
  orderCode: string;
  total: number;
  fulfillStatus: string;
  paymentStatus: string;
  orderedAt: string;
  client: { user: { fullName: string } } | null;
  shippingAddrText: string | null;
}

export interface DashboardResponse {
  totalStockKg: number;
  pendingOrders: number;
  expiringLots: number;
  stagnantLots: number;
  recentTransactions: TransactionResponse[];
  pendingOrdersList: PendingOrderResponse[];
}

export interface ChartDataResponse {
  labels: string[];
  inbound: number[];
  outbound: number[];
  adjustment: number[];
}
