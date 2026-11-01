/** @jsxImportSource @opentui/solid */
import { createEffect, createMemo, createSignal, type Accessor } from "solid-js"
import { useTerminalDimensions } from "@opentui/solid"
import type { PowerlineConfig } from "../core/types.ts"
import { buildAllSegments } from "../core/segments.ts"
import { layoutRows } from "../core/layout.ts"
import { resolveTheme } from "../core/themes.ts"
import { appBackground, hostPalette, monoEnabled } from "./host.ts"
import { useSnapshot } from "./snapshot.ts"
import { Powerline } from "./powerline.tsx"

export function Statusline(props: {
  context: any
  config: Accessor<PowerlineConfig>
  reload?: (directory?: string) => void | Promise<void>
  sessionID?: Accessor<string | undefined>
  fill?: boolean
  singleRow?: boolean
}) {
  const handle = useSnapshot(props.context, props.sessionID, props.config)
  const dimensions = useTerminalDimensions()
  const [measured, setMeasured] = createSignal(0)

  const fill = () => props.fill !== false
  const width = () => (fill() ? measured() || dimensions().width : dimensions().width)

  const host = createMemo(() => hostPalette(props.context.theme))
  const resolved = createMemo(() =>
    resolveTheme({
      theme: props.config().theme,
      host: host(),
      custom: props.config().colors?.custom,
      colorCompatibility: props.config().display.colorCompatibility,
      mono: monoEnabled(process.env),
    }),
  )

  const layoutConfig = createMemo(() => {
    const config = props.config()
    if (!props.singleRow) return config
    return {
      ...config,
      display: { ...config.display, autoWrap: false, maxRows: 1, padding: 0 },
    }
  })

  const segments = createMemo(() => buildAllSegments(layoutConfig(), handle.snapshot(), resolved().colors))
  const rows = createMemo(() => layoutRows(segments(), width(), layoutConfig()))
  const background = createMemo(() => appBackground(props.context.theme))

  let lastDirectory: string | undefined
  createEffect(() => {
    const directory = handle.directory()
    if (!directory || directory === lastDirectory) return
    lastDirectory = directory
    void props.reload?.(directory)
  })

  return (
    <box
      width={fill() ? "100%" : "auto"}
      onSizeChange={function (this: any) {
        const value = this.width
        if (value > 0 && value !== measured()) setMeasured(value)
      }}
    >
      <Powerline
        rows={rows}
        config={layoutConfig}
        colors={() => resolved().colors}
        background={background()}
        foreground={host().text}
        mono={resolved().mono}
      />
    </box>
  )
}
