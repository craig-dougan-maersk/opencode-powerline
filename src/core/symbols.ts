import type { Charset } from "./types.ts"

export interface SymbolSet {
  right: string
  left: string
  rightRounded: string
  leftRounded: string
  branch: string
  model: string
  gitClean: string
  gitDirty: string
  gitConflicts: string
  gitAhead: string
  gitBehind: string
  gitWorktree: string
  gitTag: string
  gitSha: string
  gitUpstream: string
  gitStash: string
  gitTime: string
  sessionCost: string
  blockCost: string
  todayCost: string
  monthCost: string
  contextTime: string
  metricsResponse: string
  metricsLastResponse: string
  metricsDuration: string
  metricsMessages: string
  metricsLinesAdded: string
  metricsLinesRemoved: string
  version: string
  barFilled: string
  barEmpty: string
  paceOver: string
  paceUnder: string
  env: string
  sessionId: string
  weeklyCost: string
  agent: string
  thinking: string
  cacheTimer: string
  outputStyle: string
  status: string
}

export const UNICODE_SYMBOLS: SymbolSet = {
  right: "\uE0B0",
  left: "\uE0B6",
  rightRounded: "\uE0B4",
  leftRounded: "\uE0B6",
  branch: "\u2387",
  model: "\u2731",
  gitClean: "\u2713",
  gitDirty: "\u25CF",
  gitConflicts: "\u26A0",
  gitAhead: "\u2191",
  gitBehind: "\u2193",
  gitWorktree: "\u29C9",
  gitTag: "\u2302",
  gitSha: "\u266F",
  gitUpstream: "\u2192",
  gitStash: "\u29C7",
  gitTime: "\u25F7",
  sessionCost: "\u00A7",
  blockCost: "\u25F1",
  todayCost: "\u2609",
  monthCost: "\u25EB",
  contextTime: "\u25D4",
  metricsResponse: "\u29D6",
  metricsLastResponse: "\u0394",
  metricsDuration: "\u29D7",
  metricsMessages: "\u25C6",
  metricsLinesAdded: "+",
  metricsLinesRemoved: "-",
  version: "\u25C8",
  barFilled: "\u25AA",
  barEmpty: "\u25AB",
  paceOver: "\u25C6",
  paceUnder: "\u25C7",
  env: "\u2699",
  sessionId: "\u2317",
  weeklyCost: "\u25D1",
  agent: "\u25C7",
  thinking: "\u2726",
  cacheTimer: "\u25F4",
  outputStyle: "\u270E",
  status: "\u25CF",
}

export const TEXT_SYMBOLS: SymbolSet = {
  right: ">",
  left: "(",
  rightRounded: ")",
  leftRounded: "(",
  branch: "~",
  model: "M",
  gitClean: "=",
  gitDirty: "*",
  gitConflicts: "!",
  gitAhead: "^",
  gitBehind: "v",
  gitWorktree: "W",
  gitTag: "T",
  gitSha: "#",
  gitUpstream: ">>",
  gitStash: "S",
  gitTime: "@",
  sessionCost: "S",
  blockCost: "B",
  todayCost: "D",
  monthCost: "Mo",
  contextTime: "C",
  metricsResponse: "R",
  metricsLastResponse: "L",
  metricsDuration: "T",
  metricsMessages: "#",
  metricsLinesAdded: "+",
  metricsLinesRemoved: "-",
  version: "V",
  barFilled: "=",
  barEmpty: "-",
  paceOver: "!",
  paceUnder: ":",
  env: "$",
  sessionId: "#",
  weeklyCost: "W",
  agent: "&",
  thinking: "T",
  cacheTimer: "C!",
  outputStyle: "OS",
  status: "*",
}

export function symbolsFor(charset: Charset): SymbolSet {
  return charset === "text" ? TEXT_SYMBOLS : UNICODE_SYMBOLS
}
