import { randInt, shuffle, type Rand } from '../../lib/random'

/** A run lasts 5 minutes: solve as many puzzles as you can. */
export const DURATION_MS = 300_000
/** Solved puzzles per level. */
export const PER_LEVEL = 2
/**
 * A wrong answer costs at least PENALTY_MS on that puzzle: the time already spent counts towards it, but the clock
 * always loses at least MIN_PENALTY_MS. A quick guess costs the whole PENALTY_MS, so random guessing doesn't pay.
 */
export const PENALTY_MS = 15_000
export const MIN_PENALTY_MS = 5_000
export const penaltyMs = (spentMs: number) => Math.max(MIN_PENALTY_MS, PENALTY_MS - spentMs)

/**
 * One cell:
 * - `count` copies (1–6) of a `shape` (0 triangle, 1 square, 2 hexagon, 3 circle, 4 star) with a `fill` (0 black,
 *   1 grey, 2 white: in order, so it can step);
 * - `size` (0 small, 1 medium, 2 large) only counts for a single copy; with 2–6 copies it is always 1;
 * - `dots`: which of the 8 spots around the edge have a dot (a bit mask, bit 0 = top left, then clockwise);
 * - `stripe`: the direction of the background stripes (0 horizontal, then 45° clockwise per step).
 */
export interface Cell { shape: number; count: number; size: number; fill: number; dots: number; stripe: number }
export type Attr = keyof Cell
export const ATTRS: Attr[] = ['shape', 'count', 'size', 'fill', 'dots', 'stripe']
const FIGURE: Attr[] = ['shape', 'count', 'size', 'fill']
export const RANGE: Record<Attr, [number, number]> = {
  shape: [0, 4], count: [1, 6], size: [0, 2], fill: [0, 2], dots: [0, 255], stripe: [0, 3],
}
/** Stripes turn round (4 directions); dots move round the 8 spots. */
const CYCLE: Partial<Record<Attr, number>> = { stripe: 4 }

/**
 * Rule kinds (Raven-style, as in RAVEN / I-RAVEN), each along rows or down columns (`dir`):
 * - same: the same within each line, different between lines;
 * - step: one step per cell (number, size, fill: ±1; stripes: turn 45°; dots: move round 1 or 2 spots);
 * - three: 3 values, each once in every line;
 * - or / xor (dots only): the 3rd cell has the dots of the first two (xor: shared dots disappear);
 * - rowcol (dots only): every cell has its row's dot and its column's dot.
 * Features without a rule are the same in all 9 cells.
 */
export type RuleKind = 'same' | 'step' | 'three' | 'or' | 'xor' | 'rowcol'
export type Dir = 'row' | 'col'
export interface Rule { attr: Attr; kind: RuleKind; dir: Dir; step?: number }

export interface Puzzle {
  level: number
  rules: Rule[]
  /** 3 × 3, row by row; the last one is the answer. */
  cells: Cell[]
  options: Cell[]
  answer: number
}

export const levelOf = (solved: number) => Math.min(LEVELS.length, 1 + Math.floor(solved / PER_LEVEL))

/** What each level may use. Level 3 adds a 3rd feature and dots A + B = C, 4 columns and xor, 5 everything. */
interface LevelSpec { changing: number; attrs: Attr[]; twists: RuleKind[]; cols: boolean }
const LEVELS: LevelSpec[] = [
  { changing: 1, attrs: FIGURE, twists: [], cols: false },
  { changing: 2, attrs: ATTRS, twists: [], cols: false },
  { changing: 3, attrs: ATTRS, twists: ['or'], cols: false },
  { changing: 3, attrs: ATTRS, twists: ['or', 'xor'], cols: true },
  { changing: 3, attrs: ATTRS, twists: ['or', 'xor', 'rowcol'], cols: true },
]
export const levelSpec = (level: number) => LEVELS[Math.min(level, LEVELS.length) - 1]

const pick = <T,>(xs: T[], rand: Rand) => xs[randInt(0, xs.length - 1, rand)]

// ---- dots as bit masks -------------------------------------------------------------------------------------------
export const bits = (m: number) => { let n = 0; for (let i = 0; i < 8; i++) n += (m >> i) & 1; return n }
export const rot = (m: number, k: number) => { const s = ((k % 8) + 8) % 8; return ((m << s) | (m >> (8 - s))) & 255 }
/** A mask with `lo`–`hi` dots (sparse: few dots read better than many). */
function sparse(lo: number, hi: number, rand: Rand) {
  return shuffle([0, 1, 2, 3, 4, 5, 6, 7], rand).slice(0, randInt(lo, hi, rand)).reduce((m, i) => m | (1 << i), 0)
}
function distinctMasks(n: number, lo: number, hi: number, rand: Rand) {
  const out = new Set<number>()
  while (out.size < n) out.add(sparse(lo, hi, rand))
  return [...out]
}

const values = (attr: Attr) => {
  const [lo, hi] = RANGE[attr]
  return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
}
const wrap = (attr: Attr, v: number) => { const n = CYCLE[attr]; return n ? ((v % n) + n) % n : v }
const inRange = (attr: Attr, v: number) => v >= RANGE[attr][0] && v <= RANGE[attr][1]
const transpose = <T,>(xs: T[]) => xs.map((_, i) => xs[(i % 3) * 3 + Math.floor(i / 3)])

/** Three distinct values for a feature. */
const three = (attr: Attr, rand: Rand) => (attr === 'dots' ? distinctMasks(3, 1, 3, rand) : shuffle(values(attr), rand).slice(0, 3))

/** The 9 values of one feature by its rule, row by row (built along rows, turned for a column rule). */
function grid(rule: Rule, rand: Rand): number[] {
  const { attr, kind } = rule
  let g: number[]
  if (kind === 'same') g = three(attr, rand).flatMap((v) => [v, v, v])
  else if (kind === 'three') {
    const t = three(attr, rand)
    const shift = pick([1, 2], rand)
    g = [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => t[(c + r * shift) % 3]))
  } else if (kind === 'step') {
    const step = rule.step!
    if (attr === 'dots') {
      g = distinctMasks(3, 1, 3, rand).flatMap((m) => [m, rot(m, step), rot(m, 2 * step)])
    } else if (CYCLE[attr]) {
      g = shuffle(values(attr), rand).slice(0, 3).flatMap((s) => [0, 1, 2].map((c) => wrap(attr, s + c * step)))
    } else {
      const [lo, hi] = RANGE[attr]
      const starts = shuffle(values(attr).filter((v) => v + 2 * step >= lo && v + 2 * step <= hi), rand)
      g = [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => starts[r % starts.length] + c * step))
    }
  } else if (kind === 'or' || kind === 'xor') {
    g = [0, 1, 2].flatMap(() => {
      for (;;) {
        const a = sparse(1, 3, rand), b = sparse(1, 3, rand)
        const c = kind === 'or' ? a | b : a ^ b
        if (a !== b && c !== a && c !== b && c !== 0) return [a, b, c]
      }
    })
  } else {
    // rowcol: 6 different spots, one per row and one per column.
    const s = shuffle([0, 1, 2, 3, 4, 5, 6, 7], rand)
    g = [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => (1 << s[r]) | (1 << s[3 + c])))
  }
  return rule.dir === 'col' ? transpose(g) : g
}

// ---- the correctness check: every reasonable rule that fits the 8 cells must give the same 9th ---------------------

/**
 * Every value for the missing cell that some rule predicts from the 8 visible values — over ALL rule kinds and both
 * directions, also ones the level doesn't use yet (and a few the generator never uses, like sums or "only shared
 * dots"), since a player may see any of them.
 */
export function predictions(attr: Attr, xs: number[]): Set<number> {
  const out = new Set<number>()
  const add = (v: number) => { if (attr === 'dots' ? v >= 0 && v <= 255 : inRange(attr, wrap(attr, v))) out.add(wrap(attr, v)) }
  for (const dir of ['row', 'col'] as Dir[]) {
    const g = dir === 'row' ? xs : transpose(xs)
    const L = [g.slice(0, 3), g.slice(3, 6), g.slice(6, 8)]
    const full = [L[0], L[1]]
    // All the same / the same within each line.
    if (full.every((l) => l[0] === l[1] && l[1] === l[2]) && L[2][0] === L[2][1]) add(L[2][0])
    // 3 values, each once per line.
    const set0 = new Set(L[0])
    if (set0.size === 3 && L[1].every((v) => set0.has(v)) && new Set(L[1]).size === 3 && L[2][0] !== L[2][1] && L[2].every((v) => set0.has(v)))
      add([...set0].find((v) => !L[2].includes(v))!)
    if (attr === 'dots') {
      for (let k = 1; k < 8; k++)
        if (full.every((l) => l[1] === rot(l[0], k) && l[2] === rot(l[1], k)) && L[2][1] === rot(L[2][0], k)) add(rot(L[2][1], k))
      const ops = [(a: number, b: number) => a | b, (a: number, b: number) => a ^ b, (a: number, b: number) => a & b,
        (a: number, b: number) => a & ~b & 255, (a: number, b: number) => b & ~a & 255]
      for (const op of ops) if (full.every((l) => l[2] === op(l[0], l[1]))) add(op(L[2][0], L[2][1]))
    } else if (attr !== 'shape') {
      // A fixed step (shapes have no order).
      const n = CYCLE[attr]
      const d = (a: number, b: number) => (n ? wrap(attr, b - a) : b - a)
      const k = d(L[0][0], L[0][1])
      if (full.every((l) => d(l[0], l[1]) === k && d(l[1], l[2]) === k) && d(L[2][0], L[2][1]) === k) add(L[2][1] + k)
      if (attr === 'count') {
        if (full.every((l) => l[2] === l[0] + l[1])) add(L[2][0] + L[2][1])
        if (full.every((l) => l[2] === l[0] - l[1])) add(L[2][0] - L[2][1])
      }
    }
  }
  if (attr === 'dots') {
    // Row part + column part: the dots a row's cells share, plus the dots a column's cells share.
    const R = [0, 1, 2].map((r) => xs[r * 3] & xs[r * 3 + 1])
    const C = [0, 1, 2].map((c) => xs[c] & xs[3 + c])
    if (xs.slice(0, 8).every((v, i) => v === (R[Math.floor(i / 3)] | C[i % 3]))) add(R[2] | C[2])
  }
  return out
}

/** True when every feature has exactly one answer, whatever rule a player sees in it. */
export function isUnique(cells: Cell[]) {
  return ATTRS.every((a) => {
    const p = predictions(a, cells.map((c) => c[a]))
    return p.size === 1 && p.has(cells[8][a])
  })
}

// ---- options ---------------------------------------------------------------------------------------------------------

/** A wrong value for the answer's feature: a slip of the rule, a neighbour, or a value from the last row / column. */
function wrongValue(attr: Attr, cells: Cell[], rule: Rule | undefined, rand: Rand) {
  const a = cells[8][attr]
  const near = [cells[2], cells[5], cells[6], cells[7]].map((c) => c[attr])
  let cands: number[]
  if (attr === 'dots') {
    const [x, y] = rule?.dir === 'col' ? [cells[2].dots, cells[5].dots] : [cells[6].dots, cells[7].dots]
    const flips = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => a ^ (1 << i)).filter((m) => bits(m) >= 1 && bits(m) <= Math.max(3, bits(a)))
    cands = [...near, ...flips]
    // The other way of combining is the strongest distractor.
    if (rule?.kind === 'or') cands = [x ^ y, x ^ y, ...cands]
    if (rule?.kind === 'xor') cands = [x | y, x | y, ...cands]
    if (rule?.kind === 'step') cands = [rot(a, rule.step!), rot(a, -rule.step!), ...cands]
  } else {
    cands = [a - 1, a + 1, ...near].map((v) => wrap(attr, v))
    if (rule?.kind === 'step') cands.push(wrap(attr, a + rule.step!), wrap(attr, a - 2 * rule.step!))
  }
  const ok = cands.filter((v) => v !== a && (attr === 'dots' ? v > 0 : inRange(attr, v)))
  return ok.length ? pick(ok, rand) : undefined
}

// ---- puzzles ---------------------------------------------------------------------------------------------------------

const STEPS: Partial<Record<Attr, number[]>> = { dots: [1, 2, -1, -2] }

function makeRules(spec: LevelSpec, rand: Rand): Rule[] {
  const dirOf = (): Dir => (spec.cols && rand() < 0.4 ? 'col' : 'row')
  // From level 3 on, the dots often carry the level's new rule.
  const twist = spec.twists.length && rand() < 0.6 ? pick(spec.twists, rand) : undefined
  let pool = shuffle(spec.attrs, rand)
  if (twist) pool = ['dots', ...pool.filter((a) => a !== 'dots')]
  // Number and size never change together: size only shows with a single copy.
  pool = pool.filter((a, _, xs) => a !== (xs.indexOf('count') < xs.indexOf('size') ? 'size' : 'count'))
  const rules = pool.slice(0, spec.changing).map((attr): Rule => {
    if (attr === 'dots' && twist) return { attr, kind: twist, dir: twist === 'rowcol' ? 'row' : dirOf() }
    const kinds: RuleKind[] = spec.changing === 1 ? ['same', 'step'] : ['same', 'step', 'step', 'three']
    let kind = pick(kinds, rand)
    if (attr === 'shape' && kind === 'step') kind = 'three'
    return { attr, kind, dir: dirOf(), ...(kind === 'step' && { step: pick(STEPS[attr] ?? [1, -1], rand) }) }
  })
  // At least one rule is not "the same in each row" (otherwise you only copy the row).
  if (rules.every((r) => r.kind === 'same')) {
    const r = rules[0]
    if (r.attr === 'shape') r.kind = 'three'
    else Object.assign(r, { kind: 'step', step: pick(STEPS[r.attr] ?? [1, -1], rand) })
  }
  return rules
}

export function makePuzzle(level: number, rand: Rand = Math.random): Puzzle {
  const spec = levelSpec(level)
  for (;;) {
    const rules = makeRules(spec, rand)
    const ruleOf = (a: Attr) => rules.find((r) => r.attr === a)
    const g = {} as Record<Attr, number[]>
    for (const a of ATTRS) {
      const rule = ruleOf(a)
      if (rule) { g[a] = grid(rule, rand); continue }
      const v =
        a === 'dots' ? sparse(0, 2, rand)
        : a === 'count' ? (ruleOf('size') ? 1 : randInt(1, 6, rand))
        : pick(values(a), rand)
      g[a] = Array(9).fill(v)
    }
    // Size only counts for a single copy.
    if (!ruleOf('size') && g.count.some((c) => c > 1)) g.size = Array(9).fill(1)
    const cells: Cell[] = Array.from({ length: 9 }, (_, i) => Object.fromEntries(ATTRS.map((a) => [a, g[a][i]])) as unknown as Cell)
    if (!isUnique(cells)) continue

    // 8 options = 2 × 2 × 2 values on three features (I-RAVEN): every value is in exactly half the options, so the
    // answer can't be found from the options alone. Changing features first. Number and size are never both used
    // (with 2+ copies the size doesn't show), and number only when the answer is medium-sized for the same reason.
    const answerCell = cells[8]
    const changing = shuffle(rules.map((r) => r.attr), rand)
    const fixed = shuffle(ATTRS.filter((a) => !ruleOf(a)), rand)
    const optAttrs: Attr[] = []
    const wrongs: number[] = []
    for (const a of [...changing, ...fixed]) {
      if (optAttrs.length === 3) break
      if (a === 'size' && (answerCell.count > 1 || optAttrs.includes('count'))) continue
      if (a === 'count' && (answerCell.size !== 1 || optAttrs.includes('size'))) continue
      const w = wrongValue(a, cells, ruleOf(a), rand)
      if (w === undefined) continue
      optAttrs.push(a)
      wrongs.push(w)
    }
    if (optAttrs.length < 3) continue
    let opts: Cell[] = [answerCell]
    optAttrs.forEach((a, i) => { opts = opts.flatMap((o) => [o, { ...o, [a]: wrongs[i] }]) })
    const options = shuffle(opts, rand)
    return { level, rules, cells, options, answer: options.findIndex((o) => sameCell(o, answerCell)) }
  }
}

export const sameCell = (a: Cell, b: Cell) => ATTRS.every((k) => a[k] === b[k])

// ---- the rules in words, for the screen after a mistake ------------------------------------------------------------

const NAME: Record<Attr, string> = { shape: 'Shape', count: 'Number', size: 'Size', fill: 'Fill', dots: 'Dots', stripe: 'Stripes' }

export function describeRules(p: Puzzle): string[] {
  const lines = p.rules.map(({ attr, kind, dir, step }) => {
    const name = NAME[attr]
    const line = dir === 'row' ? 'row' : 'column'
    const along = dir === 'row' ? 'along each row' : 'down each column'
    if (kind === 'same') return `${name}: the same in each ${line}`
    if (kind === 'three') return `${name}: 3 values, each once in every ${line}`
    if (kind === 'or') return `Dots: the 3rd cell has all dots of the first two, ${along}`
    if (kind === 'xor') return `Dots: the 3rd cell has the dots of the first two, shared dots disappear, ${along}`
    if (kind === 'rowcol') return "Dots: every cell has its row's dot and its column's dot"
    const s = step!
    if (attr === 'dots') return `Dots: move ${Math.abs(s)} ${Math.abs(s) === 1 ? 'spot' : 'spots'} ${s > 0 ? 'clockwise' : 'counterclockwise'} per cell, ${along}`
    if (attr === 'stripe') return `Stripes: turn 45° ${s > 0 ? 'clockwise' : 'counterclockwise'} per cell, ${along}`
    const word = { count: ['one more', 'one fewer'], size: ['one size bigger', 'one size smaller'], fill: ['one step lighter', 'one step darker'] }[attr as 'count' | 'size' | 'fill']
    return `${name}: ${word[s > 0 ? 0 : 1]} per cell, ${along}`
  })
  const fixed = ATTRS.filter((a) => !p.rules.some((r) => r.attr === a) && !(a === 'size' && p.cells.some((c) => c.count > 1)))
  if (fixed.length) lines.push(`Always the same: ${fixed.map((a) => NAME[a].toLowerCase()).join(', ')}`)
  return lines
}
