import { randInt, shuffle, type Rand } from '../../lib/random'
import type { ResultDetails, TestResult } from '../types'

export const GRID = 3
export const START_N = 2
/** Block length = 16 + N items (≈ 45 s at 2-back), keeping a strong player's run under ~3.5 min. */
export const ITEMS_BASE = 16
export const MATCH_RATE = 0.3
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

/** Whole percent (accuracy shown and used in the score), rounded down so 79.6 % never shows as 80 % (+ε against float noise). */
export const accuracyPct = (acc: number) => Math.floor(acc * 100 + 1e-9)

/** A block with at most this many mistakes (missed matches + wrong clicks) is passed: move up a level. */
export const FREE_MISTAKES = 2
/** Lives for the whole run. Every mistake beyond FREE_MISTAKES in a block costs one. */
export const LIVES = 4

/** Lives a block costs: every mistake beyond the free ones (3 mistakes → 1, 6 mistakes → 4 = game over). */
export const livesLost = (mistakes: number) => Math.max(0, mistakes - FREE_MISTAKES)

/**
 * What happens after a block: passed (≤ 2 mistakes) → next level; otherwise lose lives and play the same
 * level again, or the run is over when no lives are left.
 */
export function afterBlock(mistakes: number, livesLeft: number) {
  const lost = livesLost(mistakes)
  const left = Math.max(0, livesLeft - lost)
  return { passed: lost === 0, lost, livesLeft: left, over: lost > 0 && left === 0 }
}

/**
 * Score = 100 × the level the run ended at + your accuracy in that last block:
 * ending at 4-back with 65 % gives 465, ending at the first level (2-back) with 65 % gives 265.
 * Accuracy is below 100 %, so reaching a higher level always beats any accuracy on a lower one.
 */
export const runScore = (endN: number, endAcc: number) => endN * 100 + Math.min(99, accuracyPct(endAcc))

export interface BlockResult extends ReturnType<typeof blockCounts> {
  n: number
  acc: number
  /** Any MATCH click in the block, also on the first n items. */
  clicked: boolean
  /** Missed matches + wrong clicks. */
  mistakes: number
  lost: number
}

/** The finished run: score, "No score" when there was no click at all, and the result details. */
export function runResult(blocks: BlockResult[]): TestResult {
  const end = blocks[blocks.length - 1]
  const passed = blocks.filter((b) => b.lost === 0)
  const details: ResultDetails = {
    stats: [
      { label: 'Highest level passed', value: passed.length ? `${Math.max(...passed.map((b) => b.n))}-back` : 'None' },
      { label: 'Ended at', value: `${end.n}-back · ${accuracyPct(end.acc)} %` },
    ],
    extra: {
      kind: 'table',
      columns: ['Level', 'Mistakes', 'Hits', 'Wrong clicks', 'Lives'],
      rows: blocks.slice(-6).map((b) => ({
        cells: [`${b.n}-back`, String(b.mistakes), `${b.hits} / ${b.matches}`, String(b.wrong), b.lost ? `−${b.lost}` : '–'],
        dim: b.lost > 0,
      })),
    },
  }
  if (!blocks.some((b) => b.clicked)) return { score: 0, failed: 'No clicks — try again!', details }
  return { score: runScore(end.n, end.acc), details }
}
