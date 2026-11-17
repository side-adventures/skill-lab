import { shuffle, type Rand } from '../../lib/random'

/** Items sit in a GRID × GRID grid of cells, one per cell, jittered inside it. */
export const GRID = 5
export const ITEM = 0.6 // of a cell
export const TRIALS = 40
/**
 * Staircase (Levitt 1971, "2-down 1-up"): starts at START_SIZE shapes; 2 right answers in a row add a shape, a wrong
 * answer takes one away. It settles where you are right about 71 % of the time, near your own limit.
 */
export const START_SIZE = 4
export const MIN_SIZE = 2
export const MAX_SIZE = 12
export const FIX_MS = 600
export const SAMPLE_MS = 500
export const BLANK_MS = 900

/**
 * The 14 kinds of item: more than the largest board, so a change always brings in a kind that isn't on the board
 * and can't be spotted as a duplicate. Each color always comes with its own shape, so a change is never a change of
 * color alone (color is never the only cue). Shapes are 24 × 24 paths, drawn filled (even-odd).
 */
export const KINDS = [
  { name: 'red circle', color: '#f87171', path: 'M12 3a9 9 0 1 0 .01 0Z' },
  { name: 'orange square', color: '#fb923c', path: 'M4 4h16v16H4Z' },
  { name: 'yellow triangle', color: '#facc15', path: 'M12 3l10 18H2Z' },
  { name: 'green diamond', color: '#4ade80', path: 'M12 2l10 10-10 10L2 12Z' },
  { name: 'cyan cross', color: '#22d3ee', path: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z' },
  { name: 'blue star', color: '#60a5fa', path: 'M12 2l3 7h7l-5.5 4.5 2 7.5-6.5-4.5L5.5 21l2-7.5L2 9h7Z' },
  { name: 'violet hexagon', color: '#c084fc', path: 'M7 3h10l5 9-5 9H7l-5-9Z' },
  { name: 'white half circle', color: '#f4f4f5', path: 'M2 17a10 10 0 0 1 20 0Z' },
  { name: 'pink ring', color: '#f472b6', path: 'M12 2a10 10 0 1 0 .01 0ZM12 7.5a4.5 4.5 0 1 1-.01 0Z' },
  { name: 'lime pentagon', color: '#a3e635', path: 'M12 2l10 7.5-4 12.5H6L2 9.5Z' },
  { name: 'amber arrow', color: '#fbbf24', path: 'M12 2l9 10h-5v10H8V12H3Z' },
  { name: 'teal moon', color: '#2dd4bf', path: 'M15 2a10 10 0 1 0 7 15A8 8 0 0 1 15 2Z' },
  { name: 'rose heart', color: '#fb7185', path: 'M12 21L3.5 12.5A5 5 0 0 1 12 6a5 5 0 0 1 8.5 6.5Z' },
  { name: 'sky bolt', color: '#7dd3fc', path: 'M14 2L5 14h6l-2 8 10-13h-6Z' },
] as const

export interface Item { x: number; y: number; kind: number }
export interface Trial {
  size: number
  items: Item[]
  /** Index of the item that changes in the test display, or null for "same". */
  changed: number | null
  /** The kind it changes into (one not on the board). */
  newKind: number
}

/** One trial with `size` shapes; `change` decides whether one of them changes. */
export function makeTrial(size: number, change: boolean, rand: Rand = Math.random): Trial {
  const kinds = shuffle(KINDS.map((_, i) => i), rand)
  const cells = shuffle(Array.from({ length: GRID * GRID }, (_, i) => i), rand).slice(0, size)
  const jitter = (1 - ITEM) / 2
  const items = cells.map((cell, i) => ({
    x: ((cell % GRID) + 0.5 + (rand() * 2 - 1) * jitter) / GRID,
    y: (Math.floor(cell / GRID) + 0.5 + (rand() * 2 - 1) * jitter) / GRID,
    kind: kinds[i],
  }))
  const free = kinds.slice(size)
  return { size, items, changed: change ? Math.floor(rand() * size) : null, newKind: free[Math.floor(rand() * free.length)] }
}

/**
 * Change or no change, half and half over the run: a shuffled list of TRIALS answers, exactly TRIALS / 2 of each,
 * decided up front (the staircase only picks the number of shapes).
 */
export const makeChangePlan = (rand: Rand = Math.random) =>
  shuffle(Array.from({ length: TRIALS }, (_, i) => i < TRIALS / 2), rand)

/** Staircase state: shapes on the next trial and right answers in a row at this size. */
export interface Stair { size: number; streak: number }
export const START_STAIR: Stair = { size: START_SIZE, streak: 0 }

export function nextStair(s: Stair, correct: boolean): Stair {
  if (!correct) return { size: Math.max(MIN_SIZE, s.size - 1), streak: 0 }
  if (s.streak + 1 >= 2) return { size: Math.min(MAX_SIZE, s.size + 1), streak: 0 }
  return { size: s.size, streak: s.streak + 1 }
}

export interface Answer { size: number; change: boolean; saidChange: boolean }

/**
 * Share of answers treated as slips (a blink, a misclick: answered at random). Without it, a mistake on a small board
 * reads as "can't even hold 4", and two early mistakes cost a strong player ~4 shapes; with it, ~0.1–0.4.
 */
export const LAPSE = 0.08

/**
 * Warm-up weighting: round 1 counts WEIGHT_START, rising evenly to full weight at round WEIGHT_FULL_AT, all later rounds
 * count fully. Slips while you settle in cost little (two wrong answers in rounds 1–5: ~0.2 shapes instead of ~0.5), and
 * a disastrous start can't sink the run (~0.5 instead of ~1.7 shapes for four wrong answers), without "useless" practice
 * rounds. (Chosen 2026-11-17 from simulations; see docs/reviews/2026-11-17-new-tests.md.)
 */
export const WEIGHT_START = 0.4
export const WEIGHT_FULL_AT = 10
export const roundWeight = (i: number) => Math.min(1, WEIGHT_START + ((1 - WEIGHT_START) * i) / (WEIGHT_FULL_AT - 1))

/** Chance of answering "changed" under the model: K shapes held, guess rate g, LAPSE slips. */
function pChanged(size: number, change: boolean, k: number, g: number) {
  const held = Math.min(1, k / size)
  const p = change ? held + (1 - held) * g : g
  return LAPSE / 2 + (1 - LAPSE) * p
}

/**
 * Below this gap between hit rate and false-alarm rate, the answers barely tell changed from unchanged boards apart,
 * and the score is scaled down towards 0. (When almost every answer is the same, "changed" every time, the model fit
 * alone can't separate capacity from guessing and would still credit a few shapes.) Real players are far above it
 * (gap ~0.4–0.8); random clicking averages 0.
 */
export const MIN_GAP = 0.25

/**
 * Capacity: the number of shapes K (0–MAX_SIZE, steps of 0.1) that best explains all answers (the first rounds weighted
 * less, see roundWeight), with the guess rate
 * fitted too (maximum likelihood, whole-display model as in Pashler's K, plus slips), scaled down when hit rate −
 * false-alarm rate is below MIN_GAP. Rounded to 0.1.
 */
export function capacityScore(answers: Answer[]) {
  if (!answers.length) return 0
  const { hit, fa } = rates(answers)
  const gap = Math.max(0, Math.min(1, (hit - fa) / MIN_GAP))
  return Math.round(fitK(answers) * gap * 10) / 10
}

/** The maximum-likelihood K alone (see capacityScore). */
export function fitK(answers: Answer[]) {
  let best = -Infinity
  let bestK = 0
  for (let k10 = 0; k10 <= MAX_SIZE * 10; k10++) {
    const k = k10 / 10
    for (let g = 0.01; g < 1; g += 0.04) {
      let ll = 0
      answers.forEach((a, i) => {
        const p = pChanged(a.size, a.change, k, g)
        ll += roundWeight(i) * Math.log(a.saidChange ? p : 1 - p)
      })
      if (ll > best + 1e-9) {
        best = ll
        bestK = k
      }
    }
  }
  return bestK
}

/** Average number of shapes over the last `n` rounds (where the staircase has settled near your limit). */
export const avgLastShapes = (answers: Answer[], n = 20) => {
  const last = answers.slice(-n)
  return last.length ? last.reduce((s, a) => s + a.size, 0) / last.length : 0
}

/** Hit rate (changes spotted) and false-alarm rate ("changed" when nothing changed). */
export function rates(answers: Answer[]) {
  const ch = answers.filter((a) => a.change)
  const same = answers.filter((a) => !a.change)
  return {
    hit: ch.length ? ch.filter((a) => a.saidChange).length / ch.length : 0,
    fa: same.length ? same.filter((a) => a.saidChange).length / same.length : 0,
  }
}
