import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  accent,
  isLoading,
}: SummaryCardProps) {
  const accentClasses = {
    primary: 'border-l-blue-500 bg-linear-to-br from-white to-blue-50/40',
    emerald: 'border-l-emerald-500 bg-linear-to-br from-white to-emerald-50/40',
    rose: 'border-l-rose-500 bg-linear-to-br from-white to-rose-50/40',
  };

  const iconClasses = {
    primary: 'bg-blue-500/10 text-blue-600',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    rose: 'bg-rose-500/10 text-rose-600',
  };

  return (
    <Card className={cn(
      "overflow-hidden rounded-[2rem] border-slate-200 border-l-4 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1",
      accentClasses[accent]
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-manrope font-bold uppercase tracking-tight text-slate-400">
              {title}
            </p>
            {isLoading ? (
              <Skeleton className="mt-2 h-8 w-24" />
            ) : (
              <h3 className="mt-1.5 font-manrope font-bold text-2xl text-slate-900 tracking-tight tabular-nums">
                {value.toLocaleString('vi-VN')}
                <span className="ml-1.5 text-xs font-bold text-slate-400 uppercase">
                  {unit}
                </span>
              </h3>
            )}
          </div>
          <div className={cn(
            "flex size-11 items-center justify-center rounded-2xl shrink-0 shadow-xs",
            iconClasses[accent]
          )}>
            <Icon className="size-5.5" />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-slate-100/60 pt-3.5">
          <p className="text-[10px] font-manrope font-bold text-slate-400 uppercase tracking-tighter">
            {description}
          </p>
          <div className="size-5 rounded-full bg-slate-50 flex items-center justify-center">
            <ChevronRight className="size-3 text-slate-300" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
