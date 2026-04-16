import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export const PRICE_BOARD_GRADES = [
  { value: 'A', label: 'Hạng A', variant: 'success' as const },
  { value: 'B', label: 'Hạng B', variant: 'warning' as const },
  { value: 'C', label: 'Hạng C', variant: 'orange' as const },
  { value: 'REJECT', label: 'Loại kém', variant: 'destructive' as const },
] as const;

interface GradeBadgeProps {
  grade: string;
  className?: string;
}

export function PriceBoardGradeBadge({ grade, className }: GradeBadgeProps) {
  const config = PRICE_BOARD_GRADES.find((g) => g.value === grade) || PRICE_BOARD_GRADES[3];
  
  return (
    <Badge variant={config.variant} className={cn("px-2 py-0.5 font-medium", className)}>
      {config.label}
    </Badge>
  );
}
