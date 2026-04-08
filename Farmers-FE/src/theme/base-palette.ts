export type BasePalette = {
  primary: string
  secondary: string
  tertiary: string
  neutral: string
}

export const FARMS_BASE_PALETTE: BasePalette = {
  primary: "#7BAE3C",
  secondary: "#2F5D50",
  tertiary: "#3B82F6",
  neutral: "#1F2937",
}

const CSS_VAR_MAP = {
  primary: "--base-primary",
  secondary: "--base-secondary",
  tertiary: "--base-tertiary",
  neutral: "--base-neutral",
} as const

export function applyBasePalette(palette: Partial<BasePalette>) {
  const root = document.documentElement
    ; (Object.keys(CSS_VAR_MAP) as (keyof BasePalette)[]).forEach((key) => {
      const value = palette[key]
      if (!value) return
      root.style.setProperty(CSS_VAR_MAP[key], value)
    })
}

