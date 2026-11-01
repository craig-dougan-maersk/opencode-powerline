const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" })

const WIDE =
  /[\u1100-\u115F\u2E80-\u303E\u3041-\u33FF\u3400-\u4DBF\u4E00-\u9FFF\uA000-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE10-\uFE19\uFE30-\uFE6F\uFF00-\uFF60\uFFE0-\uFFE6]|[\u{1F000}-\u{1FAFF}]|[\u{20000}-\u{3FFFD}]/u

const COMBINING = /\p{Mark}/u

function graphemeWidth(grapheme: string): number {
  if (!grapheme) return 0
  if (COMBINING.test(grapheme)) return 0
  if (WIDE.test(grapheme)) return 2
  return 1
}

export function stringWidth(text: string): number {
  let width = 0
  for (const { segment } of segmenter.segment(text)) width += graphemeWidth(segment)
  return width
}

export function truncateToWidth(text: string, max: number): string {
  if (max <= 0) return ""
  if (stringWidth(text) <= max) return text
  let width = 0
  let result = ""
  for (const { segment } of segmenter.segment(text)) {
    const next = graphemeWidth(segment)
    if (width + next > Math.max(0, max - 1)) break
    result += segment
    width += next
  }
  return `${result}\u2026`
}

export function padToWidth(text: string, width: number): string {
  const current = stringWidth(text)
  return current >= width ? text : text + " ".repeat(width - current)
}
