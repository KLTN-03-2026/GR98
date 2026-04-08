import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[11px] text-sm font-medium cursor-pointer transition-colors duration-200 ease-in-out disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        primary:
          "bg-[#7BAE3C] text-white shadow-[0_5px_12px_rgba(47,93,80,0.18)] hover:bg-[#6FA138] active:scale-95 focus-visible:ring-[#7BAE3C]/30 transition-all duration-200",
        cta:
          "bg-[#7BAE3C] text-white shadow-[0_5px_12px_rgba(47,93,80,0.18)] hover:bg-[#6FA138] active:scale-95 focus-visible:ring-[#7BAE3C]/30 transition-all duration-200",
        "glass-primary":
          "bg-white/20 backdrop-blur-lg text-white border border-white/30 shadow-lg hover:bg-white/30 active:scale-95 focus-visible:ring-white/50 transition-all duration-200",
        "glass-secondary":
          "bg-[#2F5D50]/20 backdrop-blur-lg text-[#2F5D50] border border-[#2F5D50]/30 shadow-lg hover:bg-[#2F5D50]/30 active:scale-95 focus-visible:ring-[#2F5D50]/50 transition-all duration-200",
        "glass-dark":
          "bg-black/30 backdrop-blur-xl text-white border border-white/20 shadow-xl hover:bg-black/40 active:scale-95 focus-visible:ring-white/30 transition-all duration-200",
        ghost:
          "border border-[#2F5D50]/22 bg-white/78 text-[#2F5D50]/90 shadow-none hover:bg-white/90 hover:text-[#2F5D50] focus-visible:ring-[#2F5D50]/20 active:scale-95 transition-all duration-200",
        outline:
          "border border-white/95 bg-white/72 shadow-sm hover:bg-white/90 focus-visible:ring-(--primary)/20 text-foreground active:scale-95 transition-all duration-200",
        success:
          "bg-green-500 text-white hover:bg-green-600 active:scale-95 focus-visible:ring-green-500/25 dark:bg-green-600 dark:hover:bg-green-700 transition-all duration-200",
        warning:
          "bg-amber-500 text-white hover:bg-amber-600 active:scale-95 focus-visible:ring-amber-500/25 dark:bg-amber-600 dark:hover:bg-amber-700 transition-all duration-200",
        info: "bg-blue-500 text-white hover:bg-blue-600 active:scale-95 focus-visible:ring-blue-500/25 dark:bg-blue-600 dark:hover:bg-blue-700 transition-all duration-200",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-secondary/20",
        purple:
          "bg-purple-500 text-white hover:bg-purple-600 focus-visible:ring-purple-500/25 dark:bg-purple-600 dark:hover:bg-purple-700",
        pink: "bg-pink-500 text-white hover:bg-pink-600 focus-visible:ring-pink-500/25 dark:bg-pink-600 dark:hover:bg-pink-700",
        orange:
          "bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-500/25 dark:bg-orange-600 dark:hover:bg-orange-700",
        emerald:
          "bg-emerald-500 text-white hover:bg-emerald-600 focus-visible:ring-emerald-500/25 dark:bg-emerald-600 dark:hover:bg-emerald-700",
        cyan: "bg-cyan-500 text-white hover:bg-cyan-600 focus-visible:ring-cyan-500/25 dark:bg-cyan-600 dark:hover:bg-cyan-700",
        indigo:
          "bg-indigo-500 text-white hover:bg-indigo-600 focus-visible:ring-indigo-500/25 dark:bg-indigo-600 dark:hover:bg-indigo-700",
        slate:
          "bg-slate-500 text-white hover:bg-slate-600 focus-visible:ring-slate-500/25 dark:bg-slate-600 dark:hover:bg-slate-700",
        "outline-success":
          "border border-green-500 bg-transparent text-green-700 hover:bg-green-50 focus-visible:ring-green-500/25 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-950",
        "outline-warning":
          "border border-amber-500 bg-transparent text-amber-700 hover:bg-amber-50 focus-visible:ring-amber-500/25 dark:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-950",
        "outline-destructive":
          "border border-red-500 bg-transparent text-red-700 hover:bg-red-50 focus-visible:ring-red-500/25 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950",
        dashed:
          "border border-dashed border-primary bg-background text-primary hover:bg-primary/10 focus-visible:ring-primary/20",
        "dashed-success":
          "border border-dashed border-green-500 bg-background text-green-700 hover:bg-green-50 focus-visible:ring-green-500/20 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-950",
        "dashed-warning":
          "border border-dashed border-amber-500 bg-background text-amber-700 hover:bg-amber-50 focus-visible:ring-amber-500/20 dark:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-950",
        "dashed-destructive":
          "border border-dashed border-red-500 bg-background text-red-700 hover:bg-red-50 focus-visible:ring-red-500/20 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950",
        "dashed-purple":
          "border border-dashed border-purple-500 bg-background text-purple-700 hover:bg-purple-50 focus-visible:ring-purple-500/20 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-950",
        "dashed-pink":
          "border border-dashed border-pink-500 bg-background text-pink-700 hover:bg-pink-50 focus-visible:ring-pink-500/20 dark:border-pink-400 dark:text-pink-400 dark:hover:bg-pink-950",
        "dashed-emerald":
          "border border-dashed border-emerald-500 bg-background text-emerald-700 hover:bg-emerald-50 focus-visible:ring-emerald-500/20 dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-emerald-950",
        "dashed-cyan":
          "border border-dashed border-cyan-500 bg-background text-cyan-700 hover:bg-cyan-50 focus-visible:ring-cyan-500/20 dark:border-cyan-400 dark:text-cyan-400 dark:hover:bg-cyan-950",
        link: "text-primary underline-offset-4 hover:underline focus-visible:ring-primary/20",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-[11px] gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-[11px] px-6 has-[>svg]:px-4",
        xl: "h-11 rounded-[11px] px-8 text-base has-[>svg]:px-6",
        icon: "size-9 rounded-[11px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);
