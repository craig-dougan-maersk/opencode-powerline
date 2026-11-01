import { finite, sumTokens } from "../core/format.ts"
import type { MetricsInfo, Snapshot, TokenTotals } from "../core/types.ts"

type AnyMessage = Record<string, any>

export function messageTokens(message: AnyMessage): TokenTotals {
  return sumTokens(message?.tokens)
}

export function lastAssistantWithUsage(
  messages: readonly AnyMessage[],
  boundary?: string,
): AnyMessage | undefined {
  let list = messages
  if (boundary) {
    const index = messages.findIndex((message) => message?.id === boundary)
    if (index >= 0) list = messages.slice(0, index)
  }
  for (let i = list.length - 1; i >= 0; i--) {
    const message = list[i]
    if (message?.type === "assistant" && messageTokens(message).total > 0) return message
  }
  return undefined
}

export function resolveBuffer(buffer: unknown, limit: number): number {
  if (typeof buffer === "number" && Number.isFinite(buffer) && buffer > 0) return buffer
  if (typeof buffer === "string" && buffer.endsWith("%")) {
    const percent = Number.parseFloat(buffer)
    if (Number.isFinite(percent) && percent > 0) return (limit * percent) / 100
  }
  return 0
}

export function contextInfo(
  messages: readonly AnyMessage[],
  models: readonly any[] | undefined,
  boundary: string | undefined,
  buffer: number,
): Snapshot["context"] {
  const last = lastAssistantWithUsage(messages, boundary)
  if (!last) return null
  const tokens = messageTokens(last).total
  if (tokens <= 0) return null
  const providerID = last?.model?.providerID
  const modelID = last?.model?.id
  const model = models?.find(
    (item) => item?.providerID === providerID && (item?.id === modelID || item?.modelID === modelID),
  )
  const limit = finite(model?.limit?.context)
  if (limit <= 0) return null
  const usable = Math.max(1, limit - Math.max(0, buffer))
  return {
    tokens,
    limit,
    usable,
    percent: Math.min(100, (tokens / usable) * 100),
  }
}

export function sessionTotals(
  session: any,
  messages: readonly AnyMessage[],
): Snapshot["session"] {
  if (!session) return null
  const tokens = sumTokens(session.tokens)
  let calculatedCost = 0
  for (const message of messages) {
    if (message?.type !== "assistant") continue
    calculatedCost += finite(message?.cost)
  }
  return {
    cost: finite(session.cost),
    calculatedCost,
    tokens,
  }
}

export function metricsInfo(
  session: any,
  messages: readonly AnyMessage[],
  now: number,
  diff?: { additions: number; deletions: number } | null,
): MetricsInfo | null {
  if (!session) return null
  let responseTime = 0
  let lastResponseTime = 0
  let messagesCount = 0
  let first = Number.POSITIVE_INFINITY

  for (const message of messages) {
    if (message?.type === "user") messagesCount++
    const created = finite(message?.time?.created)
    if (created > 0) first = Math.min(first, created)
    if (message?.type !== "assistant") continue
    const completed = finite(message?.time?.completed)
    if (created > 0 && completed >= created) {
      const seconds = (completed - created) / 1000
      responseTime += seconds
      lastResponseTime = seconds
    }
  }

  const start = Number.isFinite(first) ? first : finite(session?.time?.created)
  const duration = start > 0 ? Math.max(0, (now - start) / 1000) : 0

  return {
    responseTime,
    lastResponseTime,
    duration,
    messages: messagesCount,
    linesAdded: diff?.additions ?? 0,
    linesRemoved: diff?.deletions ?? 0,
  }
}

export function agentID(session: any, messages: readonly AnyMessage[]): string | undefined {
  if (session?.agent) return session.agent
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message?.type === "agent-switched" && message.agent) return message.agent
    if (message?.type === "assistant" && message.agent) return message.agent
  }
  return undefined
}

export function agentName(
  session: any,
  messages: readonly AnyMessage[],
  agents: readonly any[] | undefined,
): string | null {
  const id = agentID(session, messages)
  if (!id) return null
  const agent = agents?.find((item) => item?.id === id)
  return agent?.name ?? id
}

export function modelRef(session: any, messages: readonly AnyMessage[]): any | undefined {
  if (session?.model) return session.model
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message?.type === "model-switched" && message.model) return message.model
    if (message?.type === "assistant" && message.model) return message.model
  }
  return undefined
}

export function modelDisplay(
  ref: any,
  models: readonly any[] | undefined,
): Snapshot["model"] {
  if (!ref?.providerID || !ref?.id) return null
  const model = models?.find(
    (item) => item?.providerID === ref.providerID && (item?.id === ref.id || item?.modelID === ref.id),
  )
  return {
    name: model?.name ?? ref.id,
    provider: model?.providerID ?? ref.providerID,
    variant: ref.variant,
  }
}

export function thinkingInfo(
  ref: any,
  models: readonly any[] | undefined,
): Snapshot["thinking"] {
  if (!ref?.providerID || !ref?.id) return null
  const model = models?.find(
    (item) => item?.providerID === ref.providerID && (item?.id === ref.id || item?.modelID === ref.id),
  )
  const variants: string[] = Array.isArray(model?.variants)
    ? model.variants.map((variant: any) => (typeof variant === "string" ? variant : variant?.id)).filter(Boolean)
    : []
  if (variants.length === 0 && !ref.variant) return null
  const effort = ref.variant && ref.variant !== "default" ? ref.variant : undefined
  return {
    enabled: Boolean(effort),
    effort,
  }
}

export function cacheTimer(
  messages: readonly AnyMessage[],
  now: number,
  ttl: number,
): Snapshot["cacheTimer"] {
  let last: number | undefined
  for (const message of messages) {
    if (message?.type !== "user") continue
    const created = finite(message?.time?.created)
    if (created > 0) last = created
  }
  if (!last) return null
  return {
    elapsed: Math.max(0, (now - last) / 1000),
    ttl,
  }
}
