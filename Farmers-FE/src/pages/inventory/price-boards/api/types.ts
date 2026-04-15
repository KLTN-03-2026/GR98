export interface PriceBoardResponse {
  id: string;
  cropType: string;
  grade: 'A' | 'B' | 'C' | 'REJECT';
  buyPrice: number;
  sellPrice: number;
  effectiveDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  admin?: {
    id: string;
    businessName: string;
    province: string;
  };
}

export interface PaginatedPriceBoardsResponse {
  data: PriceBoardResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
