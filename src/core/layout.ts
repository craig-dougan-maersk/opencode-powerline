import type { PowerlineConfig, RenderedSegment } from "./types.ts"
import { stringWidth } from "./width.ts"

export function segmentWidth(
  segment: RenderedSegment,
  style: PowerlineConfig["display"]["style"],
  padding: number,
  first: boolean,
): number {
  const content = stringWidth(segment.text) + padding * 2
  if (style === "powerline") return content + 1
  if (style === "capsule") return content + 2 + (first ? 0 : 1)
  return content
}

export function layoutRows(
  lines: RenderedSegment[][],
  width: number,
  config: PowerlineConfig,
): RenderedSegment[][] {
  const rows: RenderedSegment[][] = []
  const maxRows = Math.max(1, config.display.maxRows || 3)
  const available = Math.max(0, width - config.display.widthReserve)

  for (const line of lines) {
    if (line.length === 0) continue
    if (available <= 0) {
      rows.push(line)
      if (rows.length >= maxRows) return rows
      continue
    }

    let current: RenderedSegment[] = []
    let used = 0

    for (const segment of line) {
      const segmentSize = segmentWidth(segment, config.display.style, config.display.padding, current.length === 0)
      const fits = used + segmentSize <= available

      if (!fits) {
        if (config.display.autoWrap && current.length > 0) {
          rows.push(current)
          if (rows.length >= maxRows) return rows
          current = [segment]
          used = segmentWidth(segment, config.display.style, config.display.padding, true)
          continue
        }
        // Without wrapping, drop the segments that do not fit.
        if (current.length === 0) {
          current.push(segment)
          used = segmentSize
        }
        continue
      }

      current.push(segment)
      used += segmentSize
    }

    if (current.length > 0) {
      rows.push(current)
      if (rows.length >= maxRows) return rows
    }
  }

  return rows
}
