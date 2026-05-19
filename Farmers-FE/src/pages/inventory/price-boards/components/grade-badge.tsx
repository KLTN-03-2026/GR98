import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

/**
 * Unified 4-tier grade system, dùng cho cả contract + inventory + product.
 *   PREMIUM (Cao cấp)   — chất lượng cao nhất, xuất khẩu / specialty
 *   STANDARD (Tiêu chuẩn) — phổ biến, bán lẻ thông thường
 *   ECONOMY (Phổ thông) — bán sỉ / chế biến
 *   REJECT (Loại thải)  — không đạt yêu cầu
 *
 * Legacy A/B/C còn trong DB cũ → tự map khi hiển thị, không show trong dropdown.
 */
export const PRICE_BOARD_GRADES = [
  { value: 'PREMIUM',  label: 'Cao cấp',    variant: 'success' as const },
  { value: 'STANDARD', label: 'Tiêu chuẩn', variant: 'soft-info' as const },
  { value: 'ECONOMY',  label: 'Phổ thông',  variant: 'warning' as const },
  { value: 'REJECT',   label: 'Loại thải',  variant: 'destructive' as const },
] as const;

/** Mapping legacy A/B/C → grade mới (cho display + UI labels). */
const LEGACY_GRADE_MAP: Record<string, string> = {
  A: 'PREMIUM',
  B: 'STANDARD',
  C: 'ECONOMY',
};

/** Resolve grade về unified value (handle cả legacy + uppercase variation). */
export function normalizeGrade(grade: string | null | undefined): string {
  if (!grade) return 'STANDARD';
  const upper = grade.toUpperCase();
  return LEGACY_GRADE_MAP[upper] ?? upper;
}

/** Lấy label tiếng Việt từ grade (handle legacy). */
export function getGradeLabel(grade: string | null | undefined): string {
  const normalized = normalizeGrade(grade);
  const config = PRICE_BOARD_GRADES.find((g) => g.value === normalized);
  return config?.label ?? normalized;
}

interface GradeBadgeProps {
  grade: string;
  className?: string;
}

export function PriceBoardGradeBadge({ grade, className }: GradeBadgeProps) {
  const normalized = normalizeGrade(grade);
  const config =
    PRICE_BOARD_GRADES.find((g) => g.value === normalized) ||
    PRICE_BOARD_GRADES[1]; // default = STANDARD

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-none border-none',
        className,
      )}
    >
      {config.label}
    </Badge>
  );
}
