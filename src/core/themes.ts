import type { ColorTheme, CustomColor } from "./types.ts"
import { quantizeHex } from "./colors.ts"

const dark: ColorTheme = {
  directory: { bg: "#8b4513", fg: "#ffffff" },
  git: { bg: "#404040", fg: "#ffffff" },
  model: { bg: "#2d2d2d", fg: "#ffffff" },
  session: { bg: "#202020", fg: "#00ffff" },
  block: { bg: "#2a2a2a", fg: "#87ceeb" },
  today: { bg: "#1a1a1a", fg: "#98fb98" },
  month: { bg: "#2a1f14", fg: "#e8b86d" },
  tmux: { bg: "#2f4f2f", fg: "#90ee90" },
  context: { bg: "#4a5568", fg: "#cbd5e0" },
  contextWarning: { bg: "#92400e", fg: "#fbbf24" },
  contextCritical: { bg: "#991b1b", fg: "#fca5a5" },
  metrics: { bg: "#374151", fg: "#d1d5db" },
  version: { bg: "#3a3a4a", fg: "#b8b8d0" },
  env: { bg: "#2d2d3d", fg: "#d0a0d0" },
  weekly: { bg: "#2a2a3a", fg: "#a0c4e8" },
  agent: { bg: "#2a2a4a", fg: "#b0a8e0" },
  thinking: { bg: "#2a2a3a", fg: "#c792ea" },
  cacheTimer: { bg: "#1f3a1f", fg: "#90ee90" },
  outputStyle: { bg: "#1f3a3a", fg: "#7fd1c4" },
  status: { bg: "#1f3a1f", fg: "#90ee90" },
}

const light: ColorTheme = {
  directory: { bg: "#ff6b47", fg: "#ffffff" },
  git: { bg: "#4fb3d9", fg: "#ffffff" },
  model: { bg: "#87ceeb", fg: "#000000" },
  session: { bg: "#da70d6", fg: "#ffffff" },
  block: { bg: "#6366f1", fg: "#ffffff" },
  today: { bg: "#10b981", fg: "#ffffff" },
  month: { bg: "#f59e0b", fg: "#ffffff" },
  tmux: { bg: "#32cd32", fg: "#ffffff" },
  context: { bg: "#718096", fg: "#ffffff" },
  contextWarning: { bg: "#d97706", fg: "#ffffff" },
  contextCritical: { bg: "#dc2626", fg: "#ffffff" },
  metrics: { bg: "#6b7280", fg: "#ffffff" },
  version: { bg: "#8b7dd8", fg: "#ffffff" },
  env: { bg: "#d45dbf", fg: "#ffffff" },
  weekly: { bg: "#4f46e5", fg: "#ffffff" },
  agent: { bg: "#7c3aed", fg: "#ffffff" },
  thinking: { bg: "#7c3aed", fg: "#ffffff" },
  cacheTimer: { bg: "#059669", fg: "#ffffff" },
  outputStyle: { bg: "#0f766e", fg: "#ffffff" },
  status: { bg: "#059669", fg: "#ffffff" },
}

const nord: ColorTheme = {
  directory: { bg: "#434c5e", fg: "#d8dee9" },
  git: { bg: "#3b4252", fg: "#a3be8c" },
  model: { bg: "#4c566a", fg: "#81a1c1" },
  session: { bg: "#2e3440", fg: "#88c0d0" },
  block: { bg: "#3b4252", fg: "#81a1c1" },
  today: { bg: "#2e3440", fg: "#8fbcbb" },
  month: { bg: "#3b4252", fg: "#ebcb8b" },
  tmux: { bg: "#2e3440", fg: "#8fbcbb" },
  context: { bg: "#5e81ac", fg: "#eceff4" },
  contextWarning: { bg: "#d08770", fg: "#2e3440" },
  contextCritical: { bg: "#bf616a", fg: "#eceff4" },
  metrics: { bg: "#b48ead", fg: "#2e3440" },
  version: { bg: "#434c5e", fg: "#88c0d0" },
  env: { bg: "#3b4252", fg: "#b48ead" },
  weekly: { bg: "#3b4252", fg: "#88c0d0" },
  agent: { bg: "#4c566a", fg: "#b48ead" },
  thinking: { bg: "#3b4252", fg: "#b48ead" },
  cacheTimer: { bg: "#3b4252", fg: "#a3be8c" },
  outputStyle: { bg: "#3b4252", fg: "#8fbcbb" },
  status: { bg: "#3b4252", fg: "#a3be8c" },
}

const tokyoNight: ColorTheme = {
  directory: { bg: "#2f334d", fg: "#82aaff" },
  git: { bg: "#1e2030", fg: "#c3e88d" },
  model: { bg: "#191b29", fg: "#fca7ea" },
  session: { bg: "#222436", fg: "#86e1fc" },
  block: { bg: "#2d3748", fg: "#7aa2f7" },
  today: { bg: "#1a202c", fg: "#4fd6be" },
  month: { bg: "#2a2440", fg: "#e0af68" },
  tmux: { bg: "#191b29", fg: "#4fd6be" },
  context: { bg: "#414868", fg: "#c0caf5" },
  contextWarning: { bg: "#ff9e64", fg: "#1a1b26" },
  contextCritical: { bg: "#f7768e", fg: "#1a1b26" },
  metrics: { bg: "#3d59a1", fg: "#c0caf5" },
  version: { bg: "#292e42", fg: "#bb9af7" },
  env: { bg: "#24283b", fg: "#fca7ea" },
  weekly: { bg: "#24283b", fg: "#7dcfff" },
  agent: { bg: "#2d2b55", fg: "#bb9af7" },
  thinking: { bg: "#2f2a3d", fg: "#bb9af7" },
  cacheTimer: { bg: "#1f2e2a", fg: "#9ece6a" },
  outputStyle: { bg: "#2a3d3d", fg: "#73daca" },
  status: { bg: "#1f2e2a", fg: "#9ece6a" },
}

const rosePine: ColorTheme = {
  directory: { bg: "#26233a", fg: "#c4a7e7" },
  git: { bg: "#1f1d2e", fg: "#9ccfd8" },
  model: { bg: "#191724", fg: "#ebbcba" },
  session: { bg: "#26233a", fg: "#f6c177" },
  block: { bg: "#2a273f", fg: "#eb6f92" },
  today: { bg: "#232136", fg: "#9ccfd8" },
  month: { bg: "#21202e", fg: "#31748f" },
  tmux: { bg: "#26233a", fg: "#908caa" },
  context: { bg: "#393552", fg: "#e0def4" },
  contextWarning: { bg: "#f6c177", fg: "#191724" },
  contextCritical: { bg: "#eb6f92", fg: "#191724" },
  metrics: { bg: "#524f67", fg: "#e0def4" },
  version: { bg: "#2a273f", fg: "#c4a7e7" },
  env: { bg: "#21202e", fg: "#eb6f92" },
  weekly: { bg: "#21202e", fg: "#c4a7e7" },
  agent: { bg: "#2a273f", fg: "#c4a7e7" },
  thinking: { bg: "#26223a", fg: "#c4a7e7" },
  cacheTimer: { bg: "#1f2d2e", fg: "#9ccfd8" },
  outputStyle: { bg: "#21313a", fg: "#9ccfd8" },
  status: { bg: "#1f2d2e", fg: "#9ccfd8" },
}

const gruvbox: ColorTheme = {
  directory: { bg: "#504945", fg: "#ebdbb2" },
  git: { bg: "#3c3836", fg: "#b8bb26" },
  model: { bg: "#665c54", fg: "#83a598" },
  session: { bg: "#282828", fg: "#8ec07c" },
  block: { bg: "#3c3836", fg: "#83a598" },
  today: { bg: "#282828", fg: "#fabd2f" },
  month: { bg: "#3c3836", fg: "#fe8019" },
  tmux: { bg: "#282828", fg: "#fe8019" },
  context: { bg: "#458588", fg: "#ebdbb2" },
  contextWarning: { bg: "#d79921", fg: "#282828" },
  contextCritical: { bg: "#cc241d", fg: "#ebdbb2" },
  metrics: { bg: "#d3869b", fg: "#282828" },
  version: { bg: "#504945", fg: "#8ec07c" },
  env: { bg: "#3c3836", fg: "#d3869b" },
  weekly: { bg: "#3c3836", fg: "#8ec07c" },
  agent: { bg: "#504945", fg: "#d3869b" },
  thinking: { bg: "#3c3046", fg: "#d3869b" },
  cacheTimer: { bg: "#3c3836", fg: "#b8bb26" },
  outputStyle: { bg: "#2f3b34", fg: "#8ec07c" },
  status: { bg: "#3c3836", fg: "#b8bb26" },
}

export const BUILT_IN_THEMES: Record<string, ColorTheme> = {
  dark,
  light,
  nord,
  "tokyo-night": tokyoNight,
  "rose-pine": rosePine,
  gruvbox,
}

export interface HostPalette {
  background: string
  raised: string
  raisedHigh: string
  raisedMax: string
  text: string
  muted: string
  primary: string
  success: string
  warning: string
  error: string
  info: string
}

export function autoTheme(host: HostPalette): ColorTheme {
  return {
    directory: { bg: host.raisedMax, fg: host.text },
    git: { bg: host.raisedHigh, fg: host.success },
    model: { bg: host.raised, fg: host.text },
    session: { bg: host.raisedHigh, fg: host.info },
    block: { bg: host.raised, fg: host.primary },
    today: { bg: host.raisedHigh, fg: host.success },
    month: { bg: host.raised, fg: host.warning },
    tmux: { bg: host.raised, fg: host.success },
    context: { bg: host.primary, fg: host.background },
    contextWarning: { bg: host.warning, fg: host.background },
    contextCritical: { bg: host.error, fg: host.background },
    metrics: { bg: host.raised, fg: host.muted },
    version: { bg: host.raised, fg: host.muted },
    env: { bg: host.raised, fg: host.warning },
    weekly: { bg: host.raised, fg: host.info },
    agent: { bg: host.raisedHigh, fg: host.info },
    thinking: { bg: host.raised, fg: host.info },
    cacheTimer: { bg: host.raised, fg: host.success },
    outputStyle: { bg: host.raised, fg: host.info },
    status: { bg: host.raised, fg: host.success },
  }
}

export interface ThemeResolution {
  colors: ColorTheme
  mono: boolean
}

function mergeTheme(base: ColorTheme, custom: Partial<Record<string, CustomColor>> | undefined): ColorTheme {
  if (!custom) return base
  const result: ColorTheme = { ...base }
  for (const [key, value] of Object.entries(custom)) {
    if (!value) continue
    const current = (result as Record<string, CustomColor>)[key] ?? {}
    ;(result as Record<string, CustomColor>)[key] = {
      bg: value.bg ?? current.bg,
      fg: value.fg ?? current.fg,
      bold: value.bold ?? current.bold,
    }
  }
  return result
}

export function resolveTheme(input: {
  theme: string
  host?: HostPalette
  custom?: Partial<Record<string, CustomColor>>
  colorCompatibility?: "auto" | "ansi" | "ansi256" | "truecolor"
  mono?: boolean
}): ThemeResolution {
  const mono = input.mono ?? false
  if (mono) {
    return { colors: BUILT_IN_THEMES.dark, mono: true }
  }

  let base: ColorTheme
  if (input.theme === "auto") {
    base = input.host ? autoTheme(input.host) : BUILT_IN_THEMES.dark
  } else if (input.theme === "custom") {
    base = BUILT_IN_THEMES.dark
  } else {
    base = BUILT_IN_THEMES[input.theme] ?? BUILT_IN_THEMES.dark
  }

  let colors = mergeTheme(base, input.theme === "custom" ? input.custom : undefined)
  const mode = input.colorCompatibility ?? "auto"
  if (mode === "ansi" || mode === "ansi256") {
    const converted: ColorTheme = {} as ColorTheme
    for (const [key, value] of Object.entries(colors)) {
      const color = value as CustomColor
      ;(converted as Record<string, CustomColor>)[key] = {
        ...color,
        bg: color.bg ? quantizeHex(color.bg, mode) : undefined,
        fg: color.fg ? quantizeHex(color.fg, mode) : undefined,
      }
    }
    colors = converted
  }

  return { colors, mono: false }
}
