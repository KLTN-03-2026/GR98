import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center select-none justify-center rounded-md border px-2 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-transparent bg-green-500 text-white [a&]:hover:bg-green-600 dark:bg-green-600 dark:[a&]:hover:bg-green-700",
        warning:
          "border-transparent bg-amber-500 text-white [a&]:hover:bg-amber-600 dark:bg-amber-600 dark:[a&]:hover:bg-amber-700",
        info:
          "border-transparent bg-blue-500 text-white [a&]:hover:bg-blue-600 dark:bg-blue-600 dark:[a&]:hover:bg-blue-700",
        purple:
          "border-transparent bg-purple-500 text-white [a&]:hover:bg-purple-600 dark:bg-purple-600 dark:[a&]:hover:bg-purple-700",
        pink:
          "border-transparent bg-pink-500 text-white [a&]:hover:bg-pink-600 dark:bg-pink-600 dark:[a&]:hover:bg-pink-700",
        orange:
          "border-transparent bg-orange-500 text-white [a&]:hover:bg-orange-600 dark:bg-orange-600 dark:[a&]:hover:bg-orange-700",
        emerald:
          "border-transparent bg-emerald-500 text-white [a&]:hover:bg-emerald-600 dark:bg-emerald-600 dark:[a&]:hover:bg-emerald-700",
        cyan:
          "border-transparent bg-cyan-500 text-white [a&]:hover:bg-cyan-600 dark:bg-cyan-600 dark:[a&]:hover:bg-cyan-700",
        indigo:
          "border-transparent bg-indigo-500 text-white [a&]:hover:bg-indigo-600 dark:bg-indigo-600 dark:[a&]:hover:bg-indigo-700",
        slate:
          "border-transparent bg-slate-500 text-white [a&]:hover:bg-slate-600 dark:bg-slate-600 dark:[a&]:hover:bg-slate-700",
        gray:
          "border-transparent bg-gray-500 text-white [a&]:hover:bg-gray-600 dark:bg-gray-600 dark:[a&]:hover:bg-gray-700",
        zinc:
          "border-transparent bg-zinc-500 text-white [a&]:hover:bg-zinc-600 dark:bg-zinc-600 dark:[a&]:hover:bg-zinc-700",
        red:
          "border-transparent bg-red-500 text-white [a&]:hover:bg-red-600 dark:bg-red-600 dark:[a&]:hover:bg-red-700",
        rose:
          "border-transparent bg-rose-500 text-white [a&]:hover:bg-rose-600 dark:bg-rose-600 dark:[a&]:hover:bg-rose-700",
        teal:
          "border-transparent bg-teal-500 text-white [a&]:hover:bg-teal-600 dark:bg-teal-600 dark:[a&]:hover:bg-teal-700",
        lime:
          "border-transparent bg-lime-500 text-black [a&]:hover:bg-lime-600 dark:bg-lime-600 dark:[a&]:hover:bg-lime-700 dark:text-white",
        yellow:
          "border-transparent bg-yellow-500 text-black [a&]:hover:bg-yellow-600 dark:bg-yellow-600 dark:[a&]:hover:bg-yellow-700 dark:text-white",
        // Outline variants with colors
        "outline-success":
          "border-green-500 text-green-700 [a&]:hover:bg-green-50 [a&]:hover:text-green-800 dark:border-green-400 dark:text-green-400 dark:[a&]:hover:bg-green-950 dark:[a&]:hover:text-green-300",
        "outline-warning":
          "border-amber-500 text-amber-700 [a&]:hover:bg-amber-50 [a&]:hover:text-amber-800 dark:border-amber-400 dark:text-amber-400 dark:[a&]:hover:bg-amber-950 dark:[a&]:hover:text-amber-300",
        "outline-info":
          "border-blue-500 text-blue-700 [a&]:hover:bg-blue-50 [a&]:hover:text-blue-800 dark:border-blue-400 dark:text-blue-400 dark:[a&]:hover:bg-blue-950 dark:[a&]:hover:text-blue-300",
        "outline-destructive":
          "border-red-500 text-red-700 [a&]:hover:bg-red-50 [a&]:hover:text-red-800 dark:border-red-400 dark:text-red-400 dark:[a&]:hover:bg-red-950 dark:[a&]:hover:text-red-300",
        // Soft variants for subtle backgrounds
        "soft-success":
          "border-transparent bg-green-100 text-green-800 [a&]:hover:bg-green-200 dark:bg-green-950 dark:text-green-200 dark:[a&]:hover:bg-green-900",
        "soft-warning":
          "border-transparent bg-amber-100 text-amber-800 [a&]:hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:[a&]:hover:bg-amber-900",
        "soft-info":
          "border-transparent bg-blue-100 text-blue-800 [a&]:hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:[a&]:hover:bg-blue-900",
        "soft-destructive":
          "border-transparent bg-red-100 text-red-800 [a&]:hover:bg-red-200 dark:bg-red-950 dark:text-red-200 dark:[a&]:hover:bg-red-900",
        "soft-purple":
          "border-transparent bg-purple-100 text-purple-800 [a&]:hover:bg-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:[a&]:hover:bg-purple-900",
        "soft-pink":
          "border-transparent bg-pink-100 text-pink-800 [a&]:hover:bg-pink-200 dark:bg-pink-950 dark:text-pink-200 dark:[a&]:hover:bg-pink-900",
        // Dashed outline variants
        dashed:
          "border border-dashed border-primary text-primary bg-background [a&]:hover:bg-primary/10 [a&]:hover:text-primary",
        "dashed-success":
          "border border-dashed border-green-500 text-green-700 bg-background [a&]:hover:bg-green-50 [a&]:hover:text-green-800 dark:border-green-400 dark:text-green-400 dark:[a&]:hover:bg-green-950 dark:[a&]:hover:text-green-300",
        "dashed-warning":
          "border border-dashed border-amber-500 text-amber-700 bg-background [a&]:hover:bg-amber-50 [a&]:hover:text-amber-800 dark:border-amber-400 dark:text-amber-400 dark:[a&]:hover:bg-amber-950 dark:[a&]:hover:text-amber-300",
        "dashed-info":
          "border border-dashed border-blue-500 text-blue-700 bg-background [a&]:hover:bg-blue-50 [a&]:hover:text-blue-800 dark:border-blue-400 dark:text-blue-400 dark:[a&]:hover:bg-blue-950 dark:[a&]:hover:text-blue-300",
        "dashed-destructive":
          "border border-dashed border-red-500 text-red-700 bg-background [a&]:hover:bg-red-50 [a&]:hover:text-red-800 dark:border-red-400 dark:text-red-400 dark:[a&]:hover:bg-red-950 dark:[a&]:hover:text-red-300",
        "dashed-purple":
          "border border-dashed border-purple-500 text-purple-700 bg-background [a&]:hover:bg-purple-50 [a&]:hover:text-purple-800 dark:border-purple-400 dark:text-purple-400 dark:[a&]:hover:bg-purple-950 dark:[a&]:hover:text-purple-300",
        "dashed-pink":
          "border border-dashed border-pink-500 text-pink-700 bg-background [a&]:hover:bg-pink-50 [a&]:hover:text-pink-800 dark:border-pink-400 dark:text-pink-400 dark:[a&]:hover:bg-pink-950 dark:[a&]:hover:text-pink-300",
        "dashed-orange":
          "border border-dashed border-orange-500 text-orange-700 bg-background [a&]:hover:bg-orange-50 [a&]:hover:text-orange-800 dark:border-orange-400 dark:text-orange-400 dark:[a&]:hover:bg-orange-950 dark:[a&]:hover:text-orange-300",
        "dashed-emerald":
          "border border-dashed border-emerald-500 text-emerald-700 bg-background [a&]:hover:bg-emerald-50 [a&]:hover:text-emerald-800 dark:border-emerald-400 dark:text-emerald-400 dark:[a&]:hover:bg-emerald-950 dark:[a&]:hover:text-emerald-300",
        "dashed-cyan":
          "border border-dashed border-cyan-500 text-cyan-700 bg-background [a&]:hover:bg-cyan-50 [a&]:hover:text-cyan-800 dark:border-cyan-400 dark:text-cyan-400 dark:[a&]:hover:bg-cyan-950 dark:[a&]:hover:text-cyan-300",
        "dashed-indigo":
          "border border-dashed border-indigo-500 text-indigo-700 bg-background [a&]:hover:bg-indigo-50 [a&]:hover:text-indigo-800 dark:border-indigo-400 dark:text-indigo-400 dark:[a&]:hover:bg-indigo-950 dark:[a&]:hover:text-indigo-300",
        "dashed-slate":
          "border border-dashed border-slate-500 text-slate-700 bg-background [a&]:hover:bg-slate-50 [a&]:hover:text-slate-800 dark:border-slate-400 dark:text-slate-400 dark:[a&]:hover:bg-slate-950 dark:[a&]:hover:text-slate-300",
        "dashed-gray":
          "border border-dashed border-gray-500 text-gray-700 bg-background [a&]:hover:bg-gray-50 [a&]:hover:text-gray-800 dark:border-gray-400 dark:text-gray-400 dark:[a&]:hover:bg-gray-950 dark:[a&]:hover:text-gray-300",
        "dashed-zinc":
          "border border-dashed border-zinc-500 text-zinc-700 bg-background [a&]:hover:bg-zinc-50 [a&]:hover:text-zinc-800 dark:border-zinc-400 dark:text-zinc-400 dark:[a&]:hover:bg-zinc-950 dark:[a&]:hover:text-zinc-300",
        "dashed-red":
          "border border-dashed border-red-500 text-red-700 bg-background [a&]:hover:bg-red-50 [a&]:hover:text-red-800 dark:border-red-400 dark:text-red-400 dark:[a&]:hover:bg-red-950 dark:[a&]:hover:text-red-300",
        "dashed-rose":
          "border border-dashed border-rose-500 text-rose-700 bg-background [a&]:hover:bg-rose-50 [a&]:hover:text-rose-800 dark:border-rose-400 dark:text-rose-400 dark:[a&]:hover:bg-rose-950 dark:[a&]:hover:text-rose-300",
        "dashed-teal":
          "border border-dashed border-teal-500 text-teal-700 bg-background [a&]:hover:bg-teal-50 [a&]:hover:text-teal-800 dark:border-teal-400 dark:text-teal-400 dark:[a&]:hover:bg-teal-950 dark:[a&]:hover:text-teal-300",
        "dashed-lime":
          "border border-dashed border-lime-500 text-lime-700 bg-background [a&]:hover:bg-lime-50 [a&]:hover:text-lime-800 dark:border-lime-400 dark:text-lime-400 dark:[a&]:hover:bg-lime-950 dark:[a&]:hover:text-lime-300",
        "dashed-yellow":
          "border border-dashed border-yellow-500 text-yellow-700 bg-background [a&]:hover:bg-yellow-50 [a&]:hover:text-yellow-800 dark:border-yellow-400 dark:text-yellow-400 dark:[a&]:hover:bg-yellow-950 dark:[a&]:hover:text-yellow-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
