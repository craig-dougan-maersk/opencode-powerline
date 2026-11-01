import { createEffect, createMemo, createResource, createSignal, onCleanup } from "solid-js"
import type { Accessor } from "solid-js"
import { join } from "node:path"
import type { PowerlineConfig, SegmentConfig, Snapshot } from "../core/types.ts"
import { finite } from "../core/format.ts"
import {
  agentName,
  cacheTimer,
  contextInfo,
  metricsInfo,
  modelDisplay,
  modelRef,
  resolveBuffer,
  sessionTotals,
  thinkingInfo,
} from "../data/session.ts"
import { fetchStats, fetchUsageLimits, localTimezone } from "../data/usage.ts"
import { getGitInfoCached, invalidateGitCache } from "../data/git.ts"
import { getCompactionCached, invalidateCompactionCache } from "../data/config-docs.ts"
import { getSessionDiffCached, invalidateDiffCache } from "../data/diff.ts"
import { getTmuxSessionCached } from "../data/tmux.ts"
import { demoSnapshot } from "./demo.ts"

function findSegment(config: PowerlineConfig, type: keyof SegmentConfig | string): SegmentConfig | undefined {
  for (const line of config.display.lines) {
    const segment = (line.segments as Record<string, SegmentConfig | undefined>)[type]
    if (segment?.enabled) return segment
  }
  return undefined
}

export interface SnapshotHandle {
  snapshot: Accessor<Snapshot>
  directory: Accessor<string>
  sessionID: Accessor<string | undefined>
}

export function useSnapshot(
  context: any,
  providedSessionID: Accessor<string | undefined> | undefined,
  config: Accessor<PowerlineConfig>,
): SnapshotHandle {
  const [clock, setClock] = createSignal(Date.now())
  const [slowTick, setSlowTick] = createSignal(0)
  const [refresh, setRefresh] = createSignal(0)

  createEffect(() => {
    const interval = Math.max(250, config().tickMs ?? 1000)
    const timer = setInterval(() => setClock(Date.now()), interval)
    onCleanup(() => clearInterval(timer))
  })

  createEffect(() => {
    const timer = setInterval(() => setSlowTick((value) => value + 1), 30_000)
    onCleanup(() => clearInterval(timer))
  })

  const bump = () => {
    invalidateGitCache()
    invalidateCompactionCache()
    invalidateDiffCache()
    setRefresh((value) => value + 1)
  }

  let fsTimer: ReturnType<typeof setTimeout> | undefined
  const onFilesystem = () => {
    if (fsTimer) clearTimeout(fsTimer)
    fsTimer = setTimeout(bump, 500)
  }

  const stops = [
    context.data.on("session.execution.started", bump),
    context.data.on("session.execution.succeeded", bump),
    context.data.on("session.execution.failed", bump),
    context.data.on("session.execution.interrupted", bump),
    context.data.on("session.usage.updated", bump),
    context.data.on("session.model.selected", bump),
    context.data.on("session.agent.selected", bump),
    context.data.on("vcs.branch.updated", bump),
    context.data.on("config.updated", bump),
    context.data.on("filesystem.changed", onFilesystem),
  ]

  onCleanup(() => {
    for (const stop of stops) stop()
    if (fsTimer) clearTimeout(fsTimer)
  })

  const routeSessionID = createMemo(() => {
    const route = context.ui.router.current()
    return route?.type === "session" ? route.sessionID : undefined
  })

  const sessionID = createMemo(() => providedSessionID?.() ?? routeSessionID())

  const session = createMemo(() => {
    const id = sessionID()
    return id ? context.data.session.get(id) : undefined
  })

  const messages = createMemo(() => {
    const id = sessionID()
    return id ? (context.data.session.message.list(id) ?? []) : []
  })

  const location = createMemo(() => {
    const sessionValue = session()
    const directory =
      sessionValue?.location?.directory ??
      context.location?.directory ??
      context.data.location.default()?.directory ??
      process.cwd()
    return { directory }
  })

  const directory = createMemo(() => {
    const base = location().directory
    const subpath = session()?.subpath
    return subpath ? join(base, subpath) : base
  })

  createEffect(() => {
    const id = sessionID()
    if (!id) return
    void context.data.session.message.sync(id).catch(() => undefined)
  })
  createEffect(() => {
    void context.data.location.model.sync(location()).catch(() => undefined)
  })
  createEffect(() => {
    void context.data.location.agent.sync(location()).catch(() => undefined)
  })
  createEffect(() => {
    void context.data.location.vcs.sync(location()).catch(() => undefined)
  })

  const models = createMemo(() => context.data.location.model.list(location()) ?? [])
  const agents = createMemo(() => context.data.location.agent.list(location()) ?? [])

  const [git] = createResource(
    () => [directory(), config(), refresh(), clock()] as const,
    async ([dir, cfg]) => {
      const segment = findSegment(cfg, "git")
      if (!segment) return null
      return getGitInfoCached(
        dir,
        {
          showSha: segment.showSha,
          showWorkingTree: segment.showWorkingTree,
          showOperation: segment.showOperation,
          showTag: segment.showTag,
          showTimeSinceCommit: segment.showTimeSinceCommit,
          showStashCount: segment.showStashCount,
          showUpstream: segment.showUpstream,
          showRepoName: segment.showRepoName,
          showWorktree: segment.showWorktree ?? segment.showRepoName,
        },
        2000,
      )
    },
  )

  const [usage] = createResource(
    () => [slowTick(), refresh(), location().directory] as const,
    async ([, , directoryValue]) => fetchUsageLimits(context.client, { directory: directoryValue }),
  )

  const timezone = localTimezone()

  const [statsToday] = createResource(
    () => [slowTick(), refresh()] as const,
    async () => {
      const now = Date.now()
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      return fetchStats(context.client, { from: start.getTime(), to: now }, timezone)
    },
  )

  const [statsMonth] = createResource(
    () => [slowTick(), refresh()] as const,
    async () => {
      const now = Date.now()
      const start = new Date(now)
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      return fetchStats(context.client, { from: start.getTime(), to: now }, timezone)
    },
  )

  const [compaction] = createResource(
    () => [slowTick(), refresh(), location().directory] as const,
    async ([, , directoryValue]) => getCompactionCached(context.client, { directory: directoryValue }, 30_000),
  )

  const modelRefValue = createMemo(() => modelRef(session(), messages()) ?? context.ui.model.current())
  const model = createMemo(() => modelDisplay(modelRefValue(), models()))

  const modelLimit = createMemo(() => {
    const ref = modelRefValue()
    if (!ref?.providerID || !ref?.id) return finite(config().modelContextLimits?.default)
    const found = models().find(
      (item: any) =>
        item?.providerID === ref.providerID && (item?.id === ref.id || item?.modelID === ref.id),
    )
    return finite(found?.limit?.context) || finite(config().modelContextLimits?.default)
  })

  const contextBuffer = createMemo(() => {
    const value = compaction()
    if (!value) return findSegment(config(), "context")?.autocompactBuffer ?? 0
    if (value.auto === false) return 0
    if (value.buffer === undefined) return findSegment(config(), "context")?.autocompactBuffer ?? 0
    return resolveBuffer(value.buffer, modelLimit())
  })

  const contextValue = createMemo(() =>
    contextInfo(messages(), models(), session()?.revert?.messageID, contextBuffer()),
  )

  const totals = createMemo(() => sessionTotals(session(), messages()))
  const metricsSegment = createMemo(() => findSegment(config(), "metrics"))

  const [diff] = createResource(
    () => {
      const id = sessionID()
      if (!id || !metricsSegment()) return null
      const list = messages()
      const firstUser = list.find((message: any) => message?.type === "user")?.id
      const lastUser = [...list].reverse().find((message: any) => message?.type === "user")?.id
      return [id, firstUser, lastUser, refresh()] as const
    },
    async (source) => {
      if (!source) return null
      const [id, from, to] = source
      return getSessionDiffCached(context.client, id, from, to, 5000)
    },
  )

  const metrics = createMemo(() => metricsInfo(session(), messages(), clock(), diff()))
  const agent = createMemo(() => agentName(session(), messages(), agents()))
  const thinking = createMemo(() => thinkingInfo(modelRefValue(), models()))
  const cacheTtl = createMemo(() => findSegment(config(), "cacheTimer")?.ttlSeconds ?? 300)
  const cache = createMemo(() => cacheTimer(messages(), clock(), cacheTtl()))

  const [tmux] = createResource(
    () => slowTick(),
    async () => getTmuxSessionCached(10_000),
  )

  const directoryDisplay = createMemo(() => {
    try {
      return context.ui.format.path(directory())
    } catch {
      return directory()
    }
  })

  const snapshot = createMemo<Snapshot>(() => {
    const now = clock()
    if (config().demo) return demoSnapshot(now)
    const gitValue = git() ?? null
    const id = sessionID()
    return {
      sessionID: id,
      directory: directory(),
      directoryDisplay: directoryDisplay(),
      worktreeOriginal: gitValue?.isWorktree ? gitValue.mainWorktree : undefined,
      git: gitValue,
      model: model(),
      session: totals(),
      context: contextValue(),
      today: statsToday() ?? null,
      month: statsMonth() ?? null,
      block: usage()?.block ?? null,
      weekly: usage()?.weekly ?? null,
      monthGo: usage()?.monthGo ?? null,
      metrics: metrics(),
      version: context.app.version,
      agent: agent(),
      thinking: thinking(),
      cacheTimer: cache(),
      tmux: tmux() ?? null,
      env: process.env,
      status: id ? context.data.session.status(id) : "idle",
      now,
    }
  })

  return { snapshot, directory, sessionID }
}
