import type { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { X, RefreshCcw, FileDown, Trash2, Search } from "lucide-react";
import { useCallback, useState } from "react";
import _ from "lodash";
import { cn } from "@/lib/utils";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  // Props mới
  isLoading?: boolean;
  onReload?: () => void;
  onPrint?: () => void;
  dataLength?: number;
  searchPlaceholder?: string;
  hiddenSearch?: boolean;
  customActions?: React.ReactNode;
  // Filter toolbar
  filterToolbar?: React.ReactNode;
  // Delete multiple rows
  onDeleteMultiple?: (selectedRows: any[]) => void;
  enableCheckbox?: boolean;
}

export function DataTableToolbar<TData>({
  table,
  isLoading,
  onReload,
  onPrint,
  dataLength = 0,
  searchPlaceholder = "Tìm kiếm...",
  hiddenSearch = false,
  customActions,
  filterToolbar,
  onDeleteMultiple,
  enableCheckbox = false,
}: DataTableToolbarProps<TData>) {
  const [valueSearchInput, setValueSearchInput] = useState<string>("");
  const isFiltered =
    table.getState().columnFilters.length > 0 ||
    !!table.getState().globalFilter;
  
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedRowsCount = selectedRows.length;

  const debouncedSearch = useCallback(
    _.debounce((value) => {
      table.setGlobalFilter(value);
    }, 500),
    []
  );

  const handleSearchInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValueSearchInput(event.target.value);
    debouncedSearch(event.target.value);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="flex flex-1 items-center gap-2">
        {!hiddenSearch && (
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              className="pl-9 h-9 bg-background border-muted-foreground/20 focus-visible:ring-1"
              value={valueSearchInput}
              onChange={handleSearchInput}
              disabled={isLoading}
            />
          </div>
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              table.setGlobalFilter("");
              setValueSearchInput("");
            }}
            className="h-9 px-3 text-sm font-medium"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
        {filterToolbar}
      </div>

      <div className="flex items-center gap-2">
        {enableCheckbox && onDeleteMultiple && selectedRowsCount > 0 && (
          <Button
            onClick={() => onDeleteMultiple(selectedRows)}
            disabled={isLoading}
            size="sm"
            variant="destructive"
            className="h-9 transition-colors"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa ({selectedRowsCount})
          </Button>
        )}

        <div className="flex items-center gap-1 border rounded-lg p-1 bg-background">
          {onPrint && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrint}
              disabled={isLoading || dataLength === 0}
              className="h-8 w-8"
            >
              <FileDown className="h-4 w-4" />
            </Button>
          )}

          {onReload && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onReload}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          )}

          <DataTableViewOptions table={table} />
        </div>

        {customActions}
      </div>
    </div>
  );
}