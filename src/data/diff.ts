import { finite } from "../core/format.ts"

export interface DiffTotals {
  additions: number
  deletions: number
}

const cache = new Map<string, { at: number; value: Promise<DiffTotals | null> }>()

export function invalidateDiffCache(sessionID?: string): void {
  if (!sessionID) {
    cache.clear()
    return
  }
  for (const key of cache.keys()) {
    if (key.startsWith(`${sessionID}\u0000`)) cache.delete(key)
  }
}

export async function fetchSessionDiff(
  client: any,
  sessionID: string,
  from?: string,
  to?: string,
): Promise<DiffTotals | null> {
  try {
    const files = await client.session.diff({
      sessionID,
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      context: 0,
    })
    let additions = 0
    let deletions = 0
    for (const file of files ?? []) {
      additions += finite(file?.additions)
      deletions += finite(file?.deletions)
    }
    return { additions, deletions }
  } catch {
    return null
  }
}

export function getSessionDiffCached(
  client: any,
  sessionID: string,
  from?: string,
  to?: string,
  ttlMs = 5000,
): Promise<DiffTotals | null> {
  const key = `${sessionID}\u0000${from ?? ""}\u0000${to ?? ""}`
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && now - hit.at < ttlMs) return hit.value
  const value = fetchSessionDiff(client, sessionID, from, to)
  cache.set(key, { at: now, value })
  return value
}
