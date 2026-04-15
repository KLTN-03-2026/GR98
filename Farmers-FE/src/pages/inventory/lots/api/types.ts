import type { QualityGrade } from '../../warehouses/api/types';

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

export interface LotTransaction {
  id: string;
  type: string;
  quantityKg: number;
  createdAt: string;
  note: string | null;
}

export interface LotContract {
  id: string;
  contractNo: string;
  farmer: {
    id: string;
    fullName: string;
    phone: string;
  };
  plot: {
    id: string;
    plotCode: string;
    cropType: string;
    zone: {
      id: string;
      name: string;
    };
  };
}

export interface LotTrace extends InventoryLot {
  transactions: LotTransaction[];
  contract?: {
    id: string;
    contractNo: string;
    farmer: {
      id: string;
      fullName: string;
      phone: string;
    };
    plot: {
      id: string;
      plotCode: string;
      cropType: string;
      zone: {
        id: string;
        name: string;
      };
    };
  };
}

export interface CreateLotInput {
  warehouseId: string;
  productId: string;
  contractId?: string;
  quantityKg: number;
  harvestDate: string;
  expiryDate?: string;
  qualityGrade: QualityGrade;
  note?: string;
}
