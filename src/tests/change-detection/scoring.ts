import { shuffle, type Rand } from '../../lib/random'

/** Items sit in a GRID × GRID grid of cells, one per cell, jittered inside it. */
export const GRID = 5
export const ITEM = 0.6 // of a cell
/** Set sizes; each comes TRIALS_PER_SIZE times (half with a change), all mixed. */
export const SET_SIZES = [4, 6, 8] as const
export const TRIALS_PER_SIZE = 10
/** Sizes the capacity score is averaged over (4 items is too easy to say much). */
export const SCORED_SIZES = [6, 8]
export const FIX_MS = 600
export const SAMPLE_MS = 500
export const BLANK_MS = 900

/**
 * The 10 kinds of item (more than the largest display, so a change always brings in a kind that isn't on the board
 * and can't be spotted as a duplicate): each color always comes with its own shape, so a change is never a change of color alone
 * (color is never the only cue). Shapes are 24 × 24 paths, drawn filled.
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
] as const

export interface Item { x: number; y: number; kind: number }
export interface Trial {
  size: number
  items: Item[]
  /** Index of the item that changes in the test display, or null for "same". */
  changed: number | null
  /** The kind it changes into (one not in the display). */
  newKind: number
}

export function makeTrials(rand: Rand = Math.random): Trial[] {
  const plan = SET_SIZES.flatMap((size) => Array.from({ length: TRIALS_PER_SIZE }, (_, i) => ({ size, change: i < TRIALS_PER_SIZE / 2 })))
  return shuffle(plan, rand).map(({ size, change }) => {
    const kinds = shuffle(KINDS.map((_, i) => i), rand)
    const cells = shuffle(Array.from({ length: GRID * GRID }, (_, i) => i), rand).slice(0, size)
    const jitter = (1 - ITEM) / 2
    const items = cells.map((cell, i) => ({
      x: ((cell % GRID) + 0.5 + (rand() * 2 - 1) * jitter) / GRID,
      y: (Math.floor(cell / GRID) + 0.5 + (rand() * 2 - 1) * jitter) / GRID,
      kind: kinds[i],
    }))
    // All kinds on the board differ; a change brings in one of the kinds not shown.
    const free = kinds.slice(size)
    const changed = change ? Math.floor(rand() * size) : null
    return { size, items, changed, newKind: free[Math.floor(rand() * free.length)] }
  })
}

export interface Answer { size: number; change: boolean; saidChange: boolean }

/** Cowan's K for one set size: N × (hit rate − false-alarm rate). */
export function capacity(answers: Answer[], size: number) {
  const a = answers.filter((x) => x.size === size)
  const ch = a.filter((x) => x.change)
  const same = a.filter((x) => !x.change)
  if (!ch.length || !same.length) return undefined
  const hit = ch.filter((x) => x.saidChange).length / ch.length
  const fa = same.filter((x) => x.saidChange).length / same.length
  return { k: size * (hit - fa), hit, fa }
}

/** Score: K averaged over SCORED_SIZES, at least 0, rounded to 0.1 items. */
export function capacityScore(answers: Answer[]) {
  const ks = SCORED_SIZES.map((s) => capacity(answers, s)?.k ?? 0)
  return Math.max(0, Math.round((ks.reduce((a, b) => a + b, 0) / ks.length) * 10) / 10)
}
