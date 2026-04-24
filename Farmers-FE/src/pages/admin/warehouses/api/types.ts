import type {
  InventoryLot,
  WarehouseTransaction,
} from '@/pages/inventory/warehouses/api/types';

export interface AdminWarehouseRow {
  id: string;
  name: string;
  locationAddress: string | null;
  isActive: boolean;
  /**
   * Số **lô hàng kho** (bản ghi `InventoryLot` gắn `warehouseId`):
   * mỗi lô là một dòng tồn theo sản phẩm (số kg, phân hạng, ngày thu hoạch/hết hạn…)
   * đã nhập/ghi nhận trong kho này.
   *
   * **Không** phải số “lô đất” (plot) nông nghiệp, **không** phải số phiếu xuất/nhập.
   * Backend: `_count.inventoryLots` trên `Warehouse`.
   */
  lotCount: number;
  createdAt: string;
  managedBy: string | null;
  managerFullName: string | null;
  managerEmployeeCode: string | null;
}

export interface AdminWarehouseDetail {
  id: string;
  name: string;
  locationAddress: string | null;
  isActive: boolean;
  managedBy: string | null;
  createdAt: string;
  adminId: string;
  inventory: {
    id: string;
    employeeCode: string;
    user: { fullName: string; email: string };
  } | null;
  inventoryLots: InventoryLot[];
  transactions: WarehouseTransaction[];
}

export type CreateWarehousePayload = {
  name: string;
  locationAddress?: string;
  isActive?: boolean;
  managedBy?: string | null;
};

export type UpdateWarehousePayload = Partial<CreateWarehousePayload>;
