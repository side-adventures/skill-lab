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
  /** Optional per-test breakdown shown on the result screen (label -> value). */
  details?: Record<string, string>
}

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
  /**
   * Bump when scoring changes so old saved scores aren't compared with new ones
   * (results are stored under a separate key per version).
   */
  scoreVersion?: number
  /** Missing => shown as "coming soon". */
  Component?: LazyExoticComponent<ComponentType<TestComponentProps>>
}

/** localStorage id for a test's results; changes when its scoring version is bumped. */
export const storageId = (t: Pick<TestDefinition, 'id' | 'scoreVersion'>) =>
  t.scoreVersion && t.scoreVersion > 1 ? `${t.id}@v${t.scoreVersion}` : t.id

/** Reads a `category` URL parameter (null = all categories). */
export const categoryFromParam = (v: string | null): Category | null => CATEGORIES.find((c) => c === v) ?? null
