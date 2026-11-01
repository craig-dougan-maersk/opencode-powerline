import { finite, sumTokens } from "../core/format.ts"
import type { Meter, UsageTotals } from "../core/types.ts"

export interface UsageSnapshot {
  block: Meter | null
  weekly: Meter | null
  monthGo: Meter | null
}

export interface DateRange {
  from: number
  to: number
}

function meter(value: any): Meter | null {
  if (!value) return null
  const percent = finite(value.percent)
  const resetsAt = finite(value.resetsAt)
  if (resetsAt <= 0) return null
  return { percent, resetsAt, limited: Boolean(value.limited) }
}

export async function fetchUsageLimits(
  client: any,
  location: { directory?: string } | undefined,
): Promise<UsageSnapshot> {
  try {
    const output = await client.experimental.usage.limits(location ? { location } : undefined)
    const data = output?.data
    if (!data?.go) return { block: null, weekly: null, monthGo: null }
    return {
      block: meter(data.go.rolling),
      weekly: meter(data.go.weekly),
      monthGo: meter(data.go.monthly),
    }
  } catch {
    return { block: null, weekly: null, monthGo: null }
  }
}

export async function fetchStats(
  client: any,
  range: DateRange,
  timezone: string,
): Promise<UsageTotals | null> {
  try {
    const info = await client.experimental.session.stats({
      from: range.from,
      to: range.to,
      timezone,
      tools: "none",
    })
    return {
      cost: finite(info?.cost),
      tokens: sumTokens(info?.tokens).total,
    }
  } catch {
    return null
  }
}

export function dayRange(now: number): DateRange {
  const date = new Date(now)
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  return { from: start, to: now }
}

export function monthRange(now: number): DateRange {
  const date = new Date(now)
  const start = new Date(date.getFullYear(), date.getMonth(), 1).getTime()
  return { from: start, to: now }
}

export function localTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  } catch {
    return "UTC"
  }
}
