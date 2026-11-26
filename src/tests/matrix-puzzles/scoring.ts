import { randInt, shuffle, type Rand } from '../../lib/random'

/** A run lasts 5 minutes: solve as many puzzles as you can. */
export const DURATION_MS = 300_000
/** Solved puzzles at which each level starts: 2 puzzles on levels 1 and 2, 3 on levels 3 and 4, then level 5. */
export const LEVEL_AT = [0, 2, 4, 7, 10]
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
 * - `dots`: which of the 8 spots around the edge have a dot (a bit mask, bit 0 = top left, then clockwise);
 * - `stripe`: the direction of the background stripes (0 horizontal, then 45° clockwise per step).
 */
export interface Cell { shape: number; count: number; fill: number; dots: number; stripe: number }
export type Attr = keyof Cell
export const ATTRS: Attr[] = ['shape', 'count', 'fill', 'dots', 'stripe']
const FIGURE: Attr[] = ['shape', 'count', 'fill']
export const RANGE: Record<Attr, [number, number]> = {
  shape: [0, 4], count: [1, 6], fill: [0, 2], dots: [0, 255], stripe: [0, 3],
}
/** Stripes turn round (4 directions); dots move round the 8 spots. */
const CYCLE: Partial<Record<Attr, number>> = { stripe: 4 }

/**
 * Rule kinds (Raven-style, as in RAVEN / I-RAVEN), each along rows or down columns (`dir`):
 * - same: the same within each line, different between lines;
 * - step: one step per cell (number, fill: ±1; stripes: turn 45°; dots: move round 1 or 2 spots);
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
  /** False: the cells have a plain background (the `stripe` values are then not drawn). */
  stripes: boolean
  rules: Rule[]
  /** 3 × 3, row by row; the last one is the answer. */
  cells: Cell[]
  options: Cell[]
  answer: number
}

export const levelOf = (solved: number) => LEVEL_AT.filter((n) => solved >= n).length

/**
 * What each level may use. Level 1 has no background stripes at all; 3 adds a 3rd feature and dots A + B = C,
 * 4 columns and xor, 5 everything.
 */
interface LevelSpec { changing: number; attrs: Attr[]; twists: RuleKind[]; cols: boolean; stripes: boolean }
const LEVELS: LevelSpec[] = [
  { changing: 1, attrs: FIGURE, twists: [], cols: false, stripes: false },
  { changing: 2, attrs: ATTRS, twists: [], cols: false, stripes: true },
  { changing: 3, attrs: ATTRS, twists: ['or'], cols: false, stripes: true },
  { changing: 3, attrs: ATTRS, twists: ['or', 'xor'], cols: true, stripes: true },
  { changing: 3, attrs: ATTRS, twists: ['or', 'xor', 'rowcol'], cols: true, stripes: true },
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
  if (kind === 'same') {
    // Sometimes two lines share a value, so "the value seen exactly twice" isn't always the answer.
    const t = three(attr, rand)
    if (rand() < 0.35) t[rand() < 0.5 ? 2 : 1] = t[0]
    g = t.flatMap((v) => [v, v, v])
  }
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
      // Sometimes two lines start the same (never all three).
      const rows = [0, 1, 2].map((r) => starts[r % starts.length])
      if (starts.length > 1 && rand() < 0.35) rows[rand() < 0.5 ? 2 : 1] = rows[0]
      g = rows.flatMap((s0) => [0, 1, 2].map((c) => s0 + c * step))
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

/**
 * Wrong values for one feature, as a player who misreads the rule would pick them: the other way of combining dots,
 * the rule read the other way (rows / columns), a step too far or the wrong way, a dot moved, a value from the last
 * line. Among those, the ones that show in the 8 cells about as often as the answer come first, so counting how often
 * a value shows ("a dot pattern not in the grid yet", "the value seen twice") doesn't find the answer.
 */
export function wrongValues(attr: Attr, cells: Cell[], rule: Rule | undefined, n: number, rand: Rand): number[] | undefined {
  const a = cells[8][attr]
  const v = (i: number) => cells[i][attr]
  const near = [2, 5, 6, 7].map(v)
  // The last line's two cells, along the rule and across it.
  const [x, y] = rule?.dir === 'col' ? [v(2), v(5)] : [v(6), v(7)]
  const [p, q] = rule?.dir === 'col' ? [v(6), v(7)] : [v(2), v(5)]
  let cands: number[]
  if (attr === 'dots') {
    const moved = [0, 1, 2, 3, 4, 5, 6, 7].filter((i) => (a >> i) & 1).flatMap((i) => [-1, 1].map((d) => (a & ~(1 << i)) | (1 << ((i + d + 8) % 8))))
    const flips = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => a ^ (1 << i))
    const ops = (s: number, t: number) => [s | t, s ^ t, s & t, s & ~t & 255, t & ~s & 255]
    cands = [...ops(x, y), ...ops(p, q), rot(a, 1), rot(a, -1), rot(a, 4), ...moved, ...flips, ...near]
    if (rule?.kind === 'step') cands.push(rot(y, -rule.step!), rot(y, 2 * rule.step!), rot(y, rule.step! > 0 ? rule.step! + 1 : rule.step! - 1))
  } else {
    const k = rule?.kind === 'step' ? rule.step! : 1
    cands = [y + k, y + 2 * k + k, y - k, q + k, a - 1, a + 1, a - 2, a + 2, ...near, ...values(attr)].map((w) => wrap(attr, w))
  }
  const seen = (w: number) => cells.slice(0, 8).filter((c) => c[attr] === w).length
  const ok = [...new Set(cands)].filter((w) => w !== a && (attr === 'dots' ? w > 0 && bits(w) <= 6 : inRange(attr, w)))
  if (ok.length < n) return undefined
  const sa = seen(a)
  // Closest in how often it shows first; earlier (more plausible) candidates win ties, with a little shuffling.
  const keyed = ok.map((w, i) => ({ w, k: Math.abs(seen(w) - sa) * 100 + i / ok.length * 10 + rand() * 4 }))
  return keyed.sort((m, o) => m.k - o.k).slice(0, n).map((m) => m.w)
}

// ---- puzzles ---------------------------------------------------------------------------------------------------------

const STEPS: Partial<Record<Attr, number[]>> = { dots: [1, 2, -1, -2] }

function makeRules(spec: LevelSpec, rand: Rand): Rule[] {
  const dirOf = (): Dir => (spec.cols && rand() < 0.4 ? 'col' : 'row')
  // From level 3 on, the dots often carry the level's new rule.
  const twist = spec.twists.length && rand() < 0.6 ? pick(spec.twists, rand) : undefined
  let pool = shuffle(spec.attrs, rand)
  if (twist) pool = ['dots', ...pool.filter((a) => a !== 'dots')]
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

/**
 * A new puzzle for `level`. With `keep` (the rules of a puzzle just answered wrong), it uses the same rules with new
 * values, so a quick wrong guess can't swap a hard puzzle for an easier one; new rules if those find no valid grid.
 */
export function makePuzzle(level: number, rand: Rand = Math.random, keep?: Rule[]): Puzzle {
  const spec = levelSpec(level)
  for (let tries = 0; ; tries++) {
    const rules = keep && tries < 200 ? keep.map((r) => ({ ...r })) : makeRules(spec, rand)
    const ruleOf = (a: Attr) => rules.find((r) => r.attr === a)
    const g = {} as Record<Attr, number[]>
    for (const a of ATTRS) {
      const rule = ruleOf(a)
      if (rule) { g[a] = grid(rule, rand); continue }
      const v =
        a === 'dots' ? sparse(0, 2, rand)
        : a === 'count' ? randInt(1, 6, rand)
        : pick(values(a), rand)
      g[a] = Array(9).fill(v)
    }
    const cells: Cell[] = Array.from({ length: 9 }, (_, i) => Object.fromEntries(ATTRS.map((a) => [a, g[a][i]])) as unknown as Cell)
    if (!isUnique(cells)) continue

    // 8 options from the changing features only, so a glance at a feature that never changes rules none out:
    // 2 × 2 × 2 values with 3 changing features (I-RAVEN: every value in exactly half the options), 4 × 2 with 2.
    // With 1 (level 1): 4 values of it × 2 of a fixed feature.
    const answerCell = cells[8]
    const usable = (a: Attr) => !(a === 'stripe' && !spec.stripes)
    const changing = shuffle(rules.map((r) => r.attr), rand).filter(usable)
    const fixed = shuffle(ATTRS.filter((a) => !ruleOf(a)), rand)
    const shapes = changing.length >= 3 ? [[2, 2, 2]] : changing.length === 2 ? [[4, 2], [2, 4]] : [[4, 2]]
    let plan: { attr: Attr; vals: number[] }[] | undefined
    for (const sizes of shapes) {
      const attrs = changing.length >= 2 ? changing.slice(0, sizes.length) : [changing[0], ...fixed.filter(usable)]
      if (attrs[0] === undefined) break
      const out: { attr: Attr; vals: number[] }[] = []
      for (const a of attrs) {
        const k = sizes[out.length]
        if (k === undefined) break
        const w = wrongValues(a, cells, ruleOf(a), k - 1, rand)
        if (w) out.push({ attr: a, vals: [answerCell[a], ...w] })
        else if (changing.length >= 2 || out.length === 0) break
      }
      if (out.length === sizes.length) { plan = out; break }
    }
    if (!plan) continue
    let opts: Cell[] = [answerCell]
    for (const { attr, vals } of plan) opts = opts.flatMap((o) => vals.map((w) => ({ ...o, [attr]: w })))
    const options = shuffle(opts, rand)
    return { level, stripes: spec.stripes, rules, cells, options, answer: options.findIndex((o) => sameCell(o, answerCell)) }
  }
}

export const sameCell = (a: Cell, b: Cell) => ATTRS.every((k) => a[k] === b[k])
