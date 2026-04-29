import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: number;
  unit: string;
  icon: LucideIcon;
  description: string;
  accent: 'primary' | 'emerald' | 'rose';
  isLoading: boolean;
}

export function SummaryCard({
  title,
  value,
  unit,
  icon: Icon,
  description,
  isLoading,
}: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="mt-1 h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold tabular-nums">
            {value.toLocaleString('vi-VN')} {unit}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
