export interface SupplyDemandItem {
  cropType: string;
  expectedKg: number;
  actualStockKg: number;
  pendingOrderKg: number;
}

export interface ChartData {
  labels: string[];
  expected: number[];
  stock: number[];
  pending: number[];
}

export interface SupplyDemandResponse {
  items: SupplyDemandItem[];
  chartData: ChartData;
}

export interface SupplyDemandFilters {
  cropType?: string;
  fromDate?: string;
  toDate?: string;
}
