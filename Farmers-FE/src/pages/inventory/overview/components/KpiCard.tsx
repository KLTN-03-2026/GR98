import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  description?: string;
  accentColor?: "emerald" | "amber" | "rose" | "violet";
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  description,
  accentColor = "emerald",
}: KpiCardProps) {
  const accentStyles = {
    emerald: { 
      bg: "bg-emerald-50 text-emerald-600 border-emerald-100/50", 
      dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]",
      gradient: "from-emerald-50/50 to-transparent"
    },
    amber: { 
      bg: "bg-amber-50 text-amber-600 border-amber-100/50", 
      dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]",
      gradient: "from-amber-50/50 to-transparent"
    },
    rose: { 
      bg: "bg-rose-50 text-rose-600 border-rose-100/50", 
      dot: "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]",
      gradient: "from-rose-50/50 to-transparent"
    },
    violet: { 
      bg: "bg-violet-50 text-violet-600 border-violet-100/50", 
      dot: "bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.4)]",
      gradient: "from-violet-50/50 to-transparent"
    },
  };

  const style = accentStyles[accentColor];

  return (
    <Card className={cn(
      "group relative overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white p-6 transition-all duration-300",
      "hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-slate-300 hover:-translate-y-1"
    )}>
      {/* Background Gradient */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100", style.gradient)} />
      
      <div className="absolute top-5 right-5 flex items-center gap-1.5">
        <div className={cn("size-2 rounded-full animate-pulse", style.dot)} />
      </div>

      <div className="relative z-10 flex flex-col gap-5">
        <div className={cn(
          "flex size-12 items-center justify-center rounded-2xl border shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
          style.bg
        )}>
          <Icon className="size-6" />
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-tight text-slate-400">
            {label}
          </p>
          <div className="flex items-baseline gap-1">
            <h2 className="font-manrope text-3xl font-bold tracking-tight text-slate-900">
              {value}
            </h2>
          </div>
          {description && (
            <p className="text-[11px] font-medium text-slate-400 leading-tight">
              {description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
