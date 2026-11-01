import { execFile } from "node:child_process"
import { promisify } from "node:util"

const exec = promisify(execFile)
const cache = new Map<string, { at: number; value: Promise<string | null> }>()

export function getTmuxSessionCached(ttlMs = 10_000): Promise<string | null> {
  const key = process.env.TMUX ?? ""
  if (!key) return Promise.resolve(null)
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && now - hit.at < ttlMs) return hit.value
  const value = exec("tmux", ["display-message", "-p", "#S"], {
    encoding: "utf8",
    timeout: 500,
  })
    .then((result) => result.stdout.trim() || null)
    .catch(() => null)
  cache.set(key, { at: now, value })
  return value
}
