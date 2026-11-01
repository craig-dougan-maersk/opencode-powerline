export type Rgb = [number, number, number]

export function parseHex(hex: string): Rgb | null {
  const value = hex.trim()
  if (!value.startsWith("#")) return null
  const raw = value.slice(1)
  if (raw.length === 3) {
    const r = parseInt(raw[0] + raw[0], 16)
    const g = parseInt(raw[1] + raw[1], 16)
    const b = parseInt(raw[2] + raw[2], 16)
    return Number.isNaN(r + g + b) ? null : [r, g, b]
  }
  if (raw.length === 6 || raw.length === 8) {
    const r = parseInt(raw.slice(0, 2), 16)
    const g = parseInt(raw.slice(2, 4), 16)
    const b = parseInt(raw.slice(4, 6), 16)
    return Number.isNaN(r + g + b) ? null : [r, g, b]
  }
  return null
}

export function toHex(rgb: Rgb): string {
  const [r, g, b] = rgb.map((value) => Math.max(0, Math.min(255, Math.round(value))))
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`
}

const ANSI_16: Rgb[] = [
  [0, 0, 0],
  [128, 0, 0],
  [0, 128, 0],
  [128, 128, 0],
  [0, 0, 128],
  [128, 0, 128],
  [0, 128, 128],
  [192, 192, 192],
  [128, 128, 128],
  [255, 0, 0],
  [0, 255, 0],
  [255, 255, 0],
  [0, 0, 255],
  [255, 0, 255],
  [0, 255, 255],
  [255, 255, 255],
]

function cubeLevels(): number[] {
  return [0, 95, 135, 175, 215, 255]
}

function ansi256Palette(): Rgb[] {
  const palette: Rgb[] = [...ANSI_16]
  const levels = cubeLevels()
  for (const r of levels) for (const g of levels) for (const b of levels) palette.push([r, g, b])
  for (let i = 0; i < 24; i++) {
    const value = 8 + i * 10
    palette.push([value, value, value])
  }
  return palette
}

const PALETTE_256 = ansi256Palette()

function distance(a: Rgb, b: Rgb): number {
  const dr = a[0] - b[0]
  const dg = a[1] - b[1]
  const db = a[2] - b[2]
  return dr * dr + dg * dg + db * db
}

function nearest(rgb: Rgb, palette: Rgb[]): Rgb {
  let best = palette[0]
  let bestDistance = Number.POSITIVE_INFINITY
  for (const candidate of palette) {
    const next = distance(rgb, candidate)
    if (next < bestDistance) {
      bestDistance = next
      best = candidate
    }
  }
  return best
}

export function quantizeHex(hex: string, mode: "ansi" | "ansi256" | "truecolor" | "auto"): string {
  if (mode === "auto" || mode === "truecolor") return hex
  const rgb = parseHex(hex)
  if (!rgb) return hex
  if (mode === "ansi") return toHex(nearest(rgb, ANSI_16))
  return toHex(nearest(rgb, PALETTE_256))
}
