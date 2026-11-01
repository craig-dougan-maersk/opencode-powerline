export type DisplayStyle = "powerline" | "capsule" | "minimal" | "tui"
export type Charset = "unicode" | "text"
export type ColorCompatibility = "auto" | "ansi" | "ansi256" | "truecolor"
export type Surface =
  | "auto"
  | "app"
  | "prompt.footer"
  | "prompt.footer.status"
  | "session.composer.top"
  | "home.footer.status"

export type BarStyle =
  | "text"
  | "ball"
  | "bar"
  | "blocks"
  | "blocks-line"
  | "capped"
  | "dots"
  | "filled"
  | "geometric"
  | "line"
  | "squares"

export type SegmentType =
  | "directory"
  | "git"
  | "model"
  | "session"
  | "today"
  | "month"
  | "block"
  | "weekly"
  | "version"
  | "tmux"
  | "sessionId"
  | "context"
  | "metrics"
  | "agent"
  | "thinking"
  | "cacheTimer"
  | "outputStyle"
  | "env"
  | "status"

export type UsageType = "cost" | "tokens" | "both" | "breakdown"

export interface SegmentConfig {
  enabled: boolean
  showIcon?: boolean

  /** directory */
  style?: "full" | "fish" | "basename"

  /** git */
  showSha?: boolean
  showWorkingTree?: boolean
  showOperation?: boolean
  showTag?: boolean
  showTimeSinceCommit?: boolean
  showStashCount?: boolean
  showAheadBehind?: boolean
  showUpstream?: boolean
  showRepoName?: boolean
  showWorktree?: boolean

  /** session / today / month */
  type?: UsageType | "time" | "weighted"
  costSource?: "calculated" | "official"
  showUnits?: boolean
  source?: "local" | "go"

  /** context */
  showPercentageOnly?: boolean
  displayStyle?: BarStyle
  percentageMode?: "remaining" | "used"
  autocompactBuffer?: number

  /** metrics */
  showResponseTime?: boolean
  showLastResponseTime?: boolean
  showDuration?: boolean
  showMessageCount?: boolean
  showLinesAdded?: boolean
  showLinesRemoved?: boolean

  /** agent / outputStyle */
  showLabel?: boolean
  hideDefault?: boolean

  /** thinking */
  showEnabled?: boolean
  showEffort?: boolean

  /** cacheTimer */
  displayMode?: "elapsed" | "remaining"
  ttlSeconds?: number

  /** env */
  variable?: string
  prefix?: string

  /** sessionId */
  showIdLabel?: boolean

  /** block / weekly */
  showPace?: boolean

  /** model */
  showVariant?: boolean
}

export type AnySegmentConfig = SegmentConfig

export interface LineConfig {
  segments: Partial<Record<SegmentType, SegmentConfig>>
}

export interface BudgetConfig {
  amount?: number
  type?: "cost" | "tokens"
  warningThreshold?: number
  showPercentage?: boolean
  showValue?: boolean
}

export interface DisplayConfig {
  style: DisplayStyle
  charset: Charset
  colorCompatibility: ColorCompatibility
  autoWrap: boolean
  widthReserve: number
  padding: number
  showIcons: boolean
  surface: Surface
  maxRows: number
  lines: LineConfig[]
}

export interface CustomColor {
  bg?: string
  fg?: string
  bold?: boolean
}

export interface PowerlineConfig {
  theme: string
  display: DisplayConfig
  budget: {
    session: BudgetConfig
    today: BudgetConfig
    month: BudgetConfig
    block: BudgetConfig
  }
  colors?: {
    custom?: Partial<Record<string, CustomColor>>
  }
  modelContextLimits?: Record<string, number>
  /** Plugin-only options. */
  demo?: boolean
  tickMs?: number
  configPath?: string
}

export interface TokenTotals {
  input: number
  output: number
  reasoning: number
  cacheRead: number
  cacheWrite: number
  total: number
}

export interface UsageTotals {
  cost: number
  tokens: number
}

export interface Meter {
  percent: number
  resetsAt: number
  limited?: boolean
}

export interface GitInfo {
  branch: string
  status: "clean" | "dirty" | "conflicts"
  ahead: number
  behind: number
  sha?: string
  staged?: number
  unstaged?: number
  untracked?: number
  conflicts?: number
  operation?: string
  tag?: string
  timeSinceCommit?: number
  stashCount?: number
  upstream?: string
  repoName?: string
  isWorktree?: boolean
  mainWorktree?: string
}

export interface MetricsInfo {
  responseTime: number
  lastResponseTime: number
  duration: number
  messages: number
  linesAdded: number
  linesRemoved: number
}

export interface Snapshot {
  sessionID?: string
  directory: string
  directoryDisplay: string
  worktreeOriginal?: string
  git: GitInfo | null
  model: { name: string; provider?: string; variant?: string } | null
  session: { cost: number; calculatedCost: number; tokens: TokenTotals } | null
  context: { tokens: number; limit: number; usable: number; percent: number } | null
  today: UsageTotals | null
  month: UsageTotals | null
  block: Meter | null
  weekly: Meter | null
  monthGo: Meter | null
  metrics: MetricsInfo | null
  version: string
  agent: string | null
  thinking: { enabled: boolean; effort?: string } | null
  cacheTimer: { elapsed: number; ttl: number } | null
  tmux: string | null
  env: Record<string, string | undefined>
  status: "idle" | "running"
  now: number
}

export interface RenderedSegment {
  type: SegmentType
  text: string
  bg: string
  fg: string
  bold?: boolean
  config: SegmentConfig
}

export type ColorTheme = Record<
  | "directory"
  | "git"
  | "model"
  | "session"
  | "block"
  | "today"
  | "month"
  | "tmux"
  | "context"
  | "contextWarning"
  | "contextCritical"
  | "metrics"
  | "version"
  | "env"
  | "weekly"
  | "agent"
  | "thinking"
  | "cacheTimer"
  | "outputStyle"
  | "status",
  CustomColor
>
