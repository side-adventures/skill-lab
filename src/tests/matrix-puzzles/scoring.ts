import { randInt, shuffle, type Rand } from '../../lib/random'

export const LIVES = 3
/** Time per puzzle: 45 s, and from FAST_FROM solved puzzles on 3 s less per puzzle, down to 20 s. */
export const PUZZLE_MS = 45_000
export const FAST_FROM = 6
export const MIN_PUZZLE_MS = 20_000
/** Solved puzzles per level: every 2 add one more changing feature (up to 3). */
export const PER_LEVEL = 2

/**
 * One cell: `count` copies (1–6) of a shape (triangle, square, hexagon, circle, star), all the same `size` (0–3) and `fill` (0 empty,
 * 1 striped, 2 grey, 3 full).
 */
export interface Cell { shape: number; count: number; size: number; fill: number }
export type Attr = keyof Cell
export const ATTRS: Attr[] = ['shape', 'count', 'size', 'fill']
export const RANGE: Record<Attr, [number, number]> = { shape: [0, 4], count: [1, 6], size: [0, 3], fill: [0, 3] }

/**
 * Row rules (the rules of Raven-style matrices, as in RAVEN / I-RAVEN):
 * - row: the same in each row, different between rows;
 * - progression: one step up (or down) from cell to cell, every row from its own start;
 * - three: three values, each once in every row (the rows are shifts of each other).
 * Features without a rule are the same in every cell. Shapes have no order, so they never use a progression.
 */
export type RuleKind = 'row' | 'progression' | 'three'
export interface Rule { attr: Attr; kind: RuleKind; step?: number }

export interface Puzzle {
  level: number
  rules: Rule[]
  /** 3 × 3, row by row; the last one is the answer. */
  cells: Cell[]
  options: Cell[]
  answer: number
}

export const levelOf = (solved: number) => 1 + Math.floor(solved / PER_LEVEL)
export const changingOf = (level: number) => Math.min(3, level)
export const puzzleMs = (solved: number) =>
  Math.max(MIN_PUZZLE_MS, PUZZLE_MS - Math.max(0, solved - FAST_FROM + 1) * 3000)

const values = (attr: Attr) => {
  const [lo, hi] = RANGE[attr]
  return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
}
const pick = <T,>(xs: T[], rand: Rand) => xs[randInt(0, xs.length - 1, rand)]

/** Rule kinds per level: level 1 only simple ones, "three" from level 2, a "row" rule only as the easiest. */
function kindFor(level: number, rand: Rand): RuleKind {
  if (level === 1) return pick(['progression', 'row'], rand)
  if (level <= 3) return pick(['progression', 'progression', 'three', 'row'], rand)
  return pick(['progression', 'three', 'three'], rand)
}

/** The 9 values of one feature, row by row. */
function grid(rule: Rule | undefined, attr: Attr, rand: Rand): number[] {
  const all = values(attr)
  if (!rule) {
    const v = pick(all, rand)
    return Array(9).fill(v)
  }
  if (rule.kind === 'row') {
    const rows = shuffle(all, rand).slice(0, 3)
    return rows.flatMap((v) => [v, v, v])
  }
  if (rule.kind === 'three') {
    const three = shuffle(all, rand).slice(0, 3)
    const shift = pick([1, 2], rand)
    return [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => three[(c + r * shift) % 3]))
  }
  const step = rule.step!
  const [lo, hi] = RANGE[attr]
  const starts = step > 0 ? all.filter((v) => v + 2 * step <= hi) : all.filter((v) => v + 2 * step >= lo)
  // Rows start at different values where possible.
  const rowStarts = shuffle(starts, rand)
  return [0, 1, 2].flatMap((r) => {
    const s = rowStarts[r % rowStarts.length]
    return [0, 1, 2].map((c) => s + c * step)
  })
}

/** A wrong value for the answer's feature: a slip of the rule (one step off, a value from the row) or a neighbour. */
function wrongValue(attr: Attr, cells: Cell[], rule: Rule | undefined, rand: Rand) {
  const answer = cells[8][attr]
  const [lo, hi] = RANGE[attr]
  const cands = [answer - 1, answer + 1, cells[7][attr], cells[6][attr], cells[5][attr]]
  if (rule?.kind === 'progression') cands.push(answer + rule.step!, answer - 2 * rule.step!)
  const ok = [...new Set(cands)].filter((v) => v !== answer && v >= lo && v <= hi)
  return pick(ok, rand)
}

export function makePuzzle(level: number, rand: Rand = Math.random): Puzzle {
  // Count and size never change together: more copies are drawn smaller, so sizes would be hard to compare.
  const pool = shuffle(ATTRS, rand).filter((a, _, xs) => a !== (xs.indexOf('count') < xs.indexOf('size') ? 'size' : 'count'))
  const attrs = pool.slice(0, changingOf(level))
  const rules: Rule[] = attrs.map((attr) => {
    const k = kindFor(level, rand)
    const kind: RuleKind = attr === 'shape' && k === 'progression' ? 'three' : k
    return { attr, kind, ...(kind === 'progression' && { step: pick([1, -1], rand) }) }
  })
  // At least one rule is not a plain "row" rule (otherwise you only copy the row).
  if (rules.every((r) => r.kind === 'row'))
    Object.assign(rules[0], rules[0].attr === 'shape' ? { kind: 'three' } : { kind: 'progression', step: pick([1, -1], rand) })
  const g = Object.fromEntries(ATTRS.map((a) => [a, grid(rules.find((r) => r.attr === a), a, rand)])) as Record<Attr, number[]>
  const cells = Array.from({ length: 9 }, (_, i) => ({ shape: g.shape[i], count: g.count[i], size: g.size[i], fill: g.fill[i] }))

  // 8 options = 2 × 2 × 2 values on three features (I-RAVEN): every value is in exactly half the options, so the
  // answer can't be found from the options alone. Changing features first, then fixed ones.
  const optAttrs = [...shuffle(attrs, rand), ...shuffle(ATTRS.filter((a) => !attrs.includes(a)), rand)].slice(0, 3)
  const answerCell = cells[8]
  let opts: Cell[] = [answerCell]
  for (const a of optAttrs) {
    const w = wrongValue(a, cells, rules.find((r) => r.attr === a), rand)
    opts = opts.flatMap((o) => [o, { ...o, [a]: w }])
  }
  const options = shuffle(opts, rand)
  return { level, rules, cells, options, answer: options.findIndex((o) => sameCell(o, answerCell)) }
}

export const sameCell = (a: Cell, b: Cell) => ATTRS.every((k) => a[k] === b[k])
