import test from "node:test"
import assert from "node:assert/strict"
import { normalizeConfig } from "../src/core/config.ts"
import { buildLineSegments } from "../src/core/segments.ts"
import { resolveTheme } from "../src/core/themes.ts"
import type { Snapshot } from "../src/core/types.ts"

function snapshot(overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    sessionID: "ses_test",
    directory: "/home/craig/project",
    directoryDisplay: "~/project",
    git: {
      branch: "main",
      status: "dirty",
      ahead: 2,
      behind: 1,
      sha: "abc1234",
      staged: 1,
      unstaged: 2,
      untracked: 3,
      conflicts: 0,
      tag: "v1.0.0",
      timeSinceCommit: 3600,
      stashCount: 2,
      upstream: "origin/main",
      repoName: "project",
    },
    model: { name: "DeepSeek V4.1 Flash", provider: "opencode-go", variant: "high" },
    session: {
      cost: 0.42,
      calculatedCost: 0.42,
      tokens: { input: 1200, output: 300, reasoning: 0, cacheRead: 500, cacheWrite: 0, total: 2000 },
    },
    context: { tokens: 50_000, limit: 200_000, usable: 200_000, percent: 25 },
    today: { cost: 1.23, tokens: 4_400_000 },
    month: { cost: 12.34, tokens: 44_000_000 },
    block: { percent: 23, resetsAt: 1_000_000 + 4 * 3600_000 },
    weekly: { percent: 61, resetsAt: 1_000_000 + 2 * 86400_000 },
    monthGo: { percent: 42, resetsAt: 1_000_000 + 12 * 86400_000 },
    metrics: {
      responseTime: 95,
      lastResponseTime: 4.2,
      duration: 720,
      messages: 5,
      linesAdded: 120,
      linesRemoved: 30,
    },
    version: "2.2.5",
    agent: "build",
    thinking: { enabled: true, effort: "high" },
    cacheTimer: { elapsed: 222, ttl: 300 },
    tmux: "main",
    env: { USER: "craig" },
    status: "running",
    now: 1_000_000,
    ...overrides,
  }
}

const theme = resolveTheme({ theme: "dark" }).colors

function render(segments: Record<string, any>, data = snapshot()): string[] {
  const config = normalizeConfig({
    theme: "dark",
    display: { lines: [{ segments }] },
  })
  return buildLineSegments(config.display.lines[0]!, config, data, theme).map((segment) => segment.text)
}

test("directory styles", () => {
  assert.deepEqual(render({ directory: { enabled: true, style: "basename" } }), ["project"])
  assert.deepEqual(render({ directory: { enabled: true, style: "full" } }), ["~/project"])
  assert.deepEqual(render({ directory: { enabled: true, style: "fish" } }), ["~/project"])
  assert.deepEqual(
    render({ directory: { enabled: true, style: "fish" } }, snapshot({ directoryDisplay: "~/plugins/powerline" })),
    ["~/p/powerline"],
  )
})

test("git renders branch, ahead/behind and status", () => {
  const [text] = render({ git: { enabled: true, showAheadBehind: true } })
  assert.match(text!, /main/)
  assert.match(text!, /\u21912\u21931/)
  assert.match(text!, /\u25CF/)
})

test("git hides optional data by default", () => {
  const [text] = render({ git: { enabled: true } })
  assert.doesNotMatch(text!, /abc1234/)
  assert.doesNotMatch(text!, /v1\.0\.0/)
})

test("model shows the display name", () => {
  assert.deepEqual(render({ model: { enabled: true } }), ["\u2731 DeepSeek V4.1 Flash"])
  assert.deepEqual(render({ model: { enabled: true, showVariant: true } }), [
    "\u2731 DeepSeek V4.1 Flash \u00B7 high",
  ])
})

test("session tokens and budget", () => {
  const [text] = render({ session: { enabled: true, type: "tokens" } })
  assert.equal(text, "\u00A7 2.0K tokens")
  const [budget] = render({ session: { enabled: true, type: "cost" } })
  assert.equal(budget, "\u00A7 $0.42")
})

test("context text and bar", () => {
  assert.deepEqual(render({ context: { enabled: true } }), ["\u25D4 50.0K (75%)"])
  const [bar] = render({ context: { enabled: true, displayStyle: "blocks" } })
  assert.match(bar!, /\u2588/)
  assert.match(bar!, /25%/)
})

test("block and weekly meters", () => {
  const [block] = render({ block: { enabled: true, displayStyle: "text" } })
  assert.match(block!, /23%/)
  assert.match(block!, /4h 0m/)
  const [weekly] = render({ weekly: { enabled: true, displayStyle: "dots" } })
  assert.match(weekly!, /61%/)
})

test("metrics", () => {
  const [text] = render({ metrics: { enabled: true } })
  assert.match(text!, /\+120/)
  assert.match(text!, /-30/)
  assert.match(text!, /5/)
})

test("agent, thinking, cache timer, version", () => {
  assert.deepEqual(render({ agent: { enabled: true } }), ["\u25C7 build"])
  assert.deepEqual(render({ thinking: { enabled: true } }), ["\u2726 On \u00B7 high"])
  assert.deepEqual(render({ cacheTimer: { enabled: true } }), ["\u25F4 3:42"])
  assert.deepEqual(render({ version: { enabled: true } }), ["\u25C8 v2.2.5"])
})

test("env hides when unset", () => {
  assert.deepEqual(render({ env: { enabled: true, variable: "USER" } }), ["\u2699 USER craig"])
  assert.deepEqual(render({ env: { enabled: true, variable: "MISSING" } }), [])
})

test("missing data hides segments", () => {
  const empty = snapshot({ git: null, session: null, context: null, agent: null })
  assert.deepEqual(
    render(
      {
        git: { enabled: true },
        session: { enabled: true },
        context: { enabled: true },
        agent: { enabled: true },
      },
      empty,
    ),
    [],
  )
})
