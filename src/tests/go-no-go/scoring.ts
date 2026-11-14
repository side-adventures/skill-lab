import { shuffle, type Rand } from '../../lib/random'

/** 6 groups of 5 (4 green + 1 red each): 24 green, 6 red (30), the 80 / 20 split research uses. */
export const GROUPS = 6
export const GROUP_GREENS = 4
export const GROUP_REDS = 1
export const GREENS = GROUPS * GROUP_GREENS
export const REDS = GROUPS * GROUP_REDS
export const WINDOW_MS = 800 // how long a stimulus stays up
/**
 * Wrong clicks (on red, or before a shape appears) cost more each time: 0.6 s, 0.9 s, 1.2 s …
 * One slip stays cheap, while clicking without looking (6 reds) adds 8.1 s, so it never pays.
 */
export const WRONG_CLICK_MS = 600
export const WRONG_CLICK_STEP_MS = 300
/** Total cost of this many wrong clicks: 600 + 900 + 1200 + … */
export const wrongClicksMs = (count: number) => count * WRONG_CLICK_MS + (WRONG_CLICK_STEP_MS * count * (count - 1)) / 2
export const MIN_WAIT_MS = 700
export const MAX_WAIT_MS = 1500

/**
 * true = green (tap), false = red (don't). Each group of 5 is shuffled on its own, so the reds are
 * spread over the run. Redrawn until the first two are green and no two reds are next to each other.
 */
export function makeTrials(rand: Rand = Math.random): boolean[] {
  for (;;) {
    const out: boolean[] = []
    for (let g = 0; g < GROUPS; g++)
      out.push(...shuffle([...Array(GROUP_GREENS).fill(true), ...Array(GROUP_REDS).fill(false)], rand))
    const ok = out[0] && out[1] && !out.some((g, i) => !g && out[i + 1] === false)
    if (ok) return out
  }
}

/** Longest run of consecutive greens. */
export const longestGreenRun = (t: boolean[]) =>
  t.reduce<[number, number]>(([best, cur], g) => (g ? [Math.max(best, cur + 1), cur + 1] : [best, 0]), [0, 0])[0]

export interface Stats { rts: number[]; misses: number; falseTaps: number }

/** Total of green reaction times; a missed green counts the full window (0.8 s), wrong clicks add 0.6 s, 0.9 s, 1.2 s … */
export const totalMs = ({ rts, misses, falseTaps }: Stats) =>
  Math.round(rts.reduce((a, b) => a + b, 0) + misses * WINDOW_MS + wrongClicksMs(falseTaps))
