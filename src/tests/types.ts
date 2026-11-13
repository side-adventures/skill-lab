import type { ComponentType, LazyExoticComponent } from 'react'

export type Category = 'Speed' | 'Memory' | 'Focus' | 'Thinking' | 'Estimation' | 'Motor'

/** Display order of categories on the home page. */
export const CATEGORIES: Category[] = ['Speed', 'Memory', 'Focus', 'Thinking', 'Estimation', 'Motor']

/** Color of each category (6-digit hex, so alpha can be appended: `${color}26`). Used for icons, dots, chips. */
export const CATEGORY_COLORS: Record<Category, string> = {
  Speed: '#fbbf24', // amber-400
  Memory: '#a78bfa', // violet-400
  Focus: '#38bdf8', // sky-400
  Thinking: '#34d399', // emerald-400
  Estimation: '#fb7185', // rose-400
  Motor: '#fb923c', // orange-400
}

/** What a test reports when the player finishes. */
export interface TestResult {
  score: number
  /**
   * Set when the run ended without a valid score (e.g. left the line in Line Tracing).
   * The message is shown instead of a score and nothing is saved; `score` is ignored.
   */
  failed?: string
  /** Per-test breakdown shown under the score (also for failed runs) and saved with the attempt. */
  details?: ResultDetails
}

/**
 * The stats under the score on the result screen. Shown in this order: `stats`, `extra`, `chips`.
 * Values are already formatted ("251 ms"); each test picks what is interesting for it.
 */
export interface ResultDetails {
  /** Label / value pairs, most interesting first; wraps onto more lines when needed. */
  stats?: ResultStat[]
  /** One per-test block that doesn't fit the stat row. */
  extra?: ResultExtra
  /** Two-line chips (rounds, levels, time frames); the screen shows the last ones that fit. */
  chips?: { title: string; items: ResultChip[] }
}
export interface ResultStat { label: string; value: string }
export interface ResultChip { label: string; value: string }
export type ResultExtra =
  /** Two values that belong together and how they differ (Stroop: same vs different color). */
  | { kind: 'pair'; a: ResultStat; b: ResultStat; diff?: ResultStat }
  /** A small table (N-Back: one row per level). Dim rows are e.g. a level that wasn't passed. */
  | { kind: 'table'; columns: string[]; rows: { cells: string[]; dim?: boolean }[] }
  /** The number shown vs what you typed, wrong digits marked (Number Memory). */
  | { kind: 'digits'; target: string; typed: string }

/**
 * How a run starts: 'countdown' = 3-2-1 (you must be ready the moment it starts), 'quick' = a short
 * "Ready", 'none' = your own first action starts it (Tap Speed, Line Tracing, Circle Chase).
 */
export type StartMode = 'countdown' | 'quick' | 'none'

/**
 * Which layout the test uses (components/game/layouts.tsx). The game frame draws this shape, empty,
 * during the start transition, so the countdown already shows the play area.
 */
export type StageLayout = 'full' | 'prompt' | 'square' | 'panel'

/** A test's lazily loaded play component; `preload()` fetches its code ahead of time. */
export type TestComponent = LazyExoticComponent<ComponentType<TestComponentProps>> & { preload: () => void }

/** Props every test's play component receives. */
export interface TestComponentProps {
  onFinish: (result: TestResult) => void
}

/** Static description of a test. Adding a test = adding one of these to the registry. */
export interface TestDefinition {
  id: string
  name: string
  /** Emoji: used in shared text messages. The site shows src/icons/<id>.svg instead. */
  icon: string
  category: Category
  tagline: string
  /** The skill it tests, shown as "Tests …" on the rules screen (lowercase start, e.g. "reaction speed"). */
  skill: string
  /** How to play: one short line per step, as many as the test needs. */
  howTo: string[]
  /** How the score works: usually 1–2 short lines (what counts, penalties, lives, what ends it). */
  scoring: string[]
  durationHint: string
  /** e.g. "Average reaction time" */
  scoreLabel: string
  higherIsBetter: boolean
  formatScore: (score: number) => string
  /** How a run starts (see StartMode). */
  start: StartMode
  /** The layout it is built with (see StageLayout); `boardAspect` for a non-square board in 'square'. */
  layout: StageLayout
  boardAspect?: number
  /**
   * Bump when scoring changes so old saved scores aren't compared with new ones
   * (results are stored under a separate key per version).
   */
  scoreVersion?: number
  /** Missing => shown as "coming soon". */
  Component?: TestComponent
}

/** localStorage id for a test's results; changes when its scoring version is bumped. */
export const storageId = (t: Pick<TestDefinition, 'id' | 'scoreVersion'>) =>
  t.scoreVersion && t.scoreVersion > 1 ? `${t.id}@v${t.scoreVersion}` : t.id

/** Reads a `category` URL parameter (null = all categories). */
export const categoryFromParam = (v: string | null): Category | null => CATEGORIES.find((c) => c === v) ?? null
