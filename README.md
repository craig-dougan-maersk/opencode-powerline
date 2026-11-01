# opencode-powerline

A vim-style powerline statusline for [OpenCode](https://opencode.ai), functionally modelled on
[claude-powerline](https://github.com/Owloops/claude-powerline).

```
 powerline  ⎇ main ↑2↓1 ●  ✱ DeepSeek V4.1 Flash  § 14.1K tokens  ◔ 45.0K (71%)  ◇ build
```

The bar uses real OpenCode data: session tokens and cost, context-window usage, git state, model,
agent, today/month spend, OpenCode Go rate-limit meters, response metrics, cache timers and more.

## Install

The plugin is TUI-only, so it belongs in the CLI configuration:

```json title="~/.config/opencode/cli.json"
{
  "plugins": ["opencode-powerline"]
}
```

For a local checkout, point at the directory instead:

```json
{
  "plugins": ["/home/craig/plugins/powerline"]
}
```

OpenCode reloads CLI plugins while it runs. Open a session and the bar appears under the prompt
footer. On the home screen it appears as the bottom row.

## Surfaces

`display.surface` controls where the bar renders:

| Value | Behaviour |
| --- | --- |
| `auto` (default) | Bottom app row on home, full-width replacement of the prompt footer in sessions |
| `app` | Bottom app row only (may be clipped in some session layouts) |
| `prompt.footer` | Replace the prompt footer |
| `prompt.footer.status` | Inline addition to the prompt footer status area |
| `session.composer.top` | Row above the prompt input |
| `home.footer.status` | Inline addition to the home footer |

In sessions, `auto` replaces OpenCode's small footer with the powerline bar. The bar shows the
directory, context and cost, so the replaced information remains available. In shell mode the
original `esc exit shell mode` hint is preserved.

## Configuration

Config is merged in this order (later wins):

1. Defaults
2. `$XDG_CONFIG_HOME/opencode/powerline.json` or `~/.config/opencode/powerline.json`
3. `<project>/.opencode-powerline.json`
4. `OPENCODE_POWERLINE_CONFIG` (explicit file)
5. `OPENCODE_POWERLINE_THEME`, `_STYLE`, `_CHARSET`, `_SURFACE`, `_DEMO`
6. Plugin `options` in `cli.json`

The file format mirrors claude-powerline:

```json
{
  "theme": "auto",
  "display": {
    "style": "powerline",
    "charset": "unicode",
    "autoWrap": true,
    "padding": 1,
    "showIcons": true,
    "surface": "auto",
    "lines": [
      {
        "segments": {
          "directory": { "enabled": true, "style": "basename" },
          "git": { "enabled": true, "showAheadBehind": true },
          "model": { "enabled": true },
          "session": { "enabled": true, "type": "tokens" },
          "context": { "enabled": true, "displayStyle": "text" },
          "agent": { "enabled": true }
        }
      }
    ]
  },
  "budget": {
    "session": { "amount": 10, "warningThreshold": 80 },
    "today": { "amount": 50, "warningThreshold": 80 },
    "month": { "amount": 500, "warningThreshold": 80 }
  }
}
```

Segment order is the order keys appear in `lines[].segments`. `display.lines` replaces the default
line when present.

Config files are watched; edits apply without a restart.

### Themes

`auto` (default) derives segment colours from the active OpenCode theme. Built-ins: `dark`, `light`,
`nord`, `tokyo-night`, `rose-pine`, `gruvbox`. `custom` reads `colors.custom`:

```json
{
  "theme": "custom",
  "colors": {
    "custom": {
      "directory": { "bg": "#8b4513", "fg": "#ffffff", "bold": true },
      "git": { "bg": "#404040", "fg": "#ffffff" }
    }
  }
}
```

`NO_COLOR` renders a plain, uncoloured line.

### Styles and charsets

`powerline` (arrow separators), `capsule` (rounded caps), `minimal` (coloured blocks, no
separators). `charset` is `unicode` (Nerd Font) or `text` (ASCII fallback).

### Bars

Context and rate-limit segments accept `displayStyle`: `text`, `ball`, `bar`, `blocks`,
`blocks-line`, `capped`, `dots`, `filled`, `geometric`, `line`, `squares`.

## Segments

| Segment | Shows |
| --- | --- |
| `directory` | Working directory; `style`: `full`, `fish`, `basename` |
| `git` | Branch, dirty/clean, ahead/behind, optional SHA, tag, working tree, upstream, stash, operation, repo name, worktree |
| `model` | Session or prompt model; `showVariant` adds the reasoning variant |
| `session` | Session cost and/or tokens; `type`: `cost`, `tokens`, `both`, `breakdown` |
| `today` / `month` | Local spend and tokens from OpenCode session statistics |
| `block` / `weekly` | OpenCode Go rolling (5h) and weekly (7d) meters with reset countdown and optional pace |
| `context` | Context-window tokens/percent; uses OpenCode's `compaction.buffer` when configured |
| `metrics` | API time, last response, session duration, message count, lines added/removed |
| `version` | OpenCode version |
| `agent` | Active agent |
| `thinking` | Reasoning variant (effort) |
| `cacheTimer` | Time since the last user message, or remaining prompt-cache TTL |
| `tmux` | tmux session name |
| `sessionId` | Session ID |
| `env` | Value of an environment variable (`variable`, optional `prefix`) |
| `status` | `● running · esc interrupt` while the session is running |
| `outputStyle` | Accepted for compatibility; hidden (no OpenCode equivalent) |

Segments hide automatically when their data is unavailable.

### Budgets

`budget.session`, `budget.today` and `budget.month` accept `amount`, `type` (`cost` or `tokens`),
`warningThreshold`, `showPercentage` and `showValue`. The suffix reads `(25%)`, `(+75%)` or `(!85%)`.

## Command

Run `/powerline` (or open the command palette and choose **Powerline: configure**) to change the
theme, style, charset, surface and segments, set budgets, toggle demo mode, reload the config, or
see the config path. Changes are written to `~/.config/opencode/powerline.json`.

## Environment variables

| Variable | Effect |
| --- | --- |
| `OPENCODE_POWERLINE_THEME` | Theme |
| `OPENCODE_POWERLINE_STYLE` | `powerline`, `capsule`, `minimal` |
| `OPENCODE_POWERLINE_CHARSET` | `unicode`, `text` |
| `OPENCODE_POWERLINE_SURFACE` | Surface |
| `OPENCODE_POWERLINE_CONFIG` | Extra config file |
| `OPENCODE_POWERLINE_DEMO=1` | Render sample data (useful for screenshots) |
| `NO_COLOR` | Disable colours |

## Development

```bash
npm install
npm run typecheck
npm test
```

The TUI can be exercised in a terminal with a demo bar:

```bash
OPENCODE_POWERLINE_DEMO=1 opencode --standalone
```

## Limitations

- OpenCode has no native statusline hook; this is a TUI plugin rendering into a host slot.
- `outputStyle` and Claude-specific "thinking on/off" state have no OpenCode equivalent.
- `block`/`weekly` require an OpenCode Go/Console subscription; they hide otherwise.
- `today`/`month` use the experimental session-statistics API and hide if it is unavailable.
- The prompt footer surface is single-row by design; low-priority segments drop on narrow panes.

## License

MIT. The palette, symbol vocabulary and configuration shape are derived from
[claude-powerline](https://github.com/Owloops/claude-powerline) (MIT, Copyright (c) 2025 Owloops).
