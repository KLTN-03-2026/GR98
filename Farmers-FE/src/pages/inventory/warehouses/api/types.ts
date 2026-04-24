export type QualityGrade = 'A' | 'B' | 'C' | 'REJECT';

export interface Warehouse {
  id: string;
  name: string;
  locationAddress: string | null;
  isActive: boolean;
  /** Số bản ghi InventoryLot (lô hàng tồn kho) của kho — không phải lô đất / số phiếu giao dịch. */
  lotCount: number;
  createdAt: string;
  /** Có trên API khi gọi bằng tài khoản admin (danh sách đầy đủ + gán NV) */
  managedBy?: string | null;
  managerFullName?: string | null;
  managerEmployeeCode?: string | null;
}

export interface InventoryLot {
  id: string;
  warehouseId: string;
  productId: string;
  contractId: string | null;
  quantityKg: number;
  harvestDate: string | null;
  expiryDate: string | null;
  qualityGrade: QualityGrade;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
}

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
  product: {
    id: string;
    name: string;
  };
}

export interface WarehouseDetail extends Warehouse {
  inventoryLots: InventoryLot[];
  transactions: WarehouseTransaction[];
}
