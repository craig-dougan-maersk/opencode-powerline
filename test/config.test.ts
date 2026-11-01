import test from "node:test"
import assert from "node:assert/strict"
import { DEFAULT_CONFIG, deepMerge, normalizeConfig } from "../src/core/config.ts"

test("deepMerge keeps nested defaults", () => {
  const merged = deepMerge({ a: { b: 1, c: 2 } }, { a: { c: 3 } })
  assert.deepEqual(merged, { a: { b: 1, c: 3 } })
})

test("deepMerge replaces arrays", () => {
  const merged = deepMerge({ a: [1, 2, 3] }, { a: [9] })
  assert.deepEqual(merged, { a: [9] })
})

test("normalizeConfig applies defaults", () => {
  const config = normalizeConfig({})
  assert.equal(config.display.style, "powerline")
  assert.equal(config.theme, "auto")
  assert.equal(config.display.lines.length, 1)
  assert.equal(config.display.lines[0]?.segments.directory?.enabled, true)
})

test("normalizeConfig accepts boolean segment shorthand", () => {
  const config = normalizeConfig({
    display: { lines: [{ segments: { git: true, model: false } }] },
  })
  assert.equal(config.display.lines[0]?.segments.git?.enabled, true)
  assert.equal(config.display.lines[0]?.segments.model?.enabled, false)
})

test("normalizeConfig clamps display values", () => {
  const config = normalizeConfig({
    display: { padding: 99, widthReserve: -5, maxRows: 100, style: "nonsense", charset: "nope" },
  })
  assert.equal(config.display.padding, 4)
  assert.equal(config.display.widthReserve, 0)
  assert.equal(config.display.maxRows, 10)
  assert.equal(config.display.style, "powerline")
  assert.equal(config.display.charset, "unicode")
})

test("default budget is present", () => {
  assert.equal(DEFAULT_CONFIG.budget.today.amount, 50)
  assert.equal(DEFAULT_CONFIG.budget.month.amount, 500)
})
