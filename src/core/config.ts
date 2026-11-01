import { readFile, mkdir, writeFile } from "node:fs/promises"
import { watchFile, unwatchFile } from "node:fs"
import { homedir } from "node:os"
import { dirname, join, resolve } from "node:path"
import type {
  AnySegmentConfig,
  LineConfig,
  PowerlineConfig,
  SegmentConfig,
  SegmentType,
} from "./types.ts"

export const SEGMENT_TYPES: SegmentType[] = [
  "directory",
  "git",
  "model",
  "session",
  "today",
  "month",
  "block",
  "weekly",
  "version",
  "tmux",
  "sessionId",
  "context",
  "metrics",
  "agent",
  "thinking",
  "cacheTimer",
  "outputStyle",
  "env",
  "status",
]

function segment(enabled: boolean, extra: Partial<SegmentConfig> = {}): SegmentConfig {
  return { enabled, ...extra }
}

export const DEFAULT_LINES: LineConfig[] = [
  {
    segments: {
      directory: segment(true, { style: "basename" }),
      git: segment(true, {
        showSha: false,
        showWorkingTree: false,
        showOperation: false,
        showTag: false,
        showTimeSinceCommit: false,
        showStashCount: false,
        showUpstream: false,
        showRepoName: false,
        showAheadBehind: true,
      }),
      model: segment(true),
      session: segment(true, { type: "tokens", costSource: "calculated", showUnits: true }),
      context: segment(true, {
        showPercentageOnly: false,
        displayStyle: "text",
        autocompactBuffer: 0,
      }),
      agent: segment(true, { showLabel: false }),
      today: segment(true, { type: "cost", showUnits: true }),
      month: segment(false, { type: "cost", showUnits: true }),
      block: segment(false, { type: "cost", displayStyle: "text", showPace: false }),
      weekly: segment(false, { displayStyle: "text", showPace: false }),
      version: segment(false),
      tmux: segment(false),
      sessionId: segment(false, { showIdLabel: true }),
      metrics: segment(false, {
        showResponseTime: true,
        showLastResponseTime: true,
        showDuration: true,
        showMessageCount: true,
        showLinesAdded: true,
        showLinesRemoved: true,
      }),
      thinking: segment(false, { showEnabled: true, showEffort: true }),
      cacheTimer: segment(false, { displayMode: "elapsed" }),
      outputStyle: segment(false, { showLabel: false, hideDefault: false }),
      env: segment(false, { variable: "", prefix: undefined }),
      status: segment(true),
    },
  },
]

export const DEFAULT_CONFIG: PowerlineConfig = {
  theme: "auto",
  display: {
    style: "powerline",
    charset: "unicode",
    colorCompatibility: "auto",
    autoWrap: true,
    widthReserve: 0,
    padding: 1,
    showIcons: true,
    surface: "auto",
    maxRows: 3,
    lines: DEFAULT_LINES,
  },
  budget: {
    session: { warningThreshold: 80 },
    today: { amount: 50, warningThreshold: 80 },
    month: { amount: 500, warningThreshold: 80 },
    block: { amount: 15, warningThreshold: 80 },
  },
  modelContextLimits: { default: 200000 },
  demo: false,
  tickMs: 1000,
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export function deepMerge<T>(base: T, patch: unknown): T {
  if (patch === undefined) return base
  if (Array.isArray(base) || Array.isArray(patch)) return (patch as T) ?? base
  if (isPlainObject(base) && isPlainObject(patch)) {
    const result: Record<string, unknown> = { ...base }
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue
      result[key] = key in base ? deepMerge((base as Record<string, unknown>)[key], value) : value
    }
    return result as T
  }
  return patch as T
}

function normalizeSegment(value: unknown): SegmentConfig | undefined {
  if (value === true) return { enabled: true }
  if (value === false) return { enabled: false }
  if (!isPlainObject(value)) return undefined
  return {
    ...(value as unknown as AnySegmentConfig),
    enabled: Boolean((value as { enabled?: unknown }).enabled),
  }
}

function normalizeLine(value: unknown): LineConfig | undefined {
  if (!isPlainObject(value)) return undefined
  const rawSegments = (value as { segments?: unknown }).segments
  if (!isPlainObject(rawSegments)) return undefined
  const segments: Partial<Record<SegmentType, SegmentConfig>> = {}
  for (const [key, raw] of Object.entries(rawSegments)) {
    if (!SEGMENT_TYPES.includes(key as SegmentType)) continue
    const normalized = normalizeSegment(raw)
    if (normalized) segments[key as SegmentType] = normalized
  }
  return { segments }
}

export function normalizeConfig(raw: unknown): PowerlineConfig {
  const merged = deepMerge(DEFAULT_CONFIG, raw)
  const display = merged.display
  if (!["powerline", "capsule", "minimal", "tui"].includes(display.style)) display.style = "powerline"
  if (!["unicode", "text"].includes(display.charset)) display.charset = "unicode"
  if (!["auto", "ansi", "ansi256", "truecolor"].includes(display.colorCompatibility)) {
    display.colorCompatibility = "auto"
  }
  if (!["auto", "app", "prompt.footer", "prompt.footer.status", "session.composer.top", "home.footer.status"].includes(display.surface)) {
    display.surface = "auto"
  }
  display.padding = Math.max(0, Math.min(4, Number(display.padding) || 0))
  display.widthReserve = Math.max(0, Number(display.widthReserve) || 0)
  display.maxRows = Math.max(1, Math.min(10, Number(display.maxRows) || 3))
  const lines = Array.isArray(display.lines)
    ? display.lines.map(normalizeLine).filter((line): line is LineConfig => Boolean(line))
    : []
  display.lines = lines.length > 0 ? lines : DEFAULT_LINES
  if (typeof merged.theme !== "string" || merged.theme.length === 0) merged.theme = "auto"
  return merged
}

export interface ConfigPaths {
  global: string
  project: string
  explicit?: string
}

export function configPaths(input: {
  cwd?: string
  home?: string
  xdg?: string
  explicit?: string
}): ConfigPaths {
  const home = input.home ?? homedir()
  const xdg = input.xdg ?? process.env.XDG_CONFIG_HOME
  const global = join(xdg || join(home, ".config"), "opencode", "powerline.json")
  return {
    global,
    project: join(resolve(input.cwd ?? process.cwd()), ".opencode-powerline.json"),
    explicit: input.explicit ? resolve(input.explicit) : undefined,
  }
}

async function readJson(path: string): Promise<unknown | undefined> {
  try {
    const text = await readFile(path, "utf8")
    if (!text.trim()) return undefined
    return JSON.parse(text)
  } catch (error) {
    const code = (error as { code?: string }).code
    if (code === "ENOENT") return undefined
    throw error
  }
}

export interface LoadConfigResult {
  config: PowerlineConfig
  files: string[]
  errors: Array<{ path: string; message: string }>
}

export async function loadConfig(input: {
  cwd?: string
  home?: string
  xdg?: string
  env?: Record<string, string | undefined>
  options?: Record<string, unknown>
} = {}): Promise<LoadConfigResult> {
  const env = input.env ?? process.env
  const options = input.options ?? {}
  const explicit = typeof options.config === "string" ? options.config : env.OPENCODE_POWERLINE_CONFIG
  const paths = configPaths({
    cwd: input.cwd,
    home: input.home,
    xdg: input.xdg,
    explicit,
  })

  const files = [paths.global, paths.project, paths.explicit].filter(
    (value): value is string => Boolean(value),
  )
  const errors: Array<{ path: string; message: string }> = []
  let config: PowerlineConfig = DEFAULT_CONFIG

  for (const path of files) {
    try {
      const raw = await readJson(path)
      if (raw !== undefined) config = normalizeConfig(deepMerge(config, raw))
    } catch (error) {
      errors.push({ path, message: error instanceof Error ? error.message : String(error) })
    }
  }

  config = applyEnv(config, env)
  config = applyOptions(config, options)
  return { config: normalizeConfig(config), files, errors }
}

export function applyEnv(
  config: PowerlineConfig,
  env: Record<string, string | undefined>,
): PowerlineConfig {
  const next = { ...config, display: { ...config.display } }
  if (env.OPENCODE_POWERLINE_THEME) next.theme = env.OPENCODE_POWERLINE_THEME
  if (env.OPENCODE_POWERLINE_STYLE) next.display.style = env.OPENCODE_POWERLINE_STYLE as PowerlineConfig["display"]["style"]
  if (env.OPENCODE_POWERLINE_CHARSET) next.display.charset = env.OPENCODE_POWERLINE_CHARSET as PowerlineConfig["display"]["charset"]
  if (env.OPENCODE_POWERLINE_SURFACE) next.display.surface = env.OPENCODE_POWERLINE_SURFACE as PowerlineConfig["display"]["surface"]
  if (env.OPENCODE_POWERLINE_DEMO === "1" || env.OPENCODE_POWERLINE_DEMO === "true") next.demo = true
  return next
}

export function applyOptions(
  config: PowerlineConfig,
  options: Record<string, unknown>,
): PowerlineConfig {
  const next = { ...config, display: { ...config.display } }
  if (typeof options.theme === "string") next.theme = options.theme
  if (typeof options.style === "string") next.display.style = options.style as PowerlineConfig["display"]["style"]
  if (typeof options.charset === "string") next.display.charset = options.charset as PowerlineConfig["display"]["charset"]
  if (typeof options.surface === "string") next.display.surface = options.surface as PowerlineConfig["display"]["surface"]
  if (typeof options.padding === "number") next.display.padding = options.padding
  if (typeof options.showIcons === "boolean") next.display.showIcons = options.showIcons
  if (typeof options.autoWrap === "boolean") next.display.autoWrap = options.autoWrap
  if (typeof options.widthReserve === "number") next.display.widthReserve = options.widthReserve
  if (typeof options.maxRows === "number") next.display.maxRows = options.maxRows
  if (typeof options.demo === "boolean") next.demo = options.demo
  if (typeof options.tickMs === "number") next.tickMs = options.tickMs
  return next
}

export function watchConfigFiles(paths: string[], onChange: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  const listener = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      onChange()
    }, 200)
  }
  for (const path of paths) watchFile(path, { interval: 1000 }, listener)
  return () => {
    if (timer) clearTimeout(timer)
    for (const path of paths) unwatchFile(path, listener)
  }
}

export async function writeGlobalConfig(
  changes: unknown,
  input: { home?: string; xdg?: string } = {},
): Promise<string> {
  const paths = configPaths(input)
  let existing: unknown = {}
  try {
    existing = (await readJson(paths.global)) ?? {}
  } catch {
    existing = {}
  }
  const next = deepMerge(existing, changes)
  await mkdir(dirname(paths.global), { recursive: true })
  await writeFile(paths.global, `${JSON.stringify(next, null, 2)}\n`, "utf8")
  return paths.global
}

export function globalConfigPath(input: { home?: string; xdg?: string } = {}): string {
  return configPaths(input).global
}
