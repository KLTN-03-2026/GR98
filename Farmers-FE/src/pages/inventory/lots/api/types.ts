export type QualityGrade = 'A' | 'B' | 'C' | 'REJECT';

export interface InventoryLot {
  id: string;
  warehouseId: string;
  productId: string;
  contractId?: string;
  quantityKg: number;
  qualityGrade: QualityGrade;
  harvestDate?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
  
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

export interface LotTransaction {
  id: string;
  type: 'receive' | 'inbound' | 'outbound' | 'adjustment' | 'transfer';
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

export interface GetLotsFilters {
  warehouseId?: string;
  productId?: string;
  qualityGrade?: QualityGrade;
}
