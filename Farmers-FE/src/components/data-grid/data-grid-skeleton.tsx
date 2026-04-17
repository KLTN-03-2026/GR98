import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type DataGridSkeletonProps = {
  count?: number;
  minCardWidth?: number;
  gapClassName?: string;
  className?: string;
  renderCard?: (index: number) => React.ReactNode;
};

function DefaultSkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-10/12" />
          <Skeleton className="h-3 w-8/12" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DataGridSkeleton({
  count = 8,
  minCardWidth = 280,
  gapClassName = "gap-4",
  className,
  renderCard,
}: DataGridSkeletonProps) {
  return (
    <div
      className={cn("grid", gapClassName, className)}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`,
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={`data-grid-skeleton-${index}`}>
          {renderCard ? renderCard(index) : <DefaultSkeletonCard />}
        </div>
      ))}
    </div>
  );
}
