import test from "node:test"
import assert from "node:assert/strict"
import {
  abbreviateFishStyle,
  basename,
  collapseHome,
  formatCacheTimer,
  formatCost,
  formatCountdown,
  formatDuration,
  formatPercent,
  formatResponseTime,
  formatTokenBreakdown,
  formatTokenCount,
  formatTokens,
  pacePercentage,
  sumTokens,
} from "../src/core/format.ts"

test("formatCost", () => {
  assert.equal(formatCost(0), "$0.00")
  assert.equal(formatCost(0.004), "<$0.01")
  assert.equal(formatCost(1.239), "$1.24")
  assert.equal(formatCost(null), "$0.00")
})

test("token formatters", () => {
  assert.equal(formatTokenCount(999), "999")
  assert.equal(formatTokenCount(1200), "1.2K")
  assert.equal(formatTokenCount(4_400_000), "4.4M")
  assert.equal(formatTokens(1200), "1.2K tokens")
  assert.equal(formatTokens(1200, false), "1.2K")
  assert.equal(
    formatTokenBreakdown({ input: 1200, output: 300, reasoning: 0, cacheRead: 500, cacheWrite: 0, total: 2000 }),
    "1.2K in + 300 out + 500 cached",
  )
})

test("time formatters", () => {
  assert.equal(formatDuration(59), "59s")
  assert.equal(formatDuration(120), "2m")
  assert.equal(formatResponseTime(4.24), "4.2s")
  assert.equal(formatCountdown(4 * 3600_000 + 12 * 60_000), "4h 12m")
  assert.equal(formatCountdown(2 * 86400_000 + 5 * 3600_000), "2d 5h")
  assert.equal(formatCacheTimer(222, "elapsed", 300), "3:42")
  assert.equal(formatCacheTimer(302, "remaining", 300), "cold")
})

test("percent and pace", () => {
  assert.equal(formatPercent(29.03), "29%")
  assert.equal(formatPercent(120), "100%")
  assert.equal(pacePercentage(1000 + 5 * 3600_000, 5 * 3600_000, 1000), 0)
  assert.equal(pacePercentage(1000 + 2.5 * 3600_000, 5 * 3600_000, 1000), 50)
})

test("paths", () => {
  assert.equal(basename("/home/craig/project/"), "project")
  assert.equal(collapseHome("/home/craig/project", "/home/craig"), "~/project")
  assert.equal(abbreviateFishStyle("~/projects/powerline"), "~/p/powerline")
})

test("sumTokens", () => {
  assert.deepEqual(sumTokens({ input: 1, output: 2, reasoning: 3, cache: { read: 4, write: 5 } }), {
    input: 1,
    output: 2,
    reasoning: 3,
    cacheRead: 4,
    cacheWrite: 5,
    total: 15,
  })
})
