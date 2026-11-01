import { execFile } from "node:child_process"
import { existsSync, readFileSync, statSync } from "node:fs"
import { basename, dirname, join, resolve } from "node:path"
import { promisify } from "node:util"
import type { GitInfo } from "../core/types.ts"

const exec = promisify(execFile)

export interface GitOptions {
  showSha?: boolean
  showWorkingTree?: boolean
  showOperation?: boolean
  showTag?: boolean
  showTimeSinceCommit?: boolean
  showStashCount?: boolean
  showUpstream?: boolean
  showRepoName?: boolean
  showWorktree?: boolean
}

const cache = new Map<string, { at: number; value: Promise<GitInfo | null> }>()

export function invalidateGitCache(directory?: string): void {
  if (!directory) {
    cache.clear()
    return
  }
  for (const key of cache.keys()) {
    if (key.startsWith(`${directory}\u0000`)) cache.delete(key)
  }
}

export function getGitInfoCached(
  directory: string,
  options: GitOptions,
  ttlMs = 2000,
): Promise<GitInfo | null> {
  const key = `${directory}\u0000${JSON.stringify(options)}`
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && now - hit.at < ttlMs) return hit.value
  const value = getGitInfo(directory, options).catch(() => null)
  cache.set(key, { at: now, value })
  return value
}

async function run(args: string[], cwd: string): Promise<string> {
  const result = await exec("git", args, {
    cwd,
    encoding: "utf8",
    timeout: 2000,
    maxBuffer: 1024 * 1024,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
  })
  return result.stdout
}

function findRepoRoot(start: string): string | null {
  let current = resolve(start)
  for (;;) {
    try {
      if (existsSync(join(current, ".git"))) return current
    } catch {
      return null
    }
    const parent = dirname(current)
    if (parent === current) return null
    current = parent
  }
}

function resolveGitDir(repo: string): string {
  const dotGit = join(repo, ".git")
  try {
    if (statSync(dotGit).isFile()) {
      const content = readFileSync(dotGit, "utf8")
      const match = content.match(/^gitdir:\s*(.+)$/m)
      if (match?.[1]) return resolve(repo, match[1].trim())
    }
  } catch {
    // fall through
  }
  return dotGit
}

function ongoingOperation(repo: string): string | undefined {
  const gitDir = resolveGitDir(repo)
  try {
    if (existsSync(join(gitDir, "MERGE_HEAD"))) return "MERGE"
    if (existsSync(join(gitDir, "CHERRY_PICK_HEAD"))) return "CHERRY-PICK"
    if (existsSync(join(gitDir, "REVERT_HEAD"))) return "REVERT"
    if (existsSync(join(gitDir, "BISECT_LOG"))) return "BISECT"
    if (existsSync(join(gitDir, "rebase-merge")) || existsSync(join(gitDir, "rebase-apply"))) {
      return "REBASE"
    }
  } catch {
    // ignore
  }
  return undefined
}

interface StatusResult {
  branch: string
  status: GitInfo["status"]
  ahead: number
  behind: number
  staged: number
  unstaged: number
  untracked: number
  conflicts: number
  upstream?: string
}

export function parseGitStatus(output: string): StatusResult {
  const result: StatusResult = {
    branch: "detached",
    status: "clean",
    ahead: 0,
    behind: 0,
    staged: 0,
    unstaged: 0,
    untracked: 0,
    conflicts: 0,
  }

  const lines = output.split("\n")
  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line) continue

    if (line.startsWith("# branch.head ")) {
      const value = line.slice("# branch.head ".length).trim()
      result.branch = value === "(detached)" ? "detached" : value
      continue
    }
    if (line.startsWith("# branch.upstream ")) {
      result.upstream = line.slice("# branch.upstream ".length).trim()
      continue
    }
    if (line.startsWith("# branch.ab ")) {
      const match = line.match(/\+(\d+)\s+-(\d+)/)
      if (match) {
        result.ahead = Number(match[1])
        result.behind = Number(match[2])
      }
      continue
    }
    if (line.startsWith("## ")) {
      const value = line.slice(3)
      const branch = value.split("...")[0]?.replace(/^No commits yet on /, "").replace(/^Initial commit on /, "")
      if (branch && branch !== "HEAD (no branch)") result.branch = branch
      const ab = value.match(/\[(?:ahead (\d+))?(?:, )?(?:behind (\d+))?\]/)
      if (ab) {
        result.ahead = Number(ab[1] ?? 0)
        result.behind = Number(ab[2] ?? 0)
      }
      continue
    }
    if (line.startsWith("? ")) {
      result.untracked++
      continue
    }
    if (line.startsWith("u ")) {
      result.conflicts++
      continue
    }
    if (line.startsWith("1 ") || line.startsWith("2 ")) {
      const xy = line.slice(2, 4)
      const index = xy[0] ?? "."
      const worktree = xy[1] ?? "."
      if (index === "U" || worktree === "U" || xy === "AA" || xy === "DD") {
        result.conflicts++
        continue
      }
      if (index !== ".") result.staged++
      if (worktree !== ".") result.unstaged++
    }
  }

  if (result.conflicts > 0) result.status = "conflicts"
  else if (result.staged + result.unstaged + result.untracked > 0) result.status = "dirty"
  return result
}

function parseRemoteName(url: string, repo: string): string {
  const trimmed = url.trim()
  if (!trimmed) return basename(repo)
  const match = trimmed.match(/\/([^/]+?)(?:\.git)?$/) ?? trimmed.match(/:([^/:]+?)(?:\.git)?$/)
  return match?.[1] ?? basename(repo)
}

async function mainWorktree(repo: string): Promise<string | undefined> {
  try {
    const output = await run(["worktree", "list", "--porcelain"], repo)
    const line = output.split("\n").find((item) => item.startsWith("worktree "))
    return line ? line.slice("worktree ".length).trim() : undefined
  } catch {
    return undefined
  }
}

export async function getGitInfo(directory: string, options: GitOptions): Promise<GitInfo | null> {
  const repo = findRepoRoot(directory)
  if (!repo) return null

  let status: StatusResult
  try {
    status = parseGitStatus(await run(["status", "--porcelain=v2", "--branch"], repo))
  } catch {
    return null
  }

  const result: GitInfo = {
    branch: status.branch || "detached",
    status: status.status,
    ahead: status.ahead,
    behind: status.behind,
  }

  if (options.showWorkingTree) {
    result.staged = status.staged
    result.unstaged = status.unstaged
    result.untracked = status.untracked
    result.conflicts = status.conflicts
  }
  if (options.showUpstream && status.upstream) result.upstream = status.upstream
  if (options.showOperation) result.operation = ongoingOperation(repo)

  const jobs: Array<Promise<void>> = []

  if (options.showSha) {
    jobs.push(
      run(["rev-parse", "--short=7", "HEAD"], repo)
        .then((output) => {
          const sha = output.trim()
          if (sha) result.sha = sha
        })
        .catch(() => undefined),
    )
  }

  if (options.showTag) {
    jobs.push(
      run(["describe", "--tags", "--abbrev=0"], repo)
        .then((output) => {
          const tag = output.trim()
          if (tag) result.tag = tag
        })
        .catch(() => undefined),
    )
  }

  if (options.showTimeSinceCommit) {
    jobs.push(
      run(["log", "-1", "--format=%ct"], repo)
        .then((output) => {
          const timestamp = Number(output.trim())
          if (Number.isFinite(timestamp) && timestamp > 0) {
            result.timeSinceCommit = Math.max(0, Math.floor(Date.now() / 1000 - timestamp))
          }
        })
        .catch(() => undefined),
    )
  }

  if (options.showStashCount) {
    jobs.push(
      run(["stash", "list"], repo)
        .then((output) => {
          result.stashCount = output.trim() ? output.trim().split("\n").length : 0
        })
        .catch(() => undefined),
    )
  }

  if (options.showRepoName) {
    jobs.push(
      run(["config", "--get", "remote.origin.url"], repo)
        .then((output) => {
          result.repoName = parseRemoteName(output, repo)
        })
        .catch(() => {
          result.repoName = basename(repo)
        }),
    )
  }

  if (options.showWorktree) {
    jobs.push(
      run(["rev-parse", "--git-dir", "--git-common-dir"], repo)
        .then(async (output) => {
          const [gitDir, commonDir] = output.trim().split("\n")
          if (gitDir && commonDir && resolve(repo, gitDir) !== resolve(repo, commonDir)) {
            result.isWorktree = true
            result.mainWorktree = await mainWorktree(repo)
          }
        })
        .catch(() => undefined),
    )
  }

  await Promise.all(jobs)
  return result
}
