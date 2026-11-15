import { shuffle, type Rand } from '../../lib/random'
import { median } from '../reaction/scoring'

/** Number of squares in each block, in order. */
export const BLOCKS = [1, 2, 4] as const
export const TRIALS_PER_BLOCK = 8
export const MIN_WAIT_MS = 1000
export const MAX_WAIT_MS = 2500
/** Faster than this can't be a real reaction: counts as too soon. */
export const MIN_REACTION_MS = 100
/** More early clicks than this end the run without a score. */
export const MAX_TOO_SOON = 5

export const randomWait = (rand: Rand = Math.random) => MIN_WAIT_MS + rand() * (MAX_WAIT_MS - MIN_WAIT_MS)

/** Which square lights up in each trial of a block: every square equally often, shuffled. */
export const blockTargets = (choices: number, rand: Rand = Math.random) =>
  shuffle(Array.from({ length: TRIALS_PER_BLOCK }, (_, i) => i % choices), rand)

/**
 * After a wrong square, the trial is tried again later in the block: its target goes back in at a random place among
 * the remaining ones, so you can't just aim at the square that was lit before.
 */
export function retryLater(remaining: number[], target: number, rand: Rand = Math.random) {
  const at = Math.floor(rand() * (remaining.length + 1))
  return [...remaining.slice(0, at), target, ...remaining.slice(at)]
}

export interface BlockResult { choices: number; times: number[]; wrong: number }

/** Score: median reaction time over the blocks with a choice (2 and 4 squares), in whole ms. */
export function choiceScore(blocks: BlockResult[]) {
  const times = blocks.filter((b) => b.choices > 1).flatMap((b) => b.times)
  return times.length ? Math.round(median(times)) : 0
}

/**
 * Hick's law: time grows with log2(choices). The extra time per doubling of the choices, from a least-squares fit
 * of each block's median against log2(choices).
 */
export function msPerDoubling(blocks: BlockResult[]) {
  const pts = blocks.filter((b) => b.times.length).map((b) => ({ x: Math.log2(b.choices), y: median(b.times) }))
  if (pts.length < 2) return undefined
  const mx = pts.reduce((s, p) => s + p.x, 0) / pts.length
  const my = pts.reduce((s, p) => s + p.y, 0) / pts.length
  const sxx = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0)
  return pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / sxx
}
