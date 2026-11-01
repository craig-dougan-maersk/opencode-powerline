import { buildBar } from "./bars.ts"
import {
  abbreviateFishStyle,
  basename,
  formatCacheTimer,
  formatCost,
  formatCountdown,
  formatDuration,
  formatPercent,
  formatResponseTime,
  formatTokenBreakdown,
  formatTokenCount,
  formatTokens,
  formatTimeSince,
  pacePercentage,
} from "./format.ts"
import type { SymbolSet } from "./symbols.ts"
import { symbolsFor } from "./symbols.ts"
import type {
  BudgetConfig,
  ColorTheme,
  LineConfig,
  PowerlineConfig,
  RenderedSegment,
  SegmentConfig,
  SegmentType,
  Snapshot,
  TokenTotals,
  UsageType,
} from "./types.ts"

const BLOCK_WINDOW_MS = 5 * 60 * 60 * 1000
const WEEKLY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

function shouldShowIcon(global: boolean | undefined, local: boolean | undefined): boolean {
  if (local !== undefined) return local
  return global !== false
}

function icon(symbols: SymbolSet, symbol: string, config: SegmentConfig, global: boolean | undefined): string {
  if (!symbol) return ""
  return shouldShowIcon(global, config.showIcon) ? `${symbol} ` : ""
}

function colorsFor(
  theme: ColorTheme,
  key: keyof ColorTheme,
  tone?: "normal" | "warning" | "critical",
): { bg: string; fg: string; bold?: boolean } {
  const base = tone === "critical" ? theme.contextCritical : tone === "warning" ? theme.contextWarning : theme[key]
  return {
    bg: base.bg ?? "#333333",
    fg: base.fg ?? "#ffffff",
    bold: base.bold,
  }
}

function formatUsage(
  type: UsageType | "time" | "weighted" | undefined,
  cost: number,
  tokens: TokenTotals | number,
  showUnits: boolean,
): string {
  const total = typeof tokens === "number" ? tokens : tokens.total
  switch (type) {
    case "cost":
      return formatCost(cost)
    case "tokens":
      return formatTokens(total, showUnits)
    case "breakdown":
      return typeof tokens === "number" ? formatTokens(tokens, showUnits) : formatTokenBreakdown(tokens)
    case "both":
      return `${formatCost(cost)} (${formatTokenCount(total)}${showUnits ? " tokens" : ""})`
    default:
      return formatTokens(total, showUnits)
  }
}

function budgetSuffix(
  cost: number,
  tokens: number,
  budget: BudgetConfig | undefined,
  config: SegmentConfig,
): string {
  if (!budget || !budget.amount || budget.amount <= 0) return ""
  const value = budget.type === "tokens" ? tokens : cost
  if (!Number.isFinite(value)) return ""
  const percent = (value / budget.amount) * 100
  const showPercentage = budget.showPercentage !== false
  const showValue = budget.showValue !== false
  if (!showPercentage && !showValue) return ""
  const threshold = budget.warningThreshold ?? 80
  const marker = percent >= threshold ? "!" : percent >= 50 ? "+" : ""
  const percentage = `${marker}${Math.round(percent)}%`
  const base = budget.type === "tokens" ? formatTokenCount(value) : formatCost(value)
  if (showPercentage) return ` (${percentage})`
  return ` (${base})`
}

function buildSegment(
  type: SegmentType,
  config: SegmentConfig,
  snapshot: Snapshot,
  theme: ColorTheme,
  symbols: SymbolSet,
  globalShowIcons: boolean | undefined,
  powerline: PowerlineConfig,
): RenderedSegment | null {
  const make = (text: string, key: keyof ColorTheme, tone?: "normal" | "warning" | "critical"): RenderedSegment => {
    const colors = colorsFor(theme, key, tone)
    return {
      type,
      text,
      bg: colors.bg,
      fg: colors.fg,
      bold: colors.bold,
      config,
    }
  }

  switch (type) {
    case "directory": {
      const raw = snapshot.worktreeOriginal ?? snapshot.directoryDisplay ?? snapshot.directory
      if (!raw) return null
      const style = config.style ?? "full"
      const text =
        style === "basename" ? basename(raw) : style === "fish" ? abbreviateFishStyle(raw) : raw
      return make(`${icon(symbols, "", config, globalShowIcons)}${text}`, "directory")
    }

    case "git": {
      const git = snapshot.git
      if (!git) return null
      const parts: string[] = []
      if (config.showRepoName && git.repoName) parts.push(git.repoName)
      if (git.isWorktree) parts.push(symbols.gitWorktree)
      if (config.showOperation && git.operation) parts.push(`[${git.operation}]`)
      parts.push(
        shouldShowIcon(globalShowIcons, config.showIcon)
          ? `${symbols.branch} ${git.branch}`
          : git.branch,
      )
      if (config.showTag && git.tag) parts.push(`${symbols.gitTag} ${git.tag}`)
      if (config.showSha && git.sha) parts.push(`${symbols.gitSha} ${git.sha}`)
      if (config.showAheadBehind !== false) {
        if (git.ahead > 0 && git.behind > 0) {
          parts.push(`${symbols.gitAhead}${git.ahead}${symbols.gitBehind}${git.behind}`)
        } else if (git.ahead > 0) {
          parts.push(`${symbols.gitAhead}${git.ahead}`)
        } else if (git.behind > 0) {
          parts.push(`${symbols.gitBehind}${git.behind}`)
        }
      }
      if (config.showWorkingTree) {
        const counts: string[] = []
        if (git.staged && git.staged > 0) counts.push(`+${git.staged}`)
        if (git.unstaged && git.unstaged > 0) counts.push(`~${git.unstaged}`)
        if (git.untracked && git.untracked > 0) counts.push(`?${git.untracked}`)
        if (git.conflicts && git.conflicts > 0) counts.push(`!${git.conflicts}`)
        if (counts.length > 0) parts.push(`(${counts.join(" ")})`)
      }
      if (config.showUpstream && git.upstream) parts.push(`${symbols.gitUpstream}${git.upstream}`)
      if (config.showStashCount && git.stashCount && git.stashCount > 0) {
        parts.push(`${symbols.gitStash} ${git.stashCount}`)
      }
      if (config.showTimeSinceCommit && git.timeSinceCommit !== undefined) {
        parts.push(`${symbols.gitTime} ${formatTimeSince(git.timeSinceCommit)}`)
      }
      parts.push(
        git.status === "conflicts"
          ? symbols.gitConflicts
          : git.status === "dirty"
            ? symbols.gitDirty
            : symbols.gitClean,
      )
      return make(parts.join(" "), "git")
    }

    case "model": {
      if (!snapshot.model?.name) return null
      let text = snapshot.model.name
      if (config.showVariant && snapshot.model.variant && snapshot.model.variant !== "default") {
        text += ` \u00B7 ${snapshot.model.variant}`
      }
      return make(`${icon(symbols, symbols.model, config, globalShowIcons)}${text}`, "model")
    }

    case "session": {
      const session = snapshot.session
      if (!session) return null
      const cost = config.costSource === "official" ? session.cost : session.calculatedCost || session.cost
      const value = formatUsage(config.type ?? "tokens", cost, session.tokens, config.showUnits !== false)
      const suffix = budgetSuffix(cost, session.tokens.total, powerline.budget.session, config)
      return make(`${icon(symbols, symbols.sessionCost, config, globalShowIcons)}${value}${suffix}`, "session")
    }

    case "today":
    case "month": {
      const totals = type === "today" ? snapshot.today : snapshot.month
      if (!totals) return null
      if (type === "month" && config.source === "go" && snapshot.monthGo) {
        const meter = snapshot.monthGo
        const countdown = formatCountdown(meter.resetsAt - snapshot.now)
        return make(
          `${icon(symbols, symbols.monthCost, config, globalShowIcons)}${Math.round(meter.percent)}% (${countdown})`,
          "month",
        )
      }
      const value = formatUsage(config.type ?? "cost", totals.cost, totals.tokens, config.showUnits !== false)
      const suffix = budgetSuffix(
        totals.cost,
        totals.tokens,
        type === "today" ? powerline.budget.today : powerline.budget.month,
        config,
      )
      return make(
        `${icon(symbols, type === "today" ? symbols.todayCost : symbols.monthCost, config, globalShowIcons)}${value}${suffix}`,
        type,
      )
    }

    case "block":
    case "weekly": {
      const meter = type === "block" ? snapshot.block : snapshot.weekly
      if (!meter) return null
      const windowMs = type === "block" ? BLOCK_WINDOW_MS : WEEKLY_WINDOW_MS
      const pace = config.showPace ? pacePercentage(meter.resetsAt, windowMs, snapshot.now) : undefined
      const bar = buildBar(meter.percent, config.displayStyle, 10, pace)
      const percent = `${Math.round(meter.percent)}%${pace !== undefined ? `/${Math.round(pace)}%` : ""}`
      const value = bar ? `${bar.text} ${percent}` : percent
      const countdown = formatCountdown(meter.resetsAt - snapshot.now)
      return make(
        `${icon(symbols, type === "block" ? symbols.blockCost : symbols.weeklyCost, config, globalShowIcons)}${value} (${countdown})`,
        type,
        meter.limited ? "critical" : undefined,
      )
    }

    case "context": {
      const context = snapshot.context
      if (!context) return null
      const used = context.percent
      const mode = config.percentageMode ?? (config.displayStyle && config.displayStyle !== "text" ? "used" : "remaining")
      const shown = mode === "remaining" ? Math.max(0, 100 - used) : used
      const bar = buildBar(shown, config.displayStyle, 10)
      let value: string
      if (bar) {
        value = `${bar.text} ${formatPercent(shown)}`
      } else if (config.showPercentageOnly) {
        value = formatPercent(shown)
      } else {
        value = `${formatTokenCount(context.tokens)} (${formatPercent(shown)})`
      }
      const tone = used >= 90 ? "critical" : used >= 70 ? "warning" : "normal"
      return make(`${icon(symbols, symbols.contextTime, config, globalShowIcons)}${value}`, "context", tone)
    }

    case "metrics": {
      const metrics = snapshot.metrics
      if (!metrics) return null
      const parts: string[] = []
      if (config.showResponseTime !== false && metrics.responseTime > 0) {
        parts.push(`${symbols.metricsResponse} ${formatResponseTime(metrics.responseTime)}`)
      }
      if (config.showLastResponseTime !== false && metrics.lastResponseTime > 0) {
        parts.push(`${symbols.metricsLastResponse} ${formatResponseTime(metrics.lastResponseTime)}`)
      }
      if (config.showDuration !== false && metrics.duration > 0) {
        parts.push(`${symbols.metricsDuration} ${formatDuration(metrics.duration)}`)
      }
      if (config.showMessageCount !== false && metrics.messages > 0) {
        parts.push(`${symbols.metricsMessages} ${metrics.messages}`)
      }
      if (config.showLinesAdded !== false && metrics.linesAdded > 0) {
        parts.push(`+${metrics.linesAdded}`)
      }
      if (config.showLinesRemoved !== false && metrics.linesRemoved > 0) {
        parts.push(`-${metrics.linesRemoved}`)
      }
      if (parts.length === 0) return null
      return make(parts.join(" "), "metrics")
    }

    case "version":
      return make(`${icon(symbols, symbols.version, config, globalShowIcons)}v${snapshot.version}`, "version")

    case "agent": {
      if (!snapshot.agent) return null
      const text = config.showLabel ? `agent: ${snapshot.agent}` : snapshot.agent
      return make(`${icon(symbols, symbols.agent, config, globalShowIcons)}${text}`, "agent")
    }

    case "thinking": {
      const thinking = snapshot.thinking
      if (!thinking) return null
      const parts: string[] = []
      if (config.showEnabled !== false) parts.push(thinking.enabled ? "On" : "Off")
      if (config.showEffort !== false && thinking.effort) parts.push(thinking.effort)
      if (parts.length === 0) return null
      return make(`${icon(symbols, symbols.thinking, config, globalShowIcons)}${parts.join(" \u00B7 ")}`, "thinking")
    }

    case "cacheTimer": {
      const timer = snapshot.cacheTimer
      if (!timer) return null
      const mode = config.displayMode ?? "elapsed"
      const ttl = config.ttlSeconds ?? timer.ttl
      const value = formatCacheTimer(timer.elapsed, mode, ttl)
      const left = Math.max(0, ttl - timer.elapsed)
      const tone =
        mode === "remaining"
          ? left <= 60
            ? "critical"
            : left <= 300
              ? "warning"
              : "normal"
          : timer.elapsed >= ttl
            ? "critical"
            : timer.elapsed >= ttl * 0.6
              ? "warning"
              : "normal"
      return make(`${icon(symbols, symbols.cacheTimer, config, globalShowIcons)}${value}`, "cacheTimer", tone)
    }

    case "tmux":
      if (!snapshot.tmux) return null
      return make(`${icon(symbols, "", config, globalShowIcons)}tmux:${snapshot.tmux}`, "tmux")

    case "sessionId":
      if (!snapshot.sessionID) return null
      return make(
        `${config.showIdLabel !== false ? `${symbols.sessionId} ` : ""}${snapshot.sessionID}`,
        "session",
      )

    case "env": {
      const variable = config.variable
      if (!variable) return null
      const value = snapshot.env[variable]
      if (!value) return null
      const label = config.prefix ?? variable
      return make(`${icon(symbols, symbols.env, config, globalShowIcons)}${label} ${value}`, "env")
    }

    case "outputStyle":
      return null

    case "status": {
      if (!snapshot.sessionID || snapshot.status !== "running") return null
      return make(`${symbols.status} running \u00B7 esc interrupt`, "status")
    }

    default:
      return null
  }
}

/**
 * The budget for today/month lives on the config, passed through buildSegment.
 */

export function buildLineSegments(
  line: LineConfig,
  config: PowerlineConfig,
  snapshot: Snapshot,
  theme: ColorTheme,
): RenderedSegment[] {
  const symbols = symbolsFor(config.display.charset)
  const result: RenderedSegment[] = []
  for (const [key, segmentConfig] of Object.entries(line.segments)) {
    if (!segmentConfig?.enabled) continue
    const type = key as SegmentType
    const rendered = buildSegment(
      type,
      segmentConfig,
      snapshot,
      theme,
      symbols,
      config.display.showIcons,
      config,
    )
    if (rendered && rendered.text.length > 0) result.push(rendered)
  }
  return result
}

export function buildAllSegments(
  config: PowerlineConfig,
  snapshot: Snapshot,
  theme: ColorTheme,
): RenderedSegment[][] {
  return config.display.lines.map((line) => buildLineSegments(line, config, snapshot, theme))
}
