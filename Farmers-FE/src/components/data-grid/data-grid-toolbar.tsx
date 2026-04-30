import { useEffect, useRef, useState } from "react";
import { FileDown, RefreshCcw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DataGridToolbarConfig } from "./types";

type DataGridToolbarProps = {
  config?: DataGridToolbarConfig;
  isLoading?: boolean;
  /** Skeleton lưới / refetch; không khóa ô search, chỉ dùng cho spin và khóa refresh khi cần */
  isAwaitingResults?: boolean;
  className?: string;
};

export function DataGridToolbar({
  config,
  isLoading = false,
  isAwaitingResults = false,
  className,
}: DataGridToolbarProps) {
  const searchConfig = config?.search;
  const searchValue = searchConfig?.value ?? "";
  const debounceMs = searchConfig?.debounceMs ?? 300;
  const hideSearch = searchConfig?.hidden ?? false;
  const disableSearch = isLoading || Boolean(searchConfig?.disabled);
  const [keyword, setKeyword] = useState(searchValue);
  const [isReloadAnimating, setIsReloadAnimating] = useState(false);
  /** Tránh re-fire debounce mỗi lần parent tạo lại callback (DataGrid render) — gây reset trang / lệch pagination. */
  const searchOnChangeRef = useRef(searchConfig?.onChange);
  searchOnChangeRef.current = searchConfig?.onChange;

  useEffect(() => {
    setKeyword(searchValue);
  }, [searchValue]);

  useEffect(() => {
    if (!searchOnChangeRef.current) return;
    const timer = window.setTimeout(() => {
      searchOnChangeRef.current?.(keyword);
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [keyword, debounceMs]);

  const showReset = Boolean(searchConfig && !hideSearch && keyword.trim().length > 0);
  const refreshHandler = config?.onRefresh ?? config?.onReload;
  const isRefreshing = isLoading || isAwaitingResults || isReloadAnimating;
  const isRefreshDisabled = isLoading || isAwaitingResults;

  const handleRefresh = () => {
    if (!refreshHandler || isRefreshDisabled) return;
    setIsReloadAnimating(true);
    refreshHandler();
    window.setTimeout(() => setIsReloadAnimating(false), 450);
  };

  const hasSummary = Boolean(config?.summary);
  const hasQuickStats = Boolean(config?.quickStats);
  /** Gộp quickStats lên hàng toolbar chính khi không có summary — tránh 2 tầng cao dư khoảng trống (vd. plots). */
  const quickStatsInline = hasQuickStats && !hasSummary;
  const showMetaRow = hasSummary;

  const handleResetSearch = () => {
    setKeyword("");
    searchOnChangeRef.current?.("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "flex min-w-0 items-center gap-2 py-3",
          quickStatsInline ? "flex-nowrap overflow-x-auto" : "flex-wrap",
        )}
      >
        {searchConfig && !hideSearch && (
          <div
            className={cn(
              "relative w-full sm:max-w-sm",
              quickStatsInline && "max-w-sm shrink-0",
            )}
          >
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              className="h-9 border-muted/50 pl-9"
              placeholder={searchConfig.placeholder || "Tìm kiếm..."}
              value={keyword}
              disabled={disableSearch}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
        )}

        {showReset && (
          <Button
            type="button"
            variant="ghost"
            className="h-9 px-3 text-sm font-medium"
            onClick={handleResetSearch}
            disabled={disableSearch}
          >
            Reset
            <X className="h-4 w-4" />
          </Button>
        )}

        {config?.filters ? (
          <div
            className={cn(
              "flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5",
              quickStatsInline && "flex-1",
            )}
          >
            {config.filters}
          </div>
        ) : null}

        <div className="ml-auto flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2">
          {quickStatsInline && (
            <div className="flex shrink-0 flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {config.quickStats}
            </div>
          )}
          {config?.onResetFilters && (
            <Button
              type="button"
              variant="outline"
              className="h-9 px-3 text-sm font-medium"
              onClick={config.onResetFilters}
              disabled={isLoading}
            >
              Xóa bộ lọc
            </Button>
          )}

          {(config?.onExport || refreshHandler) && (
            <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
              {config?.onExport && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={config.onExport}
                  disabled={isLoading}
                >
                  <FileDown className="h-4 w-4" />
                </Button>
              )}

              {refreshHandler && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleRefresh}
                  disabled={isRefreshDisabled}
                >
                  <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                </Button>
              )}
            </div>
          )}

          {config?.customActions}
        </div>
      </div>

      {showMetaRow ? (
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 text-sm text-muted-foreground",
            hasSummary && hasQuickStats && "justify-between",
            hasSummary && !hasQuickStats && "justify-start",
          )}
        >
          {hasSummary && (
            <div className="flex flex-wrap items-center gap-2">{config.summary}</div>
          )}
          {hasQuickStats && !quickStatsInline && (
            <div className="flex flex-wrap items-center gap-2">{config.quickStats}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
