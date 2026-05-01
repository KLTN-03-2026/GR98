export interface WarehouseTransaction {
  id: string;
  warehouseId: string;
  productId: string;
  inventoryLotId: string;
  type: 'inbound' | 'outbound' | 'adjustment';
  quantityKg: number;
  note: string | null;
  createdBy: string;
  createdAt: string;
  warehouse?: {
    id: string;
    name: string;
  };
  product?: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
  inventoryLot?: {
    id: string;
    qualityGrade: string;
  };
}

export interface CreateTransactionInput {
  warehouseId: string;
  productId: string;
  inventoryLotId: string;
  type: 'inbound' | 'outbound' | 'adjustment';
  quantityKg: number; // For outbound this will be sent as positive but backend handles signed logic
  note?: string;
  sourceLotId?: string;
}

export interface TransactionFilters {
  warehouseId?: string;
  type?: string;
  productId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface ReceiveHarvestInput {
  dailyReportId: string;
  contractId: string;
  warehouseId: string;
  actualWeight: number;
  qualityGrade: string;
  justification?: string;
  note?: string;
}
