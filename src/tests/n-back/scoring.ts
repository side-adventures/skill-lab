import { randInt, shuffle, type Rand } from '../../lib/random'

export const GRID = 3
export const START_N = 2
export const ITEMS_BASE = 20
export const MATCH_RATE = 0.3
export const PASS_ACCURACY = 0.8
export const ITEM_MS = 2500
export const LIT_MS = 500

export const blockLength = (n: number) => ITEMS_BASE + n

/** Exact number of matches per block (same difficulty every time). */
export const matchCount = (n: number) => Math.round((blockLength(n) - n) * MATCH_RATE)

/**
 * Positions for one block: exactly matchCount(n) items (from index n on) repeat the
 * position from n steps back; all other items are guaranteed NOT to match.
 */
export function makeBlock(n: number, rand: Rand = Math.random): number[] {
  const cells = GRID * GRID
  const scored = [...Array(blockLength(n) - n).keys()].map((i) => i + n)
  const matchAt = new Set(shuffle(scored, rand).slice(0, matchCount(n)))
  const seq: number[] = []
  for (let i = 0; i < blockLength(n); i++) {
    if (matchAt.has(i)) seq.push(seq[i - n])
    else {
      let p: number
      do p = randInt(0, cells - 1, rand)
      while ((i >= n && p === seq[i - n]) || p === seq[i - 1])
      seq.push(p)
    }
  }
  return seq
}

export const isMatch = (seq: number[], i: number, n: number) => i >= n && seq[i] === seq[i - n]

/**
 * Balanced accuracy over scored items (index ≥ n): the average of
 * "matches caught" and "non-matches correctly left alone". Never tapping = 50 %.
 */
export function blockAccuracy(seq: number[], tapped: boolean[], n: number) {
  let hits = 0, matches = 0, rejections = 0, nonMatches = 0
  for (let i = n; i < seq.length; i++) {
    const tap = Boolean(tapped[i]) // untapped items are missing from the array
    if (isMatch(seq, i, n)) {
      matches++
      if (tap) hits++
    } else {
      nonMatches++
      if (!tap) rejections++
    }
  }
  const hitRate = matches ? hits / matches : 1
  const rejectRate = nonMatches ? rejections / nonMatches : 1
  return (hitRate + rejectRate) / 2
}

/** Counts of one block for the result table: hits (of all matches), wrong clicks, missed matches. */
export function blockCounts(seq: number[], tapped: boolean[], n: number) {
  let matches = 0, hits = 0, wrong = 0
  seq.forEach((_, i) => {
    if (i < n) return // the first n items can't be matches and aren't scored (same as blockAccuracy)
    const m = isMatch(seq, i, n)
    if (m) matches++
    if (m && tapped[i]) hits++
    if (!m && tapped[i]) wrong++
  })
  return { matches, hits, wrong, missed: matches - hits }
}
