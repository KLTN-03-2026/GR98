import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";

/**
 * CustomScrollArea — A premium, auto-hiding scrollbar that fits the design system.
 *
 * Features:
 * - Slim 6px track that expands to 8px on hover
 * - Smooth fade-in/out with opacity transitions
 * - Primary-tinted thumb color with hover & active states
 * - Rounded thumb with subtle glow on hover
 * - Works with both light and dark modes
 * - Supports vertical and horizontal scrolling
 */

interface CustomScrollAreaProps
  extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  /** Additional class names for the viewport (inner scrollable area) */
  viewportClassName?: string;
  /** Show horizontal scrollbar as well */
  horizontal?: boolean;
}

const CustomScrollArea = React.forwardRef<
  React.ComponentRef<typeof ScrollAreaPrimitive.Root>,
  CustomScrollAreaProps
>(({ className, viewportClassName, horizontal = false, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport
      className={cn(
        "h-full w-full rounded-[inherit]",
        viewportClassName
      )}
    >
      {children}
    </ScrollAreaPrimitive.Viewport>

    {/* Vertical scrollbar */}
    <CustomScrollBar orientation="vertical" />

    {/* Horizontal scrollbar (optional) */}
    {horizontal && <CustomScrollBar orientation="horizontal" />}

    <ScrollAreaPrimitive.Corner className="bg-transparent" />
  </ScrollAreaPrimitive.Root>
));

CustomScrollArea.displayName = "CustomScrollArea";

/* ─── Scrollbar ────────────────────────────────────────────── */

interface CustomScrollBarProps
  extends React.ComponentPropsWithoutRef<
    typeof ScrollAreaPrimitive.ScrollAreaScrollbar
  > {}

const CustomScrollBar = React.forwardRef<
  React.ComponentRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  CustomScrollBarProps
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      // Base
      "flex touch-none select-none",
      // Transition: fade in/out + width expansion
      "transition-all duration-300 ease-out",
      // Idle: semi-transparent → Hover: fully visible
      "opacity-0 hover:opacity-100",
      // Show when scrolling (Radix adds data-state="visible")
      "data-[state=visible]:opacity-100",

      // Vertical
      orientation === "vertical" && [
        "h-full w-[6px] hover:w-[8px]",
        "border-l border-l-transparent",
        "p-[1px]",
        // Position at right edge with small margin
        "mr-[2px]",
      ],

      // Horizontal
      orientation === "horizontal" && [
        "w-full h-[6px] hover:h-[8px]",
        "flex-col",
        "border-t border-t-transparent",
        "p-[1px]",
        "mb-[2px]",
      ],

      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb
      className={cn(
        "relative flex-1 rounded-full",
        // Use CSS class for thumb styling (defined in index.css)
        "custom-scroll-thumb",
        // Minimum size so it's always grabbable
        orientation === "vertical" && "min-h-[36px]",
        orientation === "horizontal" && "min-w-[36px]"
      )}
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));

CustomScrollBar.displayName = "CustomScrollBar";

export { CustomScrollArea, CustomScrollBar };
