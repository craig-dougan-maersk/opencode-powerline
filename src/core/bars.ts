import type { BarStyle } from "./types.ts"

export interface BarResult {
  text: string
  width: number
  filled: number
  marker?: number
}

interface BarDef {
  filled: string
  empty: string
  cap?: string
  marker?: string
}

const BAR_STYLES: Record<Exclude<BarStyle, "text">, BarDef> = {
  ball: { filled: "\u2500", empty: "\u2500", marker: "\u25CF" },
  bar: { filled: "\u25AA", empty: "\u25AB" },
  blocks: { filled: "\u2588", empty: "\u2591" },
  "blocks-line": { filled: "\u2588", empty: "\u2500" },
  capped: { filled: "\u2501", empty: "\u2504", cap: "\u2578" },
  dots: { filled: "\u25CF", empty: "\u25CB" },
  filled: { filled: "\u25A0", empty: "\u25A1" },
  geometric: { filled: "\u25B0", empty: "\u25B1" },
  line: { filled: "\u2501", empty: "\u2504" },
  squares: { filled: "\u25FC", empty: "\u25FB" },
}

export function isBarStyle(style: BarStyle | undefined): style is Exclude<BarStyle, "text"> {
  return Boolean(style && style !== "text" && style in BAR_STYLES)
}

export function buildBar(
  percent: number,
  style: BarStyle | undefined,
  width = 10,
  pace?: number,
): BarResult | null {
  if (!isBarStyle(style)) return null
  const def = BAR_STYLES[style]
  const cells = Math.max(1, Math.round(width))
  const clamped = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0))
  const filled = Math.max(0, Math.min(cells, Math.round((clamped / 100) * cells)))

  if (style === "ball") {
    const marker = Math.max(0, Math.min(cells - 1, Math.round((clamped / 100) * (cells - 1))))
    const chars = Array.from({ length: cells }, () => def.empty)
    chars[marker] = def.marker ?? "\u25CF"
    return { text: chars.join(""), width: cells, filled, marker }
  }

  if (style === "capped") {
    if (filled <= 0) return { text: def.empty.repeat(cells), width: cells, filled: 0 }
    const body = def.filled.repeat(Math.max(0, filled - 1))
    const cap = def.cap ?? "\u2578"
    const empty = def.empty.repeat(Math.max(0, cells - filled))
    return { text: `${body}${cap}${empty}`, width: cells, filled }
  }

  let text = `${def.filled.repeat(filled)}${def.empty.repeat(Math.max(0, cells - filled))}`

  if (pace !== undefined && Number.isFinite(pace) && cells > 0) {
    const index = Math.max(0, Math.min(cells - 1, Math.round((Math.max(0, Math.min(100, pace)) / 100) * (cells - 1))))
    const marker = pace >= clamped ? "\u25C7" : "\u25C6"
    const chars = Array.from(text)
    chars[index] = marker
    text = chars.join("")
  }

  return { text, width: cells, filled }
}
