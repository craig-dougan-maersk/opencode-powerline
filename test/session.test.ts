import test from "node:test"
import assert from "node:assert/strict"
import {
  agentName,
  cacheTimer,
  contextInfo,
  metricsInfo,
  modelDisplay,
  resolveBuffer,
  sessionTotals,
  thinkingInfo,
} from "../src/data/session.ts"

const models = [
  { id: "model-a", providerID: "provider", name: "Model A", limit: { context: 200_000 }, variants: ["default", "high"] },
]

const messages = [
  { id: "msg_1", type: "user", time: { created: 1000 } },
  {
    id: "msg_2",
    type: "assistant",
    agent: "build",
    model: { providerID: "provider", id: "model-a", variant: "high" },
    time: { created: 2000, completed: 7000 },
    tokens: { input: 100, output: 50, reasoning: 0, cache: { read: 10, write: 0 } },
    cost: 0.12,
  },
  { id: "msg_3", type: "user", time: { created: 8000 } },
  {
    id: "msg_4",
    type: "assistant",
    agent: "build",
    model: { providerID: "provider", id: "model-a" },
    time: { created: 9000, completed: 11_000 },
    tokens: { input: 200, output: 100, reasoning: 0, cache: { read: 0, write: 0 } },
    cost: 0.2,
  },
]

test("resolveBuffer accepts tokens and percentages", () => {
  assert.equal(resolveBuffer(1000, 200_000), 1000)
  assert.equal(resolveBuffer("20%", 200_000), 40_000)
  assert.equal(resolveBuffer(undefined, 200_000), 0)
})

test("contextInfo uses the last assistant message", () => {
  const info = contextInfo(messages, models, undefined, 0)
  assert.equal(info?.tokens, 300)
  assert.equal(info?.limit, 200_000)
  assert.equal(info?.percent, 0.15)
})

test("contextInfo honours a buffer", () => {
  const info = contextInfo(messages, models, undefined, 100)
  assert.equal(info?.usable, 199_900)
})

test("contextInfo honours a revert boundary", () => {
  const info = contextInfo(messages, models, "msg_4", 0)
  assert.equal(info?.tokens, 160)
})

test("sessionTotals sums cost and tokens", () => {
  const totals = sessionTotals({ cost: 0.5, tokens: { input: 300, output: 150, reasoning: 0, cache: { read: 10, write: 0 } } }, messages)
  assert.equal(totals?.cost, 0.5)
  assert.equal(totals?.calculatedCost, 0.32)
  assert.equal(totals?.tokens.total, 460)
})

test("metricsInfo computes timings", () => {
  const metrics = metricsInfo({ time: { created: 1000 } }, messages, 12_000, { additions: 10, deletions: 4 })
  assert.equal(metrics?.messages, 2)
  assert.equal(metrics?.responseTime, 7)
  assert.equal(metrics?.lastResponseTime, 2)
  assert.equal(metrics?.duration, 11)
  assert.equal(metrics?.linesAdded, 10)
  assert.equal(metrics?.linesRemoved, 4)
})

test("agent, model and thinking", () => {
  assert.equal(agentName({}, messages, [{ id: "build", name: "Build" }]), "Build")
  const model = modelDisplay({ providerID: "provider", id: "model-a", variant: "high" }, models)
  assert.equal(model?.name, "Model A")
  assert.equal(model?.variant, "high")
  assert.deepEqual(thinkingInfo({ providerID: "provider", id: "model-a", variant: "high" }, models), {
    enabled: true,
    effort: "high",
  })
  assert.equal(thinkingInfo({ providerID: "provider", id: "model-a" }, models)?.enabled, false)
})

test("cacheTimer uses the last user message", () => {
  const timer = cacheTimer(messages, 20_000, 300)
  assert.equal(timer?.elapsed, 12)
  assert.equal(timer?.ttl, 300)
  assert.equal(cacheTimer([], 20_000, 300), null)
})
