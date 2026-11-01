import type { TokenTotals } from "./types.ts"

export function formatCost(cost: number | null | undefined): string {
  if (cost === null || cost === undefined || !Number.isFinite(cost)) return "$0.00"
  const value = Math.max(0, cost)
  if (value === 0) return "$0.00"
  if (value < 0.01) return "<$0.01"
  return `$${value.toFixed(2)}`
}

export function formatTokenCount(tokens: number | null | undefined): string {
  if (tokens === null || tokens === undefined || !Number.isFinite(tokens) || tokens <= 0) return "0"
  if (tokens >= 999_950) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`
  return `${Math.round(tokens)}`
}

export function formatTokens(tokens: number | null | undefined, showUnits = true): string {
  const value = formatTokenCount(tokens)
  return showUnits ? `${value} tokens` : value
}

export function formatTokenBreakdown(tokens: TokenTotals | null | undefined): string {
  if (!tokens) return "0 tokens"
  const parts: string[] = []
  if (tokens.input > 0) parts.push(`${formatTokenCount(tokens.input)} in`)
  if (tokens.output > 0) parts.push(`${formatTokenCount(tokens.output)} out`)
  const cached = tokens.cacheRead + tokens.cacheWrite
  if (cached > 0) parts.push(`${formatTokenCount(cached)} cached`)
  return parts.length > 0 ? parts.join(" + ") : "0 tokens"
}

export function formatTimeSince(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0s"
  if (seconds < 60) return `${Math.floor(seconds)}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`
  return `${Math.floor(seconds / 604800)}w`
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0s"
  if (seconds < 59.5) return `${seconds.toFixed(0)}s`
  if (seconds < 3570) return `${(seconds / 60).toFixed(0)}m`
  if (seconds < 86220) return `${(seconds / 3600).toFixed(1)}h`
  return `${(seconds / 86400).toFixed(1)}d`
}

export function formatResponseTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0.0s"
  const secs = Math.round(seconds * 10) / 10
  if (secs < 60) return `${secs.toFixed(1)}s`
  const mins = Math.round(seconds / 6) / 10
  if (mins < 60) return `${mins.toFixed(1)}m`
  return `${(seconds / 3600).toFixed(1)}h`
}

export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(total / 60)
  const secs = total % 60
  return `${minutes}:${String(secs).padStart(2, "0")}`
}

export function formatCacheTimer(elapsed: number, mode: "elapsed" | "remaining", ttl: number): string {
  if (mode === "remaining") {
    const left = Math.max(0, ttl - elapsed)
    if (left <= 0) return "cold"
    return left >= 60 ? formatClock(left) : `${Math.ceil(left)}s`
  }
  if (elapsed < 300) return formatClock(elapsed)
  if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m`
  return `${Math.floor(elapsed / 3600)}h+`
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return `${total}s`
}

export function formatPercent(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return "0%"
  return `${Math.max(0, Math.min(100, value)).toFixed(digits)}%`
}

export function formatModelName(name: string | null | undefined, fallback = "Model"): string {
  if (!name) return fallback
  return name.trim() || fallback
}

export function abbreviateFishStyle(path: string): string {
  const separator = path.includes("/") ? "/" : "\\"
  const parts = path.split(separator)
  return parts
    .map((part, index) => {
      if (index === parts.length - 1) return part
      if (part === "~" || part === "") return part
      return part.charAt(0)
    })
    .join(separator)
}

export function basename(path: string): string {
  const cleaned = path.replace(/[\\/]+$/, "")
  const index = Math.max(cleaned.lastIndexOf("/"), cleaned.lastIndexOf("\\"))
  return index >= 0 ? cleaned.slice(index + 1) || "root" : cleaned || "root"
}

function isSeparator(char: string | undefined): boolean {
  return char === "/" || char === "\\"
}

export function pathBelow(path: string, base: string): string | null {
  let end = base.length
  while (end > 1 && isSeparator(base[end - 1])) end--
  const trimmed = base.slice(0, end)
  if (!path.startsWith(trimmed)) return null
  const rest = path.slice(trimmed.length)
  return rest === "" || isSeparator(rest[0]) ? rest : null
}

export function collapseHome(path: string, home?: string): string {
  const resolvedHome = home ?? globalThis.process?.env?.HOME ?? globalThis.process?.env?.USERPROFILE
  const rest = resolvedHome ? pathBelow(path, resolvedHome) : null
  return rest === null ? path : `~${rest}`
}

export function pacePercentage(resetsAt: number, windowMs: number, now: number): number {
  if (!Number.isFinite(resetsAt) || !Number.isFinite(windowMs) || windowMs <= 0) return 0
  const remaining = Math.max(0, Math.min(windowMs, resetsAt - now))
  return Math.max(0, Math.min(100, (1 - remaining / windowMs) * 100))
}

export function sumTokens(tokens: {
  input?: number
  output?: number
  reasoning?: number
  cache?: { read?: number; write?: number }
} | null | undefined): TokenTotals {
  const input = finite(tokens?.input)
  const output = finite(tokens?.output)
  const reasoning = finite(tokens?.reasoning)
  const cacheRead = finite(tokens?.cache?.read)
  const cacheWrite = finite(tokens?.cache?.write)
  return {
    input,
    output,
    reasoning,
    cacheRead,
    cacheWrite,
    total: input + output + reasoning + cacheRead + cacheWrite,
  }
}

export function finite(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}
