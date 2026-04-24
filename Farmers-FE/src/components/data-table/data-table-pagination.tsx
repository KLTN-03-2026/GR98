import { type Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pageSizeOptions?: number[];
  /** 
   * Bắt buộc cho SSR để hiển thị đúng tổng số bản ghi.
   * Với CSR, mặc định sẽ lấy từ table.getFilteredRowModel().rows.length
   */
  totalItems?: number; 
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 50, 100],
  totalItems,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  
  // Xác định tổng số trang
  // Nếu manualPagination = true, Tanstack Table sẽ dùng giá trị pageCount truyền vào useReactTable
  const pageCount = table.getPageCount();
  
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  
  // Xác định tổng số bản ghi để hiển thị
  // Ưu tiên totalItems truyền vào (SSR), nếu không có thì lấy từ row model (CSR)
  const totalCount = totalItems ?? table.getFilteredRowModel().rows.length;

  const safePageCount = Math.max(1, pageCount);
  const displayPage = Math.min(pageIndex + 1, safePageCount);
  const isFirstPage = pageIndex <= 0;
  const isLastPage = pageIndex >= safePageCount - 1;
  const lastPageIndex = Math.max(0, safePageCount - 1);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 border-t bg-muted/5 gap-4 rounded-b-xl">
      {/* Left: Info Section */}
      <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground w-full sm:w-auto">
        <div className="font-medium whitespace-nowrap">
          Đã chọn <span className="text-foreground">{selectedCount}</span> / {totalCount} bản ghi
        </div>
      </div>

      {/* Right: Controls Section */}
      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 lg:gap-8 w-full sm:w-auto">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">Dòng mỗi trang</p>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
              // Quay về trang đầu khi đổi pageSize để tránh lỗi offset dữ liệu
              table.setPageIndex(0);
            }}
          >
            <SelectTrigger className="h-8 w-[70px] bg-background">
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
        </div>

        {/* Page info */}
        <div className="flex items-center justify-center text-sm font-semibold min-w-[100px] whitespace-nowrap">
          Trang {displayPage} / {safePageCount}
        </div>

        {/* Page navigation buttons */}
        <div className="flex items-center gap-1">
          <PaginationButton
            onClick={() => table.setPageIndex(0)}
            disabled={isFirstPage}
            className="hidden xs:flex"
            title="Trang đầu"
          >
            <ChevronsLeft className="h-4 w-4" />
          </PaginationButton>

          <PaginationButton
            onClick={() => {
              if (!isFirstPage) table.previousPage();
            }}
            disabled={isFirstPage}
            title="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </PaginationButton>

          <PaginationButton
            onClick={() => {
              if (!isLastPage) table.nextPage();
            }}
            disabled={isLastPage}
            title="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </PaginationButton>

          <PaginationButton
            onClick={() => table.setPageIndex(lastPageIndex)}
            disabled={isLastPage}
            className="hidden xs:flex"
            title="Trang cuối"
          >
            <ChevronsRight className="h-4 w-4" />
          </PaginationButton>
        </div>
      </div>
    </div>
  );
}

function PaginationButton({
  onClick,
  disabled,
  children,
  className,
  title,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn("h-8 w-8 hover:bg-muted transition-colors", className)}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="sr-only">{title || "Nút phân trang"}</span>
      {children}
    </Button>
  );
}
