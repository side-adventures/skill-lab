import type { ComponentType, LazyExoticComponent } from 'react'

export type Category = 'Speed' | 'Memory' | 'Focus' | 'Thinking' | 'Estimation' | 'Motor'

/** Display order of categories on the home page. */
export const CATEGORIES: Category[] = ['Speed', 'Memory', 'Focus', 'Thinking', 'Estimation', 'Motor']

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
  icon: string
  category: Category
  tagline: string
  /** Short bullet points shown on the intro screen. */
  instructions: string[]
  durationHint: string
  /** e.g. "Average reaction time" */
  scoreLabel: string
  higherIsBetter: boolean
  formatScore: (score: number) => string
  /** Missing => shown as "coming soon". */
  Component?: LazyExoticComponent<ComponentType<TestComponentProps>>
}
