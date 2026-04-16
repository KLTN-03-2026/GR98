import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { DataGridPaginationConfig } from "./types";

type DataGridPaginationProps = {
  config?: DataGridPaginationConfig;
  className?: string;
};

export function DataGridPagination({ config, className }: DataGridPaginationProps) {
  if (!config) return null;

  const {
    page,
    pageSize,
    totalItems,
    totalPages,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 15, 20, 30, 50],
  } = config;

  if (totalItems <= 0) return null;

  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);
  const pageFrom = (safePage - 1) * pageSize + 1;
  const pageTo = Math.min(safePage * pageSize, totalItems);

  const isFirstPage = safePage <= 1;
  const isLastPage = safePage >= safeTotalPages;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <span className="text-xs text-muted-foreground">
        Hiển thị {pageFrom}-{pageTo} / {totalItems} bản ghi
      </span>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {onPageSizeChange && (
          <>
            <span className="text-xs text-muted-foreground">Dòng mỗi trang</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[76px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="h-3 w-px bg-border" />
          </>
        )}

        <span className="text-xs font-medium text-muted-foreground">
          Trang {safePage} / {safeTotalPages}
        </span>
        <div className="h-3 w-px bg-border" />
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => onPageChange(1)}
            disabled={isFirstPage}
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => onPageChange(safePage - 1)}
            disabled={isFirstPage}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => onPageChange(safePage + 1)}
            disabled={isLastPage}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => onPageChange(safeTotalPages)}
            disabled={isLastPage}
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
