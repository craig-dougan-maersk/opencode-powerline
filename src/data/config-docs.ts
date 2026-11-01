export interface CompactionConfig {
  buffer?: number | string
  auto?: boolean
}

const cache = new Map<string, { at: number; value: Promise<CompactionConfig> }>()

export function invalidateCompactionCache(): void {
  cache.clear()
}

export async function fetchCompaction(
  client: any,
  location: { directory?: string } | undefined,
): Promise<CompactionConfig> {
  try {
    const documents = await client.config.get(location ? { location } : undefined)
    const result: CompactionConfig = {}
    for (const document of documents ?? []) {
      const compaction = document?.info?.compaction
      if (!compaction) continue
      if (compaction.buffer !== undefined) result.buffer = compaction.buffer
      if (compaction.auto !== undefined) result.auto = compaction.auto
    }
    return result
  } catch {
    return {}
  }
}

export function getCompactionCached(
  client: any,
  location: { directory?: string } | undefined,
  ttlMs = 30_000,
): Promise<CompactionConfig> {
  const key = location?.directory ?? ""
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && now - hit.at < ttlMs) return hit.value
  const value = fetchCompaction(client, location)
  cache.set(key, { at: now, value })
  return value
}
