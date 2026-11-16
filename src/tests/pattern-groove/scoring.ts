import { randInt, shuffle, type Rand } from '../../lib/random'
import { median } from '../reaction/scoring'

export const PADS = 4
/**
 * The hidden pattern: a 12-step "second-order conditional" sequence over 4 pads (Reed & Johnson 1994: 3-4-2-3-1-2-1-4-3-
 * 2-4-1). Every pad comes 3 times, every pair of pads once, never the same pad twice in a row, so it can only be learned
 * as a sequence, not from how often a pad lights. Each run relabels the pads and starts at a random point.
 */
export const SEQUENCE = [2, 3, 1, 2, 0, 1, 0, 3, 2, 1, 3, 0]
/** Pattern, then (without warning) a random block, then the pattern again. */
export const BLOCKS = [
  { kind: 'pattern', presses: 60 },
  { kind: 'random', presses: 24 },
  { kind: 'pattern', presses: 24 },
] as const
export const TOTAL = BLOCKS.reduce((s, b) => s + b.presses, 0)
/** Pause between a right press and the next pad lighting up. */
export const GAP_MS = 150
/** Pattern presses compared with the random block: the last this many before it, and all after it. */
export const COMPARE = 24

export type Kind = (typeof BLOCKS)[number]['kind']
export interface Step { pad: number; kind: Kind }

/**
 * A random block of `n` presses: every pad equally often, never the same pad twice in a row, not starting with `before`
 * and not ending with `after` (the pattern pads around it).
 */
function randomBlock(n: number, before: number, after: number, rand: Rand): number[] {
  for (;;) {
    const pads = shuffle(Array.from({ length: n }, (_, i) => i % PADS), rand)
    if (pads[0] === before || pads[n - 1] === after) continue
    if (pads.every((p, i) => i === 0 || p !== pads[i - 1])) return pads
  }
}

/** The whole run: which pad lights at each step, and whether it belongs to the pattern or the random block. */
export function makePlan(rand: Rand = Math.random): Step[] {
  const label = shuffle(Array.from({ length: PADS }, (_, i) => i), rand)
  let pos = randInt(0, SEQUENCE.length - 1, rand)
  const patternPad = (k: number) => label[SEQUENCE[k % SEQUENCE.length]]
  const steps: Step[] = []
  for (const block of BLOCKS) {
    if (block.kind === 'pattern') {
      for (let i = 0; i < block.presses; i++) steps.push({ pad: patternPad(pos++), kind: 'pattern' })
    } else {
      // The pattern picks up where it left off after the random block.
      const pads = randomBlock(block.presses, steps[steps.length - 1].pad, patternPad(pos), rand)
      for (const pad of pads) steps.push({ pad, kind: 'random' })
    }
  }
  return steps
}

/** One press: time from the pad lighting up to the right press, and whether a wrong key came first. */
export interface Press { kind: Kind; ms: number; clean: boolean }

/** Median time of clean presses (no wrong key first). */
const medianOf = (ps: Press[]) => {
  const xs = ps.filter((p) => p.clean).map((p) => p.ms)
  return xs.length ? median(xs) : undefined
}

/**
 * The pattern bonus: how much slower you are on the random block than on the pattern around it (the last COMPARE
 * pattern presses before it and the pattern presses after it). Bigger = you learned more of the pattern. Whole ms.
 */
export function patternBonus(presses: Press[]) {
  const r0 = presses.findIndex((p) => p.kind === 'random')
  const r1 = presses.findLastIndex((p) => p.kind === 'random')
  if (r0 < 0) return undefined
  const random = medianOf(presses.slice(r0, r1 + 1))
  const before = medianOf(presses.slice(Math.max(0, r0 - COMPARE), r0))
  const after = medianOf(presses.slice(r1 + 1, r1 + 1 + COMPARE))
  if (random === undefined || before === undefined || after === undefined) return undefined
  return {
    bonus: Math.round(random - (before + after) / 2),
    random: Math.round(random),
    pattern: Math.round((before + after) / 2),
  }
}

/** Median of each run of 12 presses (one pass through the pattern), for the learning curve on the result. */
export const curve = (presses: Press[]) =>
  Array.from({ length: Math.ceil(presses.length / SEQUENCE.length) }, (_, i) => {
    const part = presses.slice(i * SEQUENCE.length, (i + 1) * SEQUENCE.length)
    return { kind: part[0].kind, ms: medianOf(part) }
  })
