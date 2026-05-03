export type QualityGrade = 'A' | 'B' | 'C' | 'REJECT';
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
