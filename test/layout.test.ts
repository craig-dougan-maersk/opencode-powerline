import test from "node:test"
import assert from "node:assert/strict"
import { layoutRows, segmentWidth } from "../src/core/layout.ts"
import { normalizeConfig } from "../src/core/config.ts"
import type { RenderedSegment } from "../src/core/types.ts"

function segment(text: string): RenderedSegment {
  return {
    type: "directory",
    text,
    bg: "#000000",
    fg: "#ffffff",
    config: { enabled: true },
  }
}

test("segment width follows the style", () => {
  const value = segment("abc")
  assert.equal(segmentWidth(value, "powerline", 1, true), 6)
  assert.equal(segmentWidth(value, "minimal", 1, true), 5)
  assert.equal(segmentWidth(value, "capsule", 1, true), 7)
  assert.equal(segmentWidth(value, "capsule", 1, false), 8)
})

test("auto wrap breaks into rows", () => {
  const config = normalizeConfig({ display: { autoWrap: true, padding: 1, style: "powerline" } })
  const rows = layoutRows([[segment("aaaa"), segment("bbbb"), segment("cccc")]], 20, config)
  assert.equal(rows.length, 2)
  assert.equal(rows[0]?.length, 2)
  assert.equal(rows[1]?.length, 1)
})

test("without wrap, overflowing segments are dropped", () => {
  const config = normalizeConfig({ display: { autoWrap: false, padding: 1, style: "powerline" } })
  const rows = layoutRows([[segment("aaaa"), segment("bbbb"), segment("cccc")]], 20, config)
  assert.equal(rows.length, 1)
  assert.equal(rows[0]?.length, 2)
})

test("maxRows caps the output", () => {
  const config = normalizeConfig({
    display: { autoWrap: true, padding: 1, style: "powerline", maxRows: 1 },
  })
  const rows = layoutRows([[segment("aaaa"), segment("bbbb"), segment("cccc")]], 20, config)
  assert.equal(rows.length, 1)
})
