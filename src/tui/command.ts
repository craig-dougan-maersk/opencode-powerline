import { SEGMENT_TYPES, writeGlobalConfig } from "../core/config.ts"
import type { LineConfig, PowerlineConfig, SegmentType } from "../core/types.ts"
import type { ConfigController } from "./config-controller.ts"

async function choose(
  context: any,
  title: string,
  options: Array<[string, string]>,
  current?: string,
): Promise<string | undefined> {
  return context.ui.dialog.select({
    title,
    current,
    options: options.map(([label, value]) => ({ title: label, value })),
  })
}

async function apply(
  context: any,
  controller: ConfigController,
  changes: unknown,
  message: string,
): Promise<void> {
  try {
    await writeGlobalConfig(changes)
    await controller.reload()
    context.ui.toast.show({ message, variant: "success", duration: 2000 })
  } catch (error) {
    context.ui.toast.show({
      message: `Powerline: ${error instanceof Error ? error.message : String(error)}`,
      variant: "error",
      duration: 5000,
    })
  }
}

function toggleSegment(lines: LineConfig[], type: SegmentType, enabled: boolean): LineConfig[] {
  return lines.map((line, index) => {
    if (index !== 0) return line
    return {
      segments: {
        ...line.segments,
        [type]: { ...(line.segments[type] ?? { enabled: false }), enabled },
      },
    }
  })
}

async function segmentsMenu(context: any, controller: ConfigController): Promise<void> {
  for (;;) {
    const config = controller.state.config
    const line = config.display.lines[0]
    const options: Array<{ title: string; value: string; description: string }> = SEGMENT_TYPES.map((type) => {
      const enabled = Boolean(line?.segments[type]?.enabled)
      return {
        title: `${enabled ? "\u2713" : "\u2717"} ${type}`,
        value: type,
        description: enabled ? "enabled" : "disabled",
      }
    })
    options.push({ title: "Done", value: "__done__", description: "" })
    const pick = await context.ui.dialog.select({
      title: "Powerline segments",
      options,
    })
    if (!pick || pick === "__done__") return
    const type = pick as SegmentType
    const enabled = Boolean(line?.segments[type]?.enabled)
    await apply(
      context,
      controller,
      { display: { lines: toggleSegment(config.display.lines, type, !enabled) } },
      `${type} ${enabled ? "disabled" : "enabled"}`,
    )
  }
}

async function budgetsMenu(context: any, controller: ConfigController): Promise<void> {
  const config = controller.state.config
  const which = await choose(context, "Budget", [
    ["Session (USD)", "session"],
    ["Today (USD)", "today"],
    ["Month (USD)", "month"],
  ])
  if (!which) return
  const key = which as "session" | "today" | "month"
  const current = config.budget[key]?.amount
  const value = await context.ui.dialog.prompt({
    title: `${key[0].toUpperCase()}${key.slice(1)} budget`,
    placeholder: "Amount in USD, 0 to disable",
    value: current === undefined ? "" : String(current),
  })
  if (value === undefined) return
  const amount = Number.parseFloat(value)
  if (!Number.isFinite(amount) || amount < 0) {
    context.ui.toast.show({ message: "Powerline: enter a non-negative number", variant: "error" })
    return
  }
  await apply(context, controller, { budget: { [key]: { amount } } }, `${key} budget: $${amount}`)
}

export async function openMenu(context: any, controller: ConfigController): Promise<void> {
  const config: PowerlineConfig = controller.state.config
  const choice = await choose(context, "Powerline", [
    [`Theme: ${config.theme}`, "theme"],
    [`Style: ${config.display.style}`, "style"],
    [`Charset: ${config.display.charset}`, "charset"],
    [`Surface: ${config.display.surface}`, "surface"],
    ["Segments", "segments"],
    ["Budgets", "budgets"],
    [`Demo mode: ${config.demo ? "on" : "off"}`, "demo"],
    ["Reload config", "reload"],
    ["Config file", "path"],
  ])

  if (!choice) return

  switch (choice) {
    case "theme": {
      const value = await choose(
        context,
        "Theme",
        [
          ["Auto (OpenCode theme)", "auto"],
          ["Dark", "dark"],
          ["Light", "light"],
          ["Nord", "nord"],
          ["Tokyo Night", "tokyo-night"],
          ["Rose Pine", "rose-pine"],
          ["Gruvbox", "gruvbox"],
          ["Custom (colors.custom)", "custom"],
        ],
        config.theme,
      )
      if (!value) return
      await apply(context, controller, { theme: value }, `Theme: ${value}`)
      if (value === "custom") {
        context.ui.toast.show({
          message: "Powerline: define colors.custom in the config file",
          variant: "info",
          duration: 5000,
        })
      }
      await openMenu(context, controller)
      return
    }

    case "style": {
      const value = await choose(
        context,
        "Style",
        [
          ["Powerline", "powerline"],
          ["Capsule", "capsule"],
          ["Minimal", "minimal"],
        ],
        config.display.style,
      )
      if (!value) return
      await apply(context, controller, { display: { style: value } }, `Style: ${value}`)
      await openMenu(context, controller)
      return
    }

    case "charset": {
      const value = await choose(
        context,
        "Charset",
        [
          ["Unicode (Nerd Font)", "unicode"],
          ["Text (ASCII)", "text"],
        ],
        config.display.charset,
      )
      if (!value) return
      await apply(context, controller, { display: { charset: value } }, `Charset: ${value}`)
      await openMenu(context, controller)
      return
    }

    case "surface": {
      const value = await choose(
        context,
        "Surface",
        [
          ["Auto (home bar + session footer)", "auto"],
          ["App footer (bottom row)", "app"],
          ["Replace prompt footer", "prompt.footer"],
          ["Prompt footer status (inline)", "prompt.footer.status"],
          ["Composer top", "session.composer.top"],
          ["Home footer status (inline)", "home.footer.status"],
        ],
        config.display.surface,
      )
      if (!value) return
      await apply(context, controller, { display: { surface: value } }, `Surface: ${value}`)
      return
    }

    case "segments":
      await segmentsMenu(context, controller)
      await openMenu(context, controller)
      return

    case "budgets":
      await budgetsMenu(context, controller)
      await openMenu(context, controller)
      return

    case "demo": {
      const enabled = !config.demo
      await apply(context, controller, { demo: enabled }, `Demo mode: ${enabled ? "on" : "off"}`)
      await openMenu(context, controller)
      return
    }

    case "reload": {
      await controller.reload()
      context.ui.toast.show({ message: "Powerline: config reloaded", variant: "success" })
      return
    }

    case "path": {
      const path = controller.state.files[0] ?? "(no config file yet)"
      context.ui.toast.show({ message: `Powerline config: ${path}`, duration: 7000 })
      return
    }
  }
}

export function registerPowerlineCommand(context: any, controller: ConfigController): void {
  context.keymap.layer(() => ({
    mode: "global",
    commands: [
      {
        id: "powerline.configure",
        title: "Powerline: configure",
        description: "Theme, style, segments and budgets for the powerline statusline",
        group: "Powerline",
        palette: true,
        slash: { name: "powerline" },
        run: async () => {
          try {
            await openMenu(context, controller)
          } catch (error) {
            context.ui.toast.show({
              message: `Powerline: ${error instanceof Error ? error.message : String(error)}`,
              variant: "error",
              duration: 5000,
            })
          }
        },
      },
    ],
  }))
}

