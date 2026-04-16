import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { AlertTriangle, ShieldXIcon, Info } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"
import { Alert, AlertDescription, alertVariants } from "@/components/ui/alert"
import type { VariantProps } from "class-variance-authority"

type AlertDialogVariant = "warning" | "error" | "info" | "default" | "destructive"

const AlertDialogVariantContext = React.createContext<AlertDialogVariant | undefined>(undefined)


function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content> & {
  variant?: AlertDialogVariant
}) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogVariantContext.Provider value={variant}>
        <AlertDialogPrimitive.Content
          data-slot="alert-dialog-content"
          className={cn(
            "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
            className
          )}
          {...props}
        />
      </AlertDialogVariantContext.Provider>
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title> & {
  variant?: AlertDialogVariant
}) {
  const contextVariant = React.useContext(AlertDialogVariantContext)
  const finalVariant = variant || contextVariant

  const variantColors = {
    warning: "text-yellow-900 dark:text-yellow-100",
    error: "text-red-900 dark:text-red-100",
    info: "text-blue-900 dark:text-blue-100",
    default: "",
    destructive: "text-destructive",
  }

  const colorClass = finalVariant ? variantColors[finalVariant] || "" : ""

  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-lg font-semibold", colorClass, className)}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  variant,
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description> &
  VariantProps<typeof alertVariants>) {
  const contextVariant = React.useContext(AlertDialogVariantContext)
  const finalVariant = variant || contextVariant

  if (finalVariant && (finalVariant === "warning" || finalVariant === "error" || finalVariant === "info")) {
    const iconMap = {
      warning: AlertTriangle,
      error: ShieldXIcon,
      info: Info,
    }
    const Icon = iconMap[finalVariant]

    return (
      <AlertDialogVariantContext.Provider value={finalVariant}>
        <Alert variant={finalVariant}>
          <Icon />
          <AlertDescription>
            <AlertDialogPrimitive.Description
              data-slot="alert-dialog-description"
              className={cn("text-sm", className)}
              {...props}
            >
              {children}
            </AlertDialogPrimitive.Description>
          </AlertDescription>
        </Alert>
      </AlertDialogVariantContext.Provider>
    )
  }

  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    >
      {children}
    </AlertDialogPrimitive.Description>
  )
}

function AlertDialogAction({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action> & {
  variant?: AlertDialogVariant
}) {
  const contextVariant = React.useContext(AlertDialogVariantContext)
  const finalVariant = variant || contextVariant

  let buttonVariant: "warning" | "info" | "destructive" | "primary" = "primary"
  
  if (finalVariant === "warning") {
    buttonVariant = "warning"
  } else if (finalVariant === "error") {
    buttonVariant = "destructive"
  } else if (finalVariant === "info") {
    buttonVariant = "info"
  } else if (finalVariant === "destructive") {
    buttonVariant = "destructive"
  }

  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants({ variant: buttonVariant }), className)}
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: "outline" }), className)}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
