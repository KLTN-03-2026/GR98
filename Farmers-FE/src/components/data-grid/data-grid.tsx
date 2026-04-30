import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataGridToolbar } from "./data-grid-toolbar";
import { DataGridPagination } from "./data-grid-pagination";
import { DataGridSkeleton } from "./data-grid-skeleton";
import type { DataGridPaginationConfig, DataGridProps } from "./types";

export function DataGrid<TItem>({
  items,
  data,
  renderCard,
  keyExtractor,
  title,
  titleIcon,
  description,
  isLoading = false,
  isAwaitingResults = false,
  error,
  onRetry,
  toolbar,
  pagination,
  totalItems,
  pageCount,
  pageSizeOptions,
  manualPagination = false,
  manualFiltering = false,
  state,
  initialState,
  onPaginationChange,
  onSearchChange,
  resetPageOnSearchChange = true,
  autoClampPageIndex = true,
  searchFn,
  filterFn,
  layout,
  skeleton,
  emptyState,
  classNames,
  appearance = "management",
}: DataGridProps<TItem>) {
  const sourceData = data ?? items ?? [];
  const initialPageIndex = initialState?.pagination?.pageIndex ?? 0;
  const initialPageSize = initialState?.pagination?.pageSize ?? pagination?.pageSize ?? 10;
  const initialKeyword = initialState?.keyword ?? toolbar?.search?.value ?? "";

  const [internalPagination, setInternalPagination] = useState({
    pageIndex: initialPageIndex,
    pageSize: initialPageSize,
  });
  const [internalKeyword, setInternalKeyword] = useState(initialKeyword);
  /** Chỉ reset trang khi từ khóa thực sự đổi — tránh gọi lặp do callback/search effect. */
  const lastSearchEmittedForPaginationRef = useRef<string | null>(null);

  const resolvedPaginationState = state?.pagination ?? internalPagination;
  const resolvedKeyword = state?.keyword ?? internalKeyword;
  const minCardWidth = layout?.minCardWidth ?? 280;
  const gapClassName = layout?.gapClassName ?? "gap-4";
  const equalHeightCards = layout?.equalHeightCards ?? false;
  const resolvedSkeletonCount =
    skeleton?.count ?? resolvedPaginationState.pageSize ?? pagination?.pageSize ?? 8;
  const useManagementAppearance = appearance === "management";
  const showGridSkeleton = isLoading || isAwaitingResults;

  const normalizedKeyword = resolvedKeyword.trim().toLowerCase();

  const defaultSearchFn = (item: TItem, keyword: string) => {
    if (!keyword) return true;
    return JSON.stringify(item).toLowerCase().includes(keyword);
  };

  const filteredItems = useMemo(() => {
    if (manualFiltering) return sourceData;
    return sourceData.filter((item) => {
      if (filterFn && !filterFn(item)) return false;
      return (searchFn ?? defaultSearchFn)(item, normalizedKeyword);
    });
  }, [manualFiltering, sourceData, filterFn, searchFn, normalizedKeyword]);

  const derivedTotalItems = manualPagination
    ? totalItems ?? pagination?.totalItems ?? sourceData.length
    : filteredItems.length;
  const derivedPageCount = manualPagination
    ? Math.max(1, pageCount ?? pagination?.totalPages ?? Math.ceil(derivedTotalItems / resolvedPaginationState.pageSize))
    : Math.max(1, Math.ceil(derivedTotalItems / Math.max(1, resolvedPaginationState.pageSize)));

  const maxPageIndex = Math.max(0, derivedPageCount - 1);
  const safePageIndex = Math.min(Math.max(0, resolvedPaginationState.pageIndex), maxPageIndex);

  useEffect(() => {
    if (!autoClampPageIndex || safePageIndex === resolvedPaginationState.pageIndex) return;
    if (state?.pagination && onPaginationChange) {
      onPaginationChange({ ...resolvedPaginationState, pageIndex: safePageIndex });
      return;
    }
    setInternalPagination((prev) => ({ ...prev, pageIndex: safePageIndex }));
  }, [
    autoClampPageIndex,
    onPaginationChange,
    resolvedPaginationState,
    safePageIndex,
    state?.pagination,
  ]);

  const pageItems = useMemo(() => {
    if (manualPagination) return sourceData;
    const start = safePageIndex * resolvedPaginationState.pageSize;
    const end = start + resolvedPaginationState.pageSize;
    return filteredItems.slice(start, end);
  }, [manualPagination, sourceData, safePageIndex, resolvedPaginationState.pageSize, filteredItems]);

  const handleSearchChange = (value: string) => {
    onSearchChange?.(value);
    if (state?.keyword === undefined) {
      setInternalKeyword(value);
    }
    const trimmedForCompare = value.trim();
    if (resetPageOnSearchChange) {
      if (lastSearchEmittedForPaginationRef.current !== trimmedForCompare) {
        lastSearchEmittedForPaginationRef.current = trimmedForCompare;
        const next = { ...resolvedPaginationState, pageIndex: 0 };
        onPaginationChange?.(next);
        if (!state?.pagination) {
          setInternalPagination(next);
        }
      }
    }
    toolbar?.search?.onChange?.(value);
  };

  const handlePageChange = (page: number) => {
    const next = { ...resolvedPaginationState, pageIndex: Math.max(0, page - 1) };
    onPaginationChange?.(next);
    if (!state?.pagination) setInternalPagination(next);
    pagination?.onPageChange?.(Math.max(1, page));
  };

  const handlePageSizeChange = (nextPageSize: number) => {
    const next = { pageIndex: 0, pageSize: nextPageSize };
    onPaginationChange?.(next);
    if (!state?.pagination) setInternalPagination(next);
    pagination?.onPageSizeChange?.(nextPageSize);
  };

  const shouldShowPagination =
    Boolean(pagination) ||
    Boolean(manualPagination) ||
    totalItems !== undefined ||
    pageCount !== undefined;

  const resolvedPaginationConfig: DataGridPaginationConfig | undefined =
    shouldShowPagination
      ? {
          page: safePageIndex + 1,
          pageSize: resolvedPaginationState.pageSize,
          totalItems: derivedTotalItems,
          totalPages: derivedPageCount,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
          pageSizeOptions: pageSizeOptions ?? pagination?.pageSizeOptions ?? [10, 20, 30, 50, 100],
        }
      : undefined;

  const resolvedToolbar = toolbar
    ? {
        ...toolbar,
        search: toolbar.search
          ? {
              ...toolbar.search,
              value: resolvedKeyword,
              onChange: handleSearchChange,
            }
          : undefined,
      }
    : undefined;

  return (
    <div
      className={cn(
        "h-full min-h-0 flex flex-col",
        useManagementAppearance ? "gap-4 p-4 sm:gap-5 sm:p-6" : "gap-3",
        classNames?.root,
      )}
    >
      {(title || description) && (
        <div className={cn("space-y-1", classNames?.header)}>
          {title && (
            <div className="flex items-center gap-2">
              {titleIcon && (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/12 bg-primary/8">
                  {titleIcon}
                </div>
              )}
              <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            </div>
          )}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}

      {resolvedToolbar && (
        <Card
          className={cn(
            useManagementAppearance && "border-dashed border-primary/40",
            classNames?.toolbarShell,
          )}
        >
          <CardContent className={cn(useManagementAppearance ? "p-3 sm:p-4" : "p-3")}>
            <DataGridToolbar
              config={resolvedToolbar}
              isLoading={isLoading}
              isAwaitingResults={isAwaitingResults}
              className={classNames?.toolbar}
            />
          </CardContent>
        </Card>
      )}

      <div className={cn("min-h-0 flex-1 flex flex-col", classNames?.content)}>
        <div className={cn("min-h-0 flex-1 overflow-y-auto pr-1", classNames?.gridScroll)}>
          {error ? (
            <Card>
              <CardContent className="flex items-center justify-center gap-2 py-10">
                <p className="text-sm text-destructive">{error}</p>
                {onRetry && (
                  <Button type="button" variant="ghost" size="sm" onClick={onRetry}>
                    Thử lại
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : showGridSkeleton ? (
            <DataGridSkeleton
              count={resolvedSkeletonCount}
              renderCard={skeleton?.renderSkeletonCard}
              minCardWidth={minCardWidth}
              gapClassName={gapClassName}
            />
          ) : pageItems.length === 0 ? (
            <Card>
              <CardContent className="space-y-1 py-10 text-center">
                <p className="text-sm font-medium">
                  {emptyState?.title || "Không có dữ liệu"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {emptyState?.description || "Không có bản ghi phù hợp với bộ lọc hiện tại."}
                </p>
                {emptyState?.action && <div className="pt-2">{emptyState.action}</div>}
              </CardContent>
            </Card>
          ) : (
            <div
              className={cn(
                "grid items-stretch",
                gapClassName,
                layout?.cardContainerClassName,
                classNames?.grid,
              )}
              style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`,
              }}
            >
              {pageItems.map((item, index) => (
                <div
                  key={keyExtractor(item, index)}
                  className={cn(
                    "min-w-0",
                    equalHeightCards && "flex h-full min-h-0",
                    layout?.itemWrapperClassName,
                  )}
                >
                  {renderCard(item, index)}
                </div>
              ))}
            </div>
          )}
        </div>

        {resolvedPaginationConfig && (
          <div className={cn("mt-2 border-t bg-background pt-2", classNames?.pagination)}>
            <DataGridPagination config={resolvedPaginationConfig} />
          </div>
        )}
      </div>
    </div>
  );
}
