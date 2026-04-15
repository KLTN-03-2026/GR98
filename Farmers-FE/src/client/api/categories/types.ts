export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedCategoriesResponse {
  data: CategoryResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
}
