import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataGridToolbar } from "./data-grid-toolbar";
import { DataGridPagination } from "./data-grid-pagination";
import { DataGridSkeleton } from "./data-grid-skeleton";
import type { DataGridProps } from "./types";

export function DataGrid<TItem>({
  items,
  renderCard,
  keyExtractor,
  title,
  description,
  isLoading = false,
  error,
  onRetry,
  toolbar,
  pagination,
  layout,
  skeleton,
  emptyState,
  classNames,
  appearance = "management",
}: DataGridProps<TItem>) {
  const minCardWidth = layout?.minCardWidth ?? 280;
  const gapClassName = layout?.gapClassName ?? "gap-4";
  const resolvedSkeletonCount = skeleton?.count ?? pagination?.pageSize ?? 8;
  const useManagementAppearance = appearance === "management";

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
          {title && <h2 className="text-2xl font-bold">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}

      {toolbar && (
        <Card
          className={cn(
            useManagementAppearance && "border-dashed border-primary/40",
            classNames?.toolbarShell,
          )}
        >
          <CardContent className={cn(useManagementAppearance ? "p-3 sm:p-4" : "p-3")}>
            <DataGridToolbar
              config={toolbar}
              isLoading={isLoading}
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
          ) : isLoading ? (
            <DataGridSkeleton
              count={resolvedSkeletonCount}
              renderCard={skeleton?.renderSkeletonCard}
              minCardWidth={minCardWidth}
              gapClassName={gapClassName}
            />
          ) : items.length === 0 ? (
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
                "grid",
                gapClassName,
                layout?.cardContainerClassName,
                classNames?.grid,
              )}
              style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`,
              }}
            >
              {items.map((item, index) => (
                <div key={keyExtractor(item, index)}>{renderCard(item, index)}</div>
              ))}
            </div>
          )}
        </div>

        {pagination && (
          <div className={cn("mt-2 border-t bg-background pt-2", classNames?.pagination)}>
            <DataGridPagination config={pagination} />
          </div>
        )}
      </div>
    </div>
  );
}
