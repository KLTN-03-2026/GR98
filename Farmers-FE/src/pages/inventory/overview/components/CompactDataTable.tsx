import React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompactDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  noResults?: React.ReactNode;
  isLoading?: boolean;
}

export function CompactDataTable<TData, TValue>({
  columns,
  data,
  noResults,
  isLoading,
}: CompactDataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  const { pageIndex } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();

  return (
    <div className="w-full flex flex-col">
      {/* Table */}
      <div className="border-t border-slate-100/60">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-slate-100/60">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-11 px-6 bg-slate-50/30">
                    <div className="text-[10px] font-bold uppercase tracking-tight text-slate-400">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-3.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  {noResults || (
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-300">
                      <p className="text-[11px] font-bold uppercase tracking-widest opacity-50">Không có dữ liệu</p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Compact Pagination */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100/60 bg-white rounded-b-[2rem]">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
          Trang <span className="text-slate-900">{pageIndex + 1}</span> / {pageCount || 1}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-xl border-slate-200 shadow-sm disabled:opacity-30 hover:bg-slate-50 transition-all active:scale-95"
            onClick={() => table.previousPage()}
            disabled={!canPreviousPage}
          >
            <ChevronLeft className="size-4 text-slate-600" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-xl border-slate-200 shadow-sm disabled:opacity-30 hover:bg-slate-50 transition-all active:scale-95"
            onClick={() => table.nextPage()}
            disabled={!canNextPage}
          >
            <ChevronRight className="size-4 text-slate-600" />
          </Button>
        </div>
      </div>
    </div>
  );
}
