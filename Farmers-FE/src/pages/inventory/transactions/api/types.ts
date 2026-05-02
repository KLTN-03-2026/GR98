export type TransactionType = 'inbound' | 'outbound' | 'adjustment';

export interface WarehouseTransaction {
  id: string;
  warehouseId: string;
  productId: string;
  inventoryLotId: string | null;
  type: TransactionType;
  quantityKg: number;
  note: string | null;
  createdAt: string;
  warehouse: {
    name: string;
  };
  product: {
    name: string;
    sku: string;
    unit: string;
  };
  inventoryLot?: {
    id: string;
  } | null;
  actor?: {
    fullName: string;
  };
  createdBy?: string;
}

export interface CreateTransactionInput {
  warehouseId: string;
  productId: string;
  inventoryLotId?: string;
  type: TransactionType;
  quantityKg: number;
  note?: string;
  targetWarehouseId?: string;
  isTransfer?: boolean;
}

export interface TransactionFilters {
  warehouseId?: string;
  type?: string;
  productId?: string;
  fromDate?: string;
  toDate?: string;
  inventoryLotId?: string;
  noteSearch?: string;
}
