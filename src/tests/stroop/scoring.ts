import type { Rand } from '../../lib/random'

export const DURATION_MS = 45_000
export const CONGRUENT_CHANCE = 0.25

export const COLORS = [
  { name: 'red', label: 'RED', hex: '#ef4444' },
  { name: 'blue', label: 'BLUE', hex: '#3b82f6' },
  { name: 'green', label: 'GREEN', hex: '#22c55e' },
  { name: 'yellow', label: 'YELLOW', hex: '#eab308' },
] as const

export interface Trial {
  word: number // index into COLORS
  ink: number
}

/** New trial, never identical to the previous one. Mostly word ≠ ink. */
export function nextTrial(prev: Trial | undefined, rand: Rand = Math.random): Trial {
  const n = COLORS.length
  for (;;) {
    const ink = Math.floor(rand() * n)
    let word = ink
    if (rand() >= CONGRUENT_CHANCE) word = (ink + 1 + Math.floor(rand() * (n - 1))) % n
    if (!prev || prev.word !== word || prev.ink !== ink) return { word, ink }
  }
}

export const stroopScore = (correct: number, wrong: number) => correct - wrong
