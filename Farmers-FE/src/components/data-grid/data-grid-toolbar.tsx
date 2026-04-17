import { useEffect, useState } from "react";
import { FileDown, RefreshCcw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DataGridToolbarConfig } from "./types";

type DataGridToolbarProps = {
  config?: DataGridToolbarConfig;
  isLoading?: boolean;
  className?: string;
};

export function DataGridToolbar({
  config,
  isLoading = false,
  className,
}: DataGridToolbarProps) {
  const searchConfig = config?.search;
  const searchValue = searchConfig?.value ?? "";
  const searchOnChange = searchConfig?.onChange;
  const debounceMs = searchConfig?.debounceMs ?? 300;
  const [keyword, setKeyword] = useState(searchValue);
  const [isReloadAnimating, setIsReloadAnimating] = useState(false);

  useEffect(() => {
    setKeyword(searchValue);
  }, [searchValue]);

  useEffect(() => {
    if (!searchOnChange) return;
    const timer = window.setTimeout(() => {
      searchOnChange(keyword);
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [keyword, debounceMs, searchOnChange]);

  const showReset = Boolean(searchConfig && keyword.trim().length > 0);
  const refreshHandler = config?.onRefresh ?? config?.onReload;
  const isRefreshing = isLoading || isReloadAnimating;

  const handleRefresh = () => {
    if (!refreshHandler || isLoading) return;
    setIsReloadAnimating(true);
    refreshHandler();
    window.setTimeout(() => setIsReloadAnimating(false), 450);
  };

  const hasMetaRow = Boolean(config?.summary || config?.quickStats);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {searchConfig && (
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              className="h-9 border-muted/50 pl-9"
              placeholder={searchConfig.placeholder || "Tìm kiếm..."}
              value={keyword}
              disabled={isLoading}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
        )}

        {showReset && (
          <Button
            type="button"
            variant="ghost"
            className="h-8 px-3 text-sm"
            onClick={() => setKeyword("")}
            disabled={isLoading}
          >
            Reset
            <X className="h-4 w-4" />
          </Button>
        )}

        {config?.filters}

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {config?.onResetFilters && (
            <Button
              type="button"
              variant="outline"
              className="h-8 px-3 text-sm"
              onClick={config.onResetFilters}
              disabled={isLoading}
            >
              Xóa bộ lọc
            </Button>
          )}

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
                disabled={isLoading}
              >
                <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </Button>
            )}
          </div>

          {config?.customActions}
        </div>
      </div>

      {hasMetaRow ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">{config?.summary}</div>
          <div className="flex flex-wrap items-center gap-2">{config?.quickStats}</div>
        </div>
      ) : null}
    </div>
  );
}
