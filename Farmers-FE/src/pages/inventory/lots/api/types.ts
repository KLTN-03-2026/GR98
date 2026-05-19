/**
 * Unified grade system — dùng chung cho contract + inventory + product.
 * A/B/C giữ lại để hỗ trợ data legacy (BE map tự động khi hiển thị).
 */
export type QualityGrade =
  | 'PREMIUM'
  | 'STANDARD'
  | 'ECONOMY'
  | 'REJECT'
  | 'A'  // legacy → tương đương PREMIUM
  | 'B'  // legacy → tương đương STANDARD
  | 'C'; // legacy → tương đương ECONOMY
export type InventoryLotStatus = 'SCHEDULED' | 'ARRIVED' | 'RECEIVED' | 'REJECTED';

export interface InventoryLot {
  id: string;
  warehouseId: string;
  productId: string;
  contractId?: string;
  quantityKg: number;
  qualityGrade: QualityGrade;
  harvestDate?: string;
  expiryDate?: string;
  status: InventoryLotStatus;
  createdAt: string;
  updatedAt: string;
  
  // Virtual fields from BE
  initialWeight?: number;
  isUpcoming?: boolean;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  statusLabel?: string;

  // Relations
  warehouse: {
    id: string;
    name: string;
    locationAddress?: string;
  };
  product: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    /** Trạng thái Product (DRAFT mới sync grade theo Lot) */
    status?: 'DRAFT' | 'PUBLISHED' | 'OUT_OF_STOCK' | 'ARCHIVED';
    grade?: QualityGrade;
  };
  contract?: {
    id: string;
    contractNo: string;
    farmer: {
      fullName: string;
      phone: string;
    };
    plot: {
      plotCode: string;
      cropType: string;
      zone: {
        name: string;
      };
    };
  };
}

export type TransactionType = 'INBOUND' | 'OUTBOUND' | 'ADJUSTMENT' | 'TRANSFER';

export type TransactionAction = 
  | 'RECEIPT' 
  | 'REJECTION' 
  | 'GRADE_UPDATE' 
  | 'WEIGHT_ADJUST' 
  | 'EXPIRY_UPDATE' 
  | 'INTERNAL_TRANSFER' 
  | 'SALE' 
  | 'OTHER';

export interface LotTransaction {
  id: string;
  type: TransactionType;
  action: TransactionAction;
  quantityKg: number;
  note?: string;
  createdAt: string;
  warehouse: { name: string };
  product: { name: string };
}

export interface CreateLotInput {
  warehouseId: string;
  productId: string;
  contractId?: string;
  quantityKg: number;
  qualityGrade: QualityGrade;
  harvestDate?: string;
  expiryDate?: string;
  reportId?: string;
}

export interface UpdateLotInput {
  qualityGrade?: QualityGrade;
  harvestDate?: string;
  expiryDate?: string;
  note?: string;
  reason?: string;
}

export interface LotTrace extends InventoryLot {
  transactions: LotTransaction[];
}

export interface PendingHarvest {
  id: string;
  plotId: string;
  yieldEstimateKg: number;
  reportedAt: string;
  plot: {
    plotCode: string;
    farmer: {
      fullName: string;
    };
    contracts: Array<{
      id: string;
      product: {
        id: string;
        name: string;
      };
    }>;
  };
  supervisor: {
    user: {
      fullName: string;
    };
  };
}

export interface GetLotsFilters {
  warehouseId?: string;
  productId?: string;
  qualityGrade?: QualityGrade;
  status?: 'upcoming' | 'in-stock' | 'empty';
  expiryStatus?: 'expiring-soon' | 'expired';
  contractId?: string;
}

export interface ConfirmReceiptInput {
  lotId: string;
  actualWeight: number;
  note?: string;
}
