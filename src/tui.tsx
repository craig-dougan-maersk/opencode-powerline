/** @jsxImportSource @opentui/solid */
import { createEffect, createRoot, Show } from "solid-js"
import { Plugin } from "@opencode/plugin/tui"
import { createConfigController, type ConfigController } from "./tui/config-controller.ts"
import { registerPowerlineCommand } from "./tui/command.ts"
import { Statusline } from "./tui/statusline.tsx"

function HomeBar(props: { context: any; controller: ConfigController }) {
  const isHome = () => props.context.ui.router.current()?.type === "home"
  return (
    <Show when={isHome()}>
      <Statusline
        context={props.context}
        config={() => props.controller.state.config}
        reload={props.controller.reload}
      />
    </Show>
  )
}

function ShellHint(props: { context: any }) {
  return (
    <text fg={props.context.theme.text.base}>
      esc <span style={{ fg: props.context.theme.text.muted }}>exit shell mode</span>
    </text>
  )
}

function PromptBar(props: { context: any; controller: ConfigController; input: any }) {
  return (
    <Show when={props.input.mode !== "shell"} fallback={<ShellHint context={props.context} />}>
      <Statusline
        context={props.context}
        config={() => props.controller.state.config}
        reload={props.controller.reload}
        sessionID={() => props.input.sessionID}
        singleRow
      />
    </Show>
  )
}

export default Plugin.define({
  id: "opencode.powerline",
  async setup(context) {
    const controller = createConfigController(context)
    await controller.reload(context.location?.directory)

    const disposeRoot = createRoot((dispose) => {
      let unregister: (() => void) | undefined

      createEffect(() => {
        const surface = controller.state.config.display.surface
        unregister?.()
        unregister = undefined

        if (surface === "auto") {
          const stopApp = context.ui.slot({
            append: "app",
            render: () => <HomeBar context={context} controller={controller} />,
          })
          const stopPrompt = context.ui.slot({
            replace: "prompt.footer",
            render: (input) => <PromptBar context={context} controller={controller} input={input} />,
          })
          unregister = () => {
            stopApp()
            stopPrompt()
          }
          return
        }

        if (surface === "app") {
          unregister = context.ui.slot({
            append: "app",
            render: () => (
              <Statusline
                context={context}
                config={() => controller.state.config}
                reload={controller.reload}
              />
            ),
          })
          return
        }

        if (surface === "prompt.footer") {
          unregister = context.ui.slot({
            replace: "prompt.footer",
            render: (input) => <PromptBar context={context} controller={controller} input={input} />,
          })
          return
        }

        if (surface === "prompt.footer.status") {
          unregister = context.ui.slot({
            append: "prompt.footer.status",
            render: (input) => (
              <Statusline
                context={context}
                config={() => controller.state.config}
                reload={controller.reload}
                sessionID={() => input.sessionID}
                fill={false}
                singleRow
              />
            ),
          })
          return
        }

        if (surface === "session.composer.top") {
          unregister = context.ui.slot({
            append: "session.composer.top",
            render: (input) => (
              <Statusline
                context={context}
                config={() => controller.state.config}
                reload={controller.reload}
                sessionID={() => input.sessionID}
                fill={false}
                singleRow
              />
            ),
          })
          return
        }

        unregister = context.ui.slot({
          append: "home.footer.status",
          render: () => (
            <Statusline
              context={context}
              config={() => controller.state.config}
              reload={controller.reload}
              fill={false}
              singleRow
            />
          ),
        })
      })

      return dispose
    })

    registerPowerlineCommand(context, controller)

    return () => {
      disposeRoot()
      controller.dispose()
    }
  },
})
