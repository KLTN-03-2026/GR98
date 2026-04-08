import { useTheme } from "@/providers/theme-provider"
import { Toaster as Sonner, type ToasterProps, toast } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      richColors
      {...props}
    />
  )
}

// Custom toast functions with icons and types
export const customSonnerToast = {
  success: (description?: string) => {
    return toast.success(description ?? "Success")
  },

  error: (description?: string) => {
    return toast.error(description ?? "Error")
  },

  warning: (description?: string) => {
    return toast.warning(description ?? "Warning")
  },

  info: (description?: string) => {
    return toast.info(description ?? "Info")
  },

  // Direct access to original sonner functions
  promise: toast.promise,
  loading: toast.loading,
  dismiss: toast.dismiss,
  message: toast.message,
}

export { Toaster }
