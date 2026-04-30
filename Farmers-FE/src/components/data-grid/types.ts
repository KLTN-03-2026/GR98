import type React from "react";

export type DataGridSearchConfig = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  disabled?: boolean;
  hidden?: boolean;
};

export type DataGridToolbarConfig = {
  search?: DataGridSearchConfig;
  filters?: React.ReactNode;
  summary?: React.ReactNode;
  customActions?: React.ReactNode;
  quickStats?: React.ReactNode;
  onRefresh?: () => void;
  onResetFilters?: () => void;
  /**
   * @deprecated Dùng `onRefresh` thay thế.
   * Giữ lại để tương thích các page cũ.
   */
  onReload?: () => void;
  onExport?: () => void;
};

export type DataGridPaginationConfig = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
};

export type DataGridPaginationState = {
  pageIndex: number;
  pageSize: number;
};

export type DataGridState = {
  pagination?: DataGridPaginationState;
  keyword?: string;
};

export type DataGridLayoutConfig = {
  minCardWidth?: number;
  gapClassName?: string;
  cardContainerClassName?: string;
  itemWrapperClassName?: string;
  equalHeightCards?: boolean;
};

export type DataGridEmptyState = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
};

export type DataGridSkeletonConfig = {
  count?: number;
  renderSkeletonCard?: (index: number) => React.ReactNode;
};

export type DataGridClassNames = {
  root?: string;
  header?: string;
  toolbar?: string;
  toolbarShell?: string;
  content?: string;
  gridScroll?: string;
  grid?: string;
  pagination?: string;
};

export type DataGridAppearance = "management" | "plain";

export type DataGridProps<TItem> = {
  items?: TItem[];
  data?: TItem[];
  renderCard: (item: TItem, index: number) => React.ReactNode;
  keyExtractor: (item: TItem, index: number) => string;
  title?: string;
  /** Icon Lucide hoặc node — hiển thị trong ô bo góc cạnh tiêu đề (cùng pattern trang kho). */
  titleIcon?: React.ReactNode;
  description?: string;
  isLoading?: boolean;
  /**
   * Đang chờ response cho bộ filter/query hiện tại (vd. `isPlaceholderData` từ React Query).
   * Hiện skeleton lưới nhưng không khóa ô tìm kiếm trên toolbar.
   */
  isAwaitingResults?: boolean;
  error?: React.ReactNode;
  onRetry?: () => void;
  toolbar?: DataGridToolbarConfig;
  pagination?: DataGridPaginationConfig;
  totalItems?: number;
  pageCount?: number;
  pageSizeOptions?: number[];
  manualPagination?: boolean;
  manualFiltering?: boolean;
  state?: DataGridState;
  initialState?: Partial<DataGridState>;
  onPaginationChange?: (next: DataGridPaginationState) => void;
  onSearchChange?: (keyword: string) => void;
  resetPageOnSearchChange?: boolean;
  autoClampPageIndex?: boolean;
  searchFn?: (item: TItem, keyword: string) => boolean;
  filterFn?: (item: TItem) => boolean;
  layout?: DataGridLayoutConfig;
  skeleton?: DataGridSkeletonConfig;
  emptyState?: DataGridEmptyState;
  classNames?: DataGridClassNames;
  appearance?: DataGridAppearance;
};
