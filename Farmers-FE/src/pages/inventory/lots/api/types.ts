export type QualityGrade = 'A' | 'B' | 'C' | 'REJECT';

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
  warehouse: {
    id: string;
    name: string;
  };
  product: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
}

export interface LotTrace extends InventoryLot {
  transactions: any[];
  contract?: any;
}

export interface CreateLotInput {
  warehouseId: string;
  productId: string;
  contractId?: string;
  reportId?: string; // Liên kết với báo cáo thu hoạch
  quantityKg: number;
  harvestDate: string;
  expiryDate?: string;
  qualityGrade: QualityGrade;
  note?: string;
  deviationReason?: string;
}

export interface PendingHarvest {
  id: string;
  plotId: string;
  supervisorId: string;
  yieldEstimateKg: number;
  reportedAt: string;
  status: string;
  plot: {
    plotCode: string;
    cropType: string;
    farmer: {
      fullName: string;
    };
    contracts: {
      id: string;
      contractNo: string;
      product?: {
        id: string;
        name: string;
      };
    }[];
  };
  supervisor: {
    user: {
      fullName: string;
    };
  };
}
