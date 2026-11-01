import { rgbToHex } from "@opentui/core"
import type { HostPalette } from "../core/themes.ts"

function hex(color: any, fallback: string): string {
  try {
    return color ? rgbToHex(color) : fallback
  } catch {
    return fallback
  }
}

export function hostPalette(theme: any): HostPalette {
  const background = hex(theme?.background?.base, "#1e1e1e")
  return {
    background,
    raised: hex(theme?.background?.raised?.base, "#2a2a2a"),
    raisedHigh: hex(theme?.background?.raised?.high, "#333333"),
    raisedMax: hex(theme?.background?.raised?.max, "#3a3a3a"),
    text: hex(theme?.text?.base, "#ffffff"),
    muted: hex(theme?.text?.muted, "#a0a0a0"),
    primary: hex(theme?.text?.action?.primary?.base, "#7aa2f7"),
    success: hex(theme?.text?.feedback?.success?.base, "#9ece6a"),
    warning: hex(theme?.text?.feedback?.warning?.base, "#e0af68"),
    error: hex(theme?.text?.feedback?.error?.base, "#f7768e"),
    info: hex(theme?.text?.feedback?.info?.base ?? theme?.text?.action?.primary?.base, "#7dcfff"),
  }
}

export function appBackground(theme: any): string {
  return hex(theme?.background?.base, "#1e1e1e")
}

export function monoEnabled(env: Record<string, string | undefined>): boolean {
  const noColor = env.NO_COLOR
  if (noColor !== undefined && noColor !== "" && noColor !== "0") return true
  const force = env.FORCE_COLOR
  if (force === "0" || force === "false") return true
  return false
}
