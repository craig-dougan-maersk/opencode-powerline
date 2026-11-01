import { DEFAULT_CONFIG, loadConfig, watchConfigFiles } from "../core/config.ts"
import type { PowerlineConfig } from "../core/types.ts"

export interface ConfigController {
  state: {
    config: PowerlineConfig
    files: string[]
    errors: Array<{ path: string; message: string }>
  }
  reload(directory?: string): Promise<void>
  dispose(): void
}

export function createConfigController(context: any): ConfigController {
  const [state, update] = context.storage.memory("powerline", {
    initial: {
      config: DEFAULT_CONFIG,
      files: [] as string[],
      errors: [] as Array<{ path: string; message: string }>,
    },
  })

  let stopWatch: (() => void) | undefined
  let currentDirectory: string | undefined
  let generation = 0

  async function reload(directory?: string): Promise<void> {
    const target = directory ?? currentDirectory ?? context.location?.directory ?? process.cwd()
    currentDirectory = target
    const mine = ++generation
    const loaded = await loadConfig({
      cwd: target,
      env: process.env,
      options: context.options,
    })
    if (mine !== generation) return
    update((draft: any) => {
      draft.config = loaded.config
      draft.files = loaded.files
      draft.errors = loaded.errors
    })
    stopWatch?.()
    stopWatch = watchConfigFiles(loaded.files, () => {
      void reload(target)
    })
  }

  return {
    state,
    reload,
    dispose: () => stopWatch?.(),
  }
}
