import test from "node:test"
import assert from "node:assert/strict"
import { buildBar } from "../src/core/bars.ts"

test("text style has no bar", () => {
  assert.equal(buildBar(50, "text"), null)
  assert.equal(buildBar(50, undefined), null)
})

test("block and line bars", () => {
  assert.equal(buildBar(50, "blocks", 10)?.text, "\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591")
  assert.equal(buildBar(50, "line", 10)?.text, "\u2501\u2501\u2501\u2501\u2501\u2504\u2504\u2504\u2504\u2504")
  assert.equal(buildBar(0, "dots", 5)?.text, "\u25CB\u25CB\u25CB\u25CB\u25CB")
  assert.equal(buildBar(100, "squares", 5)?.text, "\u25FC\u25FC\u25FC\u25FC\u25FC")
})

test("capped bar ends on a cap", () => {
  const bar = buildBar(50, "capped", 10)
  assert.equal(bar?.text, "\u2501\u2501\u2501\u2501\u2578\u2504\u2504\u2504\u2504\u2504")
})

test("ball bar places a marker", () => {
  const bar = buildBar(50, "ball", 11)
  assert.equal(bar?.marker, 5)
  assert.equal(bar?.text, "\u2500\u2500\u2500\u2500\u2500\u25CF\u2500\u2500\u2500\u2500\u2500")
})

test("pace marker is drawn", () => {
  const under = buildBar(60, "geometric", 10, 40)
  assert.ok(under?.text.includes("\u25C6"))
  const over = buildBar(40, "geometric", 10, 70)
  assert.ok(over?.text.includes("\u25C7"))
})
