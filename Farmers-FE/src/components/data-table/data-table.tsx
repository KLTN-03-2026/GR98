import React, { useEffect, useRef } from "react";
import type { 
  ColumnDef, 
  ColumnFiltersState, 
  SortingState, 
  VisibilityState,
  OnChangeFn,
  PaginationState
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import { DataTableToolbar } from "./data-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  noResults?: React.ReactNode;
  onSelectedItems?: (rows: any) => void;
  // Common Props
  isLoading?: boolean;
  onReload?: () => void;
  onRowClick?: (data: TData) => void;
  searchPlaceholder?: string;
  hiddenSearch?: boolean;
  titleTable?: string;
  descripTable?: string;
  enableSorting?: boolean;
  customActions?: React.ReactNode;
  className?: string;
  tableClassName?: string;
  filterToolbar?: React.ReactNode;
  enableCheckbox?: boolean;
  onDeleteMultiple?: (selectedRows: any[]) => void;
  
  // SSR (Manual) Props
  totalItems?: number;
  manualPagination?: boolean;
  manualSorting?: boolean;
  manualFiltering?: boolean;
  pageCount?: number;
  onPaginationChange?: OnChangeFn<PaginationState>;
  onSortingChange?: OnChangeFn<SortingState>;
  onGlobalFilterChange?: OnChangeFn<any>;
  state?: any; // To override internal state for SSR
  /** Truyền xuống DataTablePagination (vd: [10, 15, 20, 30]) */
  pageSizeOptions?: number[];
}

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <TableRow className="hover:bg-transparent">
      {Array.from({ length: columns }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="w-full h-6" />
        </TableCell>
      ))}
    </TableRow>
  );
}

export function DataTable<TData, TValue>({
  columns,
  data,
  noResults,
  onSelectedItems,
  isLoading,
  onReload,
  onRowClick,
  searchPlaceholder = "Tìm kiếm...",
  hiddenSearch = false,
  titleTable,
  descripTable,
  enableSorting = true,
  customActions,
  className,
  tableClassName,
  filterToolbar,
  enableCheckbox = false,
  onDeleteMultiple,
  
  // SSR
  totalItems,
  manualPagination = false,
  manualSorting = false,
  manualFiltering = false,
  pageCount,
  onPaginationChange,
  onSortingChange,
  onGlobalFilterChange,
  state: externalState,
  pageSizeOptions,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState<any>("");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  const onSelectedItemsRef = useRef(onSelectedItems);

  useEffect(() => {
    onSelectedItemsRef.current = onSelectedItems;
  }, [onSelectedItems]);

  const columnsWithCheckbox = React.useMemo(() => {
    if (!enableCheckbox) return columns;
    const hasCheckboxColumn = columns.some((col) => col.id === "select");
    if (hasCheckboxColumn) return columns;

    const checkboxColumn: ColumnDef<TData, TValue> = {
      id: "select",
      header: ({ table }) => {
        const isAllSelected = table.getIsAllPageRowsSelected();
        const isSomeSelected = table.getIsSomePageRowsSelected();
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isAllSelected || (isSomeSelected ? "indeterminate" : false)}
              onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
              aria-label="Select all"
            />
          </div>
        );
      },
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={row.getIsSelected() || false}
            onCheckedChange={(checked) => row.toggleSelected(!!checked)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    };

    return [checkboxColumn, ...columns];
  }, [columns, enableCheckbox]);

  const table = useReactTable({
    data,
    columns: columnsWithCheckbox,
    // Chỉ truyền pageCount khi phân trang server; client dùng getPaginationRowModel tự tính.
    // Truyền -1 khi không manual làm getCanNextPage() sai → nút "Trang sau" vẫn bấm được dù chỉ 1 trang.
    ...(manualPagination ? { pageCount: pageCount ?? -1 } : {}),
    manualPagination,
    manualSorting,
    manualFiltering,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
      ...externalState,
    },
    enableRowSelection: enableCheckbox || !!onSelectedItems,
    onRowSelectionChange: setRowSelection,
    onSortingChange: onSortingChange || setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: onGlobalFilterChange || setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: onPaginationChange || setPagination,
    
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: manualFiltering ? undefined : getFilteredRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    getSortedRowModel: (enableSorting && !manualSorting) ? getSortedRowModel() : undefined,
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const filteredRowCount = table.getFilteredRowModel().rows.length;

  useEffect(() => {
    if (manualPagination) return;
    setPagination((prev) => {
      const totalPages = Math.max(
        1,
        Math.ceil(filteredRowCount / Math.max(1, prev.pageSize)),
      );
      const maxIndex = totalPages - 1;
      if (prev.pageIndex > maxIndex) {
        return { ...prev, pageIndex: maxIndex };
      }
      return prev;
    });
  }, [manualPagination, filteredRowCount, data, columnFilters, sorting]);

  useEffect(() => {
    if (onSelectedItemsRef.current) {
      const selectedRows = table.getFilteredSelectedRowModel().rows;
      onSelectedItemsRef.current(selectedRows);
    }
  }, [table.getFilteredSelectedRowModel().rows.length]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const tableHtml = document.getElementById("data-table-unified")?.outerHTML;
    if (!tableHtml) return;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${titleTable || "Báo cáo dữ liệu"}</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f2f2f2; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>${titleTable || "Báo cáo dữ liệu"}</h2>
          ${tableHtml}
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {(titleTable || descripTable || customActions) && (
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            {titleTable && <h2 className="text-2xl font-bold">{titleTable}</h2>}
            {descripTable && <p className="text-sm text-muted-foreground">{descripTable}</p>}
          </div>
          {customActions && <div className="flex items-center gap-2">{customActions}</div>}
        </div>
      )}

      <DataTableToolbar
        table={table}
        isLoading={isLoading}
        onReload={onReload}
        onPrint={handlePrint}
        dataLength={data.length}
        searchPlaceholder={searchPlaceholder}
        hiddenSearch={hiddenSearch}
        filterToolbar={filterToolbar}
        onDeleteMultiple={onDeleteMultiple}
        enableCheckbox={enableCheckbox}
      />

      <div className={cn("rounded-md border overflow-x-auto", tableClassName)}>
        <Table id="data-table-unified">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableSkeleton key={index} columns={columnsWithCheckbox.length} />
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(onRowClick && "cursor-pointer hover:bg-muted/50")}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="h-40">
                <TableCell colSpan={columnsWithCheckbox.length} className="h-24 text-center">
                  {noResults ? noResults : "Không có dữ liệu."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        table={table}
        totalItems={totalItems}
        pageSizeOptions={pageSizeOptions}
      />
    </div>
  );
}