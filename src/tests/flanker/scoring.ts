import { correctMinusWrong } from '../../lib/scoring'
import type { Rand } from '../../lib/random'

export const DURATION_MS = 45_000
/** Arrows in a row; the middle one is the target. */
export const ARROWS = 5

export type Dir = 'left' | 'right'
export interface Trial {
  target: Dir
  /** Flankers point the same way as the middle arrow. */
  congruent: boolean
}

/**
 * Next trial: same-way and mixed rows alternate in shuffled pairs, so any run stays close to 50 / 50
 * (never more than one ahead), and the exact same row never shows twice in a row (so every answer is a visible change).
 */
export function makeTrialSource(rand: Rand = Math.random) {
  let bag: boolean[] = []
  let prev: Trial | undefined
  return (): Trial => {
    if (!bag.length) bag = rand() < 0.5 ? [true, false] : [false, true]
    const congruent = bag.shift()!
    let target: Dir = rand() < 0.5 ? 'left' : 'right'
    if (prev && prev.congruent === congruent && prev.target === target) target = target === 'left' ? 'right' : 'left'
    prev = { target, congruent }
    return prev
  }
}

/** The row of arrows for a trial, left to right. */
export function arrowsOf(t: Trial): Dir[] {
  const flank: Dir = t.congruent ? t.target : t.target === 'left' ? 'right' : 'left'
  return Array.from({ length: ARROWS }, (_, i) => (i === (ARROWS - 1) / 2 ? t.target : flank))
}

export const flankerScore = correctMinusWrong

export interface Answer { ms: number; congruent: boolean; correct: boolean }

/** Mean time of correct answers, split by same-way vs mixed rows. */
export function averageTimes(answers: Answer[]) {
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined)
  const ok = answers.filter((a) => a.correct)
  return {
    sameMs: avg(ok.filter((a) => a.congruent).map((a) => a.ms)),
    mixedMs: avg(ok.filter((a) => !a.congruent).map((a) => a.ms)),
  }
}
