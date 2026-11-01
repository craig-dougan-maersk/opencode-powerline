/** @jsxImportSource @opentui/solid */
import { For, Show, type Accessor } from "solid-js"
import { TextAttributes } from "@opentui/core"
import type { ColorTheme, PowerlineConfig, RenderedSegment } from "../core/types.ts"
import { symbolsFor } from "../core/symbols.ts"

function Sep(props: { prev: string; next: string; glyph: string }) {
  return (
    <box backgroundColor={props.next} width={1} height={1} flexShrink={0}>
      <text fg={props.prev} wrapMode="none">
        {props.glyph}
      </text>
    </box>
  )
}

function SegmentBox(props: { segment: RenderedSegment; padding: number }) {
  return (
    <box
      backgroundColor={props.segment.bg}
      paddingLeft={props.padding}
      paddingRight={props.padding}
      height={1}
      flexShrink={0}
    >
      <text
        fg={props.segment.fg}
        attributes={props.segment.bold ? TextAttributes.BOLD : 0}
        wrapMode="none"
      >
        {props.segment.text}
      </text>
    </box>
  )
}

function Row(props: {
  segments: RenderedSegment[]
  config: PowerlineConfig
  background: string
}) {
  const style = () => props.config.display.style
  const padding = () => props.config.display.padding
  const symbols = () => symbolsFor(props.config.display.charset)
  const nextBackground = (index: number) => props.segments[index + 1]?.bg ?? props.background

  return (
    <box flexDirection="row" height={1} width="100%" flexShrink={0}>
      <For each={props.segments}>
        {(segment, index) => (
          <>
            <Show when={style() === "capsule"}>
              <Sep prev={segment.bg} next={props.background} glyph={symbols().leftRounded} />
            </Show>
            <SegmentBox segment={segment} padding={padding()} />
            <Show when={style() === "capsule"}>
              <Sep prev={segment.bg} next={props.background} glyph={symbols().rightRounded} />
            </Show>
            <Show when={style() === "powerline"}>
              <Sep prev={segment.bg} next={nextBackground(index())} glyph={symbols().right} />
            </Show>
            <Show when={style() === "capsule" && index() < props.segments.length - 1}>
              <box backgroundColor={props.background} width={1} height={1} flexShrink={0}>
                <text wrapMode="none"> </text>
              </box>
            </Show>
          </>
        )}
      </For>
    </box>
  )
}

export function Powerline(props: {
  rows: Accessor<RenderedSegment[][]>
  config: Accessor<PowerlineConfig>
  colors: Accessor<ColorTheme>
  background: string
  foreground: string
  mono: boolean
}) {
  const row = (index: number) => props.rows()[index]

  return (
    <Show
      when={!props.mono}
      fallback={
        <box flexDirection="column" width="100%">
          <For each={props.rows()[0] ?? []}>
            {(segment) => <text fg={props.foreground}>{segment.text} </text>}
          </For>
        </box>
      }
    >
      <box flexDirection="column" width="100%" backgroundColor={props.background}>
        <Show when={row(0)}>
          {(segments: Accessor<RenderedSegment[]>) => <Row segments={segments()} config={props.config()} background={props.background} />}
        </Show>
        <Show when={row(1)}>
          {(segments: Accessor<RenderedSegment[]>) => <Row segments={segments()} config={props.config()} background={props.background} />}
        </Show>
        <Show when={row(2)}>
          {(segments: Accessor<RenderedSegment[]>) => <Row segments={segments()} config={props.config()} background={props.background} />}
        </Show>
        <Show when={row(3)}>
          {(segments: Accessor<RenderedSegment[]>) => <Row segments={segments()} config={props.config()} background={props.background} />}
        </Show>
        <Show when={row(4)}>
          {(segments: Accessor<RenderedSegment[]>) => <Row segments={segments()} config={props.config()} background={props.background} />}
        </Show>
      </box>
    </Show>
  )
}
