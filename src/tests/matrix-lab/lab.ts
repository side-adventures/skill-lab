/**
 * Matrix Lab: random puzzles from the new figure ideas, to try them out before any of them goes into Matrix Puzzles.
 * Not a scored test. Puzzles are built straight from their rules; there is no full "only one answer" check here
 * (the game has one), so a puzzle may now and then allow a second reading.
 */
import { randInt, shuffle, type Rand } from '../../lib/random'

// ---- parts: what a cell is made of -----------------------------------------------------------------------------------

/** 9 clearly different shapes (index = shape id). */
export const SHAPE_NAMES = ['triangle', 'square', 'circle', 'star', 'cross', 'heart', 'moon', 'arrow', 'bolt']
/** Shapes with room for a shape inside (shape in shape): triangle, square, circle, cross, heart. */
const ROOMY = [0, 1, 2, 4, 5]

/** What the middle of the cells shows (the dots and stripes go round / behind it). */
export type Kind = 'copies' | 'order' | 'nest' | 'set' | 'quad'
export const KINDS: Kind[] = ['copies', 'order', 'nest', 'set', 'quad']
export const KIND_NAMES: Record<Kind, string> = {
  copies: 'Copies', order: 'Shape order', nest: 'Shape in shape', set: 'Shape sets', quad: '2 × 2 grid',
}

/**
 * The parts of a cell, each a number or a short list:
 * - shape 0–8, count 1–9 (no tripling: 1 3 9 is too easy), fill 0–2 (black, grey, white): the copies;
 * - order: 3 shape ids, drawn left to right;
 * - nest: [outer, inner] shape ids; ofill / ifill: their fills;
 * - set: 1–4 different shape ids in a row, in the order you read them: combining keeps the 1st cell's shapes first;
 * - quad: 4 colours (0 black, 1 grey, 2 white): top left, top right, bottom left, bottom right;
 * - dots: bit mask over the 8 edge spots (bit 0 top left, clockwise); stripe: −1 none, 0–3 direction.
 */
export type Part = 'shape' | 'count' | 'fill' | 'order' | 'nest' | 'ofill' | 'ifill' | 'set' | 'quad' | 'dots' | 'stripe'
export type Val = number | number[]
export type LabCell = Partial<Record<Part, Val>>

export const key = (v: unknown) => JSON.stringify(v)
const eq = (a: Val | undefined, b: Val | undefined) => key(a) === key(b)
const pick = <T,>(xs: T[], rand: Rand) => xs[randInt(0, xs.length - 1, rand)]
const bitsOf = (m: number, n: number) => Array.from({ length: n }, (_, i) => i).filter((i) => (m >> i) & 1)
export const bitCount = (m: number) => bitsOf(m, 9).length
const rot8 = (m: number, k: number) => { const s = ((k % 8) + 8) % 8; return ((m << s) | (m >> (8 - s))) & 255 }
const maskOf = (ids: number[]) => ids.reduce((m, i) => m | (1 << i), 0)

/** How each part can be misread: other ways to combine two cells, other moves, small changes. */
interface PartType {
  valid: (v: Val) => boolean
  ops?: ((a: Val, b: Val) => Val)[]
  moves?: ((v: Val) => Val)[]
  near: (v: Val, rand: Rand) => Val[]
}
const num = (lo: number, hi: number, cyc = 0): PartType => ({
  valid: (v) => typeof v === 'number' && (cyc ? true : v >= lo && v <= hi),
  near: (v) => [-1, 1, -2, 2].map((d) => (cyc ? ((((v as number) + d) % cyc) + cyc) % cyc : (v as number) + d)),
})
const maskOps = [(a: number, b: number) => a | b, (a: number, b: number) => a ^ b, (a: number, b: number) => a & b, (a: number, b: number) => a & ~b]
const swap = (xs: number[], i: number, j: number) => { const c = [...xs]; [c[i], c[j]] = [c[j], c[i]]; return c }
const turnQ = (q: number[]) => [q[2], q[0], q[3], q[1]]

export const PARTS: Record<Part, PartType> = {
  shape: { valid: (v) => typeof v === 'number' && v >= 0 && v <= 8, near: (_, rand) => shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8], rand).slice(0, 3) },
  count: {
    ...num(1, 9),
    ops: [(a, b) => (a as number) + (b as number), (a, b) => Math.abs((a as number) - (b as number)), (a, b) => (a as number) * (b as number)],
    moves: [(v) => (v as number) + 1, (v) => (v as number) - 1, (v) => (v as number) * 2, (v) => (v as number) + 2],
  },
  fill: num(0, 2),
  ofill: num(0, 2),
  ifill: num(0, 2),
  stripe: num(0, 3, 4),
  dots: {
    valid: (v) => typeof v === 'number' && v > 0 && v < 256 && bitCount(v) <= 6,
    ops: maskOps.map((f) => (a: Val, b: Val) => f(a as number, b as number) & 255),
    moves: [1, -1, 2, -2].map((k) => (v: Val) => rot8(v as number, k)),
    near: (v) => bitsOf(v as number, 8).flatMap((i) => [-1, 1].map((d) => ((v as number) & ~(1 << i)) | (1 << ((i + d + 8) % 8)))),
  },
  set: {
    valid: (v) => Array.isArray(v) && v.length >= 1 && v.length <= 4 && new Set(v).size === v.length,
    // In reading order: what the 1st cell has comes first, then what only the 2nd has.
    ops: [
      (a, b) => [...(a as number[]), ...(b as number[]).filter((x) => !(a as number[]).includes(x))],
      (a, b) => [...(b as number[]), ...(a as number[]).filter((x) => !(b as number[]).includes(x))],
      (a, b) => [...(a as number[]).filter((x) => !(b as number[]).includes(x)), ...(b as number[]).filter((x) => !(a as number[]).includes(x))],
      (a, b) => [...(b as number[]).filter((x) => !(a as number[]).includes(x)), ...(a as number[]).filter((x) => !(b as number[]).includes(x))],
      (a, b) => (a as number[]).filter((x) => (b as number[]).includes(x)),
    ],
    near: (v) => { const xs = v as number[]; return [[...xs].reverse(), [...xs.slice(1), xs[0]], xs.slice(1), xs.slice(0, -1)] },
  },
  order: {
    valid: (v) => Array.isArray(v) && v.length === 3,
    moves: [(v) => [(v as number[])[2], (v as number[])[0], (v as number[])[1]], (v) => [(v as number[])[1], (v as number[])[2], (v as number[])[0]],
      (v) => swap(v as number[], 0, 1), (v) => swap(v as number[], 1, 2), (v) => swap(v as number[], 0, 2)],
    near: (v) => [swap(v as number[], 0, 1), swap(v as number[], 1, 2), swap(v as number[], 0, 2)],
  },
  nest: {
    valid: (v) => Array.isArray(v) && v.length === 2 && v[0] !== v[1],
    ops: [(a, b) => [(a as number[])[0], (b as number[])[1]], (a, b) => [(b as number[])[0], (a as number[])[1]], (a, b) => [(a as number[])[1], (b as number[])[0]]],
    moves: [(v) => [(v as number[])[1], (v as number[])[0]]],
    near: (v, rand) => { const [o, i] = v as number[]; const s = pick(ROOMY.filter((x) => x !== o && x !== i), rand); return [[i, o], [o, s], [s, i]] },
  },
  quad: {
    valid: (v) => Array.isArray(v) && v.length === 4,
    ops: [
      (a, b) => (a as number[]).map((x, i) => (x === (b as number[])[i] ? x : 1)),
      (a, b) => (a as number[]).map((x, i) => Math.min(x, (b as number[])[i])),
      (a, b) => (a as number[]).map((x, i) => Math.max(x, (b as number[])[i])),
    ],
    moves: [(v) => turnQ(v as number[]), (v) => turnQ(turnQ(turnQ(v as number[]))), (v) => [(v as number[])[1], (v as number[])[0], (v as number[])[3], (v as number[])[2]]],
    near: (v, rand) => { const q = v as number[]; const i = randInt(0, 3, rand); return [0, 1, 2].filter((c) => c !== q[i]).map((c) => q.map((x, j) => (j === i ? c : x))) },
  },
}

// ---- rules: 9 values for one part ------------------------------------------------------------------------------------

export type Dir = 'row' | 'col' | 'both'
export interface LabRule {
  part: Part
  /** A short name for the log, e.g. "count:double". */
  id: string
  /** Shown after the answer. */
  text: string
  dir: Dir
  /** Not an easy one (medium or hard): what the "no easy rules" mode and the options' 4-way split look for. */
  hard: boolean
  /** How hard the rule is (set from `LEVELS` by its id). */
  level: Level
  grid: Val[]
  /** For misreadings: how the rule builds the 3rd cell of a line from the first two, or each cell from the last. */
  op?: (a: Val, b: Val) => Val
  move?: (v: Val) => Val
  /** Extra misreadings of the missing cell, when the rule can't give them through `op` / `move`. */
  wrong?: Val[]
}

/**
 * Rule difficulty. Easy: seen by comparing neighbouring cells (the same, one step, each once). Medium: one clear
 * operation to apply (move, double, add, combine). Hard: several things at once or a twist (what disappears, row and
 * column together).
 */
export type Level = 'easy' | 'medium' | 'hard'
export const LEVEL_RANK: Record<Level, number> = { easy: 0, medium: 1, hard: 2 }
export const LEVELS: Record<string, Level> = {
  'shape:same': 'easy', 'shape:three': 'easy',
  'fill:same': 'easy', 'fill:three': 'easy', 'fill:step': 'easy', 'ofill:three': 'easy', 'ifill:three': 'easy',
  'stripe:same': 'easy', 'stripe:turn': 'easy',
  'count:same': 'easy', 'count:step': 'easy', 'count:double': 'medium', 'count:plus': 'medium', 'count:grid': 'medium',
  // Dots: so many patterns that even the simple rules take a moment.
  'dots:same': 'medium', 'dots:three': 'medium', 'dots:turn': 'hard', 'dots:or': 'hard', 'dots:xor': 'hard', 'dots:rowcol': 'hard',
  'order:shift': 'medium', 'order:swaps': 'medium', 'order:window': 'medium',
  'nest:parts': 'medium', 'nest:combine': 'medium', 'nest:combine-back': 'medium', 'nest:chain': 'medium', 'nest:chain-back': 'medium',
  'set:or': 'medium', 'set:xor': 'medium',
  'quad:squares': 'easy', 'quad:turn': 'medium', 'quad:mix': 'hard', 'quad:darker': 'hard', 'quad:lighter': 'hard',
}
/** Rules are built with a rough `hard` flag; the level table then decides. */
const leveled = (r: LabRule | undefined) => {
  if (!r) return r
  r.level = LEVELS[r.id] ?? (r.hard ? 'hard' : 'easy')
  r.hard = r.level !== 'easy'
  return r
}

const transpose = <T,>(xs: T[]) => xs.map((_, i) => xs[(i % 3) * 3 + Math.floor(i / 3)])
const lines = (f: (r: number) => Val[]) => [0, 1, 2].flatMap(f)
const along = (d: Dir) => (d === 'col' ? 'down the columns' : 'along the rows')
const each = (d: Dir) => (d === 'col' ? 'each column' : 'each row')
const orient = (g: Val[], d: Dir) => (d === 'col' ? transpose(g) : g)

function sameRule(part: Part, vals: Val[], dir: Dir, name: string): LabRule {
  return { part, id: `${part}:same`, text: `${name}: the same within ${each(dir)}`, dir, hard: false, level: 'easy', grid: orient(lines((r) => [vals[r], vals[r], vals[r]]), dir) }
}
function threeRule(part: Part, vals: Val[], dir: Dir, name: string, rand: Rand): LabRule {
  const s = pick([1, 2], rand)
  return { part, id: `${part}:three`, text: `${name}: 3 values, each once in ${each(dir)}`, dir, hard: false, level: 'easy', grid: orient(lines((r) => [0, 1, 2].map((c) => vals[(c + r * s) % 3])), dir) }
}
function moveRule(part: Part, starts: Val[], steps: ((v: Val) => Val)[], dir: Dir, id: string, text: string, hard: boolean): LabRule {
  const g = lines((r) => { const a = starts[r]; const b = steps[0](a); return [a, b, steps[1](b)] })
  return { part, id, text, dir, hard, level: hard ? 'hard' : 'easy', grid: orient(g, dir), move: steps[0] === steps[1] ? steps[0] : undefined }
}
function combineRule(part: Part, pair: () => [Val, Val], op: (a: Val, b: Val) => Val, dir: Dir, id: string, text: string): LabRule | undefined {
  const t = PARTS[part]
  const g = lines(() => {
    for (let n = 0; n < 200; n++) {
      const [a, b] = pair()
      const c = op(a, b)
      if (t.valid(c) && !eq(a, b) && !eq(c, a) && !eq(c, b)) return [a, b, c]
    }
    return []
  })
  return g.length === 9 ? { part, id, text, dir, hard: true, level: 'hard', grid: orient(g, dir), op } : undefined
}

const distinct = (n: number, make: () => Val) => { const out = new Map<string, Val>(); for (let i = 0; out.size < n && i < 500; i++) { const v = make(); out.set(key(v), v) } return [...out.values()] }
const sparse = (lo: number, hi: number, n: number, rand: Rand) => maskOf(shuffle(Array.from({ length: n }, (_, i) => i), rand).slice(0, randInt(lo, hi, rand)))
const dirFor = (cols: boolean, rand: Rand): Dir => (cols && rand() < 0.4 ? 'col' : 'row')

/** The rules a part can get. `hard` false: only easy ones; true: only medium and hard ones. */
const ruleFor = (part: Part, opts: LabOptions, hard: boolean, rand: Rand) => leveled(baseRule(part, opts, hard, rand))
function baseRule(part: Part, opts: LabOptions, hard: boolean, rand: Rand): LabRule | undefined {
  const dir = dirFor(opts.cols, rand)
  const three3 = (xs: number[]) => shuffle(xs, rand).slice(0, 3)
  switch (part) {
    case 'shape': return pick([sameRule, threeRule], rand)(part, three3([0, 1, 2, 3, 4, 5, 6, 7, 8]), dir, 'Shape', rand)
    case 'fill': case 'ofill': case 'ifill': {
      const name = { fill: 'Fill', ofill: 'Outer fill', ifill: 'Inner fill' }[part]
      const k = randInt(0, 2, rand)
      if (k === 0) return sameRule(part, three3([0, 1, 2]), dir, name)
      if (k === 1) return threeRule(part, three3([0, 1, 2]), dir, name, rand)
      const up = rand() < 0.5
      return moveRule(part, [0, 1, 2].map(() => (up ? 0 : 2)), [0, 1].map(() => (v: Val) => (v as number) + (up ? 1 : -1)), dir, `${part}:step`, `${name}: ${up ? 'black → grey → white' : 'white → grey → black'} ${along(dir)}`, false)
    }
    case 'stripe': {
      if (rand() < 0.5) return sameRule(part, three3([0, 1, 2, 3]), dir, 'Stripes')
      const k = pick([1, -1], rand)
      return moveRule(part, three3([0, 1, 2, 3]), [0, 1].map(() => (v: Val) => ((((v as number) + k) % 4) + 4) % 4), dir, 'stripe:turn', `Stripes: turn 45° ${k > 0 ? 'clockwise' : 'anticlockwise'} per cell, ${along(dir)}`, false)
    }
    case 'count': {
      const hardNums = opts.numbers.filter((k) => k !== 'step')
      const kinds = hard ? (opts.twoHard ? (hardNums.length ? hardNums : ['double', 'grid', 'plus']) : opts.numbers) : ['step', 'same']
      const k = pick(kinds.length ? kinds : ['step'], rand)
      if (k === 'same') return sameRule(part, three3([1, 2, 3, 4, 5, 6]), dir, 'Number')
      if (k === 'step') {
        const d = pick([1, -1], rand)
        const starts = [0, 1, 2].map(() => (d > 0 ? randInt(1, 7, rand) : randInt(3, 9, rand)))
        return moveRule(part, starts, [0, 1].map(() => (v: Val) => (v as number) + d), dir, 'count:step', `Number: one ${d > 0 ? 'more' : 'fewer'} per cell, ${along(dir)}`, false)
      }
      if (k === 'double') {
        const down = rand() < 0.4
        const starts = [0, 1, 2].map(() => (down ? pick([4, 8], rand) : pick([1, 2], rand)))
        return moveRule(part, starts, [0, 1].map(() => (v: Val) => (down ? (v as number) / 2 : (v as number) * 2)), dir, 'count:double', `Number: ${down ? 'halves' : 'doubles'} per cell, ${along(dir)}`, true)
      }
      if (k === 'grid') {
        // cell = row factor × column factor (1 2 4 / 1 2 4 / 2 4 8)
        const colF = rand() < 0.7 ? [1, 2, 4] : [4, 2, 1]
        const rowF = pick([[1, 1, 2], [1, 2, 1], [2, 1, 1], [1, 2, 2], [2, 2, 1]], rand)
        return { part, id: 'count:grid', text: `Number: doubles ${colF[0] === 1 ? 'left to right' : 'right to left'} in every row; rows with a 2 at the start are doubled too (row × column)`, dir: 'both', hard: true, level: 'hard', grid: [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => rowF[r] * colF[c])) }
      }
      // Never a line that also reads as a step: B = 2 × A gives 1 2 3, 2 4 6, 3 6 9.
      const plusPair = (): [Val, Val] => { for (;;) { const a = randInt(1, 5, rand), b = randInt(1, 5, rand); if (b !== 2 * a) return [a, b] } }
      return combineRule(part, plusPair, (a, b) => (a as number) + (b as number), dir, 'count:plus', `Number: A + B = C ${along(dir)}`)
    }
    case 'dots': {
      if (!hard) return rand() < 0.5
        ? sameRule(part, distinct(3, () => sparse(1, 2, 8, rand)), dir, 'Dots')
        : threeRule(part, distinct(3, () => sparse(1, 2, 8, rand)), dir, 'Dots', rand)
      const k = pick(['turn', 'or', 'xor', 'rowcol'], rand)
      if (k === 'turn') {
        const s = pick([1, 2, -1, -2], rand)
        return moveRule(part, distinct(3, () => sparse(1, 3, 8, rand)), [0, 1].map(() => (v: Val) => rot8(v as number, s)), dir, 'dots:turn', `Dots: move ${Math.abs(s)} spot${Math.abs(s) > 1 ? 's' : ''} ${s > 0 ? 'clockwise' : 'anticlockwise'} per cell, ${along(dir)}`, true)
      }
      if (k === 'rowcol') {
        const s = shuffle([0, 1, 2, 3, 4, 5, 6, 7], rand)
        return { part, id: 'dots:rowcol', text: 'Dots: every cell has its row’s dot plus its column’s dot', dir: 'both', hard: true, level: 'hard', grid: [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => (1 << s[r]) | (1 << s[3 + c]))) }
      }
      const or = k === 'or'
      return combineRule(part, () => [sparse(1, 3, 8, rand), sparse(1, 3, 8, rand)], or ? (a, b) => (a as number) | (b as number) : (a, b) => (a as number) ^ (b as number), dir,
        `dots:${k}`, or ? `Dots: A + B = C ${along(dir)}: the 3rd cell has all dots of the first two` : `Dots: shared dots disappear ${along(dir)}`)
    }
    case 'order': {
      const sets = rand() < 0.5 ? [0, 1, 2].map(() => three3([0, 1, 2, 3, 4, 5, 6, 7, 8])) : (() => { const t = three3([0, 1, 2, 3, 4, 5, 6, 7, 8]); return [t, swap(t, 0, 1), [t[2], t[0], t[1]]] })()
      const k = pick([0, 1, 2, 4], rand)
      const M = PARTS.order.moves!
      if (k === 4) {
        // 4 shapes go round, 3 show at a time: 1 2 3 → 2 3 4 → 3 4 1 (or the other way).
        const d = pick([1, -1], rand)
        const four = () => shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8], rand).slice(0, 4)
        const t0 = four()
        const cyc = rand() < 0.5 ? [0, 1, 2].map(four) : [t0, t0, t0]
        const st = [0, 1, 2].map(() => randInt(0, 3, rand))
        const win = (t: number[], s0: number) => [0, 1, 2].map((i) => t[(((s0 + i) % 4) + 4) % 4])
        const g = lines((rr) => [0, 1, 2].map((c) => win(cyc[rr], st[rr] + c * d)))
        const t = cyc[2], s8 = st[2] + 2 * d
        const ans = win(t, s8)
        return {
          part, id: 'order:window', dir, hard: true, level: 'hard', grid: orient(g, dir),
          text: `Shape order: 4 shapes go round and 3 show at a time; per cell ${along(dir)} they move one place ${d > 0 ? 'left (a new one comes in on the right)' : 'right (a new one comes in on the left)'}`,
          wrong: [win(t, s8 + d), win(t, s8 - 2 * d), [...ans].reverse(), [ans[0], t[(((s8 + 3) % 4) + 4) % 4], ans[2]]],
        }
      }
      if (k === 0) return moveRule(part, sets, [M[0], M[0]], dir, 'order:shift', `Shape order: the last shape jumps to the front, per cell ${along(dir)}`, true)
      if (k === 1) return moveRule(part, sets, [M[1], M[1]], dir, 'order:shift', `Shape order: the first shape jumps to the back, per cell ${along(dir)}`, true)
      return moveRule(part, sets, [M[2], M[3]], dir, 'order:swaps', `Shape order: swap the first two, then the last two, ${along(dir)}`, true)
    }
    case 'nest': {
      const all = ROOMY
      if (!hard) {
        // Outer and inner each with their own simple rule (outer along one way, inner the other).
        const os = three3(all)
        const is2 = three3(all)
        const d2: Dir = dir === 'row' && opts.cols && rand() < 0.5 ? 'col' : dir
        const o = pick([sameRule, threeRule], rand)('shape', os, dir, '', rand).grid
        const i = (o.some((v, n) => n && v !== o[0]) ? pick([sameRule, threeRule], rand) : threeRule)('shape', is2, d2, '', rand).grid
        return { part, id: 'nest:parts', text: `Shape in shape: the outer and the inner shape each follow their own rule (outer ${along(dir)}, inner ${along(d2)})`, dir, hard: false, level: 'easy', grid: o.map((v, n) => [v as number, i[n] as number]) }
      }
      const pair = () => { const s = shuffle(all, rand); return [[s[0], s[1]], [s[2], s[3]]] as [Val, Val] }
      const k = rand()
      if (k < 0.5) {
        // A chain: each shape shows twice in a line, once outside and once inside.
        // Forward: each cell's inner shape is the next cell's outer one; backward: its outer shape is the next one's inner.
        const fwd = rand() < 0.5
        const t0 = three3(all)
        const rowsT = rand() < 0.5 ? [0, 1, 2].map(() => three3(all)) : [t0, [t0[1], t0[2], t0[0]], [t0[2], t0[0], t0[1]]]
        const g = lines((r) => { const t = rowsT[r]; const cells = [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]]; return fwd ? cells : cells.map(([o, i]) => [i, o]) })
        return {
          part, id: fwd ? 'nest:chain' : 'nest:chain-back', dir, hard: true, level: 'hard', grid: orient(g, dir),
          text: fwd
            ? `Shape in shape: each cell's inner shape is the next cell's outer shape, so every shape shows twice ${along(dir)} (once outside, once inside)`
            : `Shape in shape: each cell's outer shape is the next cell's inner shape, so every shape shows twice ${along(dir)} (once outside, once inside)`,
        }
      }
      return rand() < 0.5
        ? combineRule(part, pair, PARTS.nest.ops![0], dir, 'nest:combine', `Shape in shape: the 3rd cell has the outer shape of the 1st and the inner shape of the 2nd, ${along(dir)}`)
        : combineRule(part, pair, PARTS.nest.ops![1], dir, 'nest:combine-back', `Shape in shape: the 3rd cell has the inner shape of the 1st and the outer shape of the 2nd, ${along(dir)}`)
    }
    case 'set': {
      const or = rand() < 0.5
      const pool = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8], rand).slice(0, 4)
      const sub = () => shuffle(pool, rand).slice(0, randInt(1, 2, rand))
      const first = dir === 'col' ? 'top' : 'left'
      return combineRule(part, () => [sub(), sub()], PARTS.set.ops![or ? 0 : 2], dir, `set:${or ? 'or' : 'xor'}`, or
        ? `Shape sets: A + B = C ${along(dir)}: the 3rd cell has all shapes of the first two, the ${first} cell's first, in their order`
        : `Shape sets: shapes in both of the first two disappear, ${along(dir)}; the rest keep their order, the ${first} cell's first`)
    }
    case 'quad': {
      const rq = () => [0, 1, 2, 3].map(() => randInt(0, 2, rand))
      // Hard: mix, darker / lighter; easy: turn, each square its own rule.
      const k = hard ? randInt(1, 2, rand) : pick([0, 3], rand)
      if (k === 0) {
        const cw = rand() < 0.6
        const M = PARTS.quad.moves!
        const starts = distinct(3, () => { const q = rq(); return new Set(q).size > 1 && !eq(q, turnQ(turnQ(q))) ? q : [0, 1, 2, 2] })
        return moveRule(part, starts, [0, 1].map(() => M[cw ? 0 : 1]), dir, 'quad:turn', `2 × 2: the pattern turns a quarter ${cw ? 'clockwise' : 'anticlockwise'} per cell, ${along(dir)}`, false)
      }
      if (k === 1) {
        const bw = () => [0, 1, 2, 3].map(() => pick([0, 2], rand))
        return combineRule(part, () => [bw(), bw()], PARTS.quad.ops![0], dir, 'quad:mix', `2 × 2: mix ${along(dir)}: the same colour stays, black + white turns grey`)
      }
      if (k === 2) {
        const dark = rand() < 0.6
        return combineRule(part, () => [rq(), rq()], PARTS.quad.ops![dark ? 1 : 2], dir, `quad:${dark ? 'darker' : 'lighter'}`, `2 × 2: each square takes the ${dark ? 'darker' : 'lighter'} of the first two, ${along(dir)}`)
      }
      // Each square its own simple rule: one constant, the rest "3 colours once per line".
      const fixedSq = randInt(0, 3, rand)
      const col = randInt(0, 2, rand)
      const per = [0, 1, 2, 3].map((sq) => (sq === fixedSq ? Array(9).fill(col) : threeRule('fill', shuffle([0, 1, 2], rand), dir, '', rand).grid))
      return { part, id: 'quad:squares', text: `2 × 2: one square is always the same colour; each other square has black, grey and white once in ${each(dir)}`, dir, hard: false, level: 'easy', grid: Array.from({ length: 9 }, (_, n) => per.map((g) => g[n] as number)) }
    }
  }
}

/** Outer and inner fill: each colour once per line, and never the same colour inside and outside one cell. */
function nestFills(opts: LabOptions, rand: Rand): LabRule[] {
  const dir = dirFor(opts.cols, rand)
  const o = leveled(threeRule('ofill', shuffle([0, 1, 2], rand), dir, 'Outer fill', rand))!
  const k = pick([1, 2], rand)
  const i: LabRule = { part: 'ifill', id: 'ifill:three', dir, hard: false, level: 'easy', grid: o.grid.map((v) => ((v as number) + k) % 3),
    text: `Inner fill: also each colour once in ${each(dir)}, never the outer fill's colour` }
  return [o, leveled(i)!]
}

// ---- puzzles ---------------------------------------------------------------------------------------------------------

export type NumberRule = 'double' | 'grid' | 'plus' | 'step'
export interface LabOptions {
  kinds: Kind[]
  /** Hard rules for the number of copies. */
  numbers: NumberRule[]
  dots: 'off' | 'easy' | 'hard' | 'mixed'
  stripes: boolean
  /** Rules may also run down the columns. */
  cols: boolean
  /** Exactly 2 changing parts, neither easy: one figure rule and one dot rule; everything else stays the same. */
  twoHard: boolean
}
export const DEFAULT_OPTIONS: LabOptions = { kinds: [...KINDS], numbers: ['double', 'grid', 'plus'], dots: 'mixed', stripes: true, cols: true, twoHard: true }

export interface LabPuzzle {
  kind: Kind
  rules: LabRule[]
  cells: LabCell[]
  options: LabCell[]
  answer: number
  /** The rule the options split on (4 ways, or all 8 when nothing else changes). */
  focus: Part
}

/** The parts each kind of figure has, besides dots and stripes. */
const KIND_PARTS: Record<Kind, Part[]> = {
  copies: ['shape', 'count', 'fill'], order: ['order', 'fill'], nest: ['nest', 'ofill', 'ifill'], set: ['set', 'fill'], quad: ['quad'],
}
const randomValue = (part: Part, rand: Rand): Val => {
  const s9 = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8], rand)
  switch (part) {
    case 'shape': return s9[0]
    case 'count': return randInt(1, 4, rand)
    case 'fill': case 'ofill': return randInt(0, 2, rand)
    case 'ifill': return 2
    case 'stripe': return randInt(0, 3, rand)
    case 'dots': return sparse(0, 2, 8, rand)
    case 'order': return s9.slice(0, 3)
    case 'nest': return shuffle(ROOMY, rand).slice(0, 2)
    case 'set': return s9.slice(0, 2)
    case 'quad': return [0, 1, 2, 3].map(() => randInt(0, 2, rand))
  }
}

/** Wrong values for a part: misreadings of its rule, then small changes; ones seen in the grid as often as the answer first. */
function wrongValues(rule: LabRule | undefined, part: Part, cells: LabCell[], n: number, rand: Rand): Val[] | undefined {
  const t = PARTS[part]
  const a = cells[8][part]!
  const v = (i: number) => cells[i][part]!
  const [x, y] = rule?.dir === 'col' ? [v(2), v(5)] : [v(6), v(7)]
  const [p, q] = rule?.dir === 'col' ? [v(6), v(7)] : [v(2), v(5)]
  const cands: Val[] = []
  for (const op of t.ops ?? []) cands.push(op(x, y), op(p, q), op(y, x))
  for (const mv of t.moves ?? []) cands.push(mv(y), mv(q), mv(a))
  if (rule?.wrong) cands.unshift(...rule.wrong)
  if (rule?.move) cands.push(rule.move(rule.move(y)), rule.move(x))
  cands.push(...t.near(a, rand), ...t.near(y, rand), v(2), v(5), v(6), v(7))
  const seen = (w: Val) => cells.slice(0, 8).filter((c) => eq(c[part], w)).length
  const out = new Map<string, Val>()
  for (const w of cands) if (t.valid(w) && !eq(w, a) && !out.has(key(w))) out.set(key(w), w)
  const ok = [...out.values()]
  if (ok.length < n) return undefined
  const sa = seen(a)
  return ok.map((w, i) => ({ w, k: Math.abs(seen(w) - sa) * 100 + (i / ok.length) * 10 + rand() * 6 }))
    .sort((m, o) => m.k - o.k).slice(0, n).map((m) => m.w)
}

export function makeLabPuzzle(opts: LabOptions, rand: Rand = Math.random): LabPuzzle {
  const kinds = opts.kinds.length ? opts.kinds : KINDS
  for (;;) {
    const kind = pick(kinds, rand)
    const rules: LabRule[] = []
    const add = (r: LabRule | undefined) => { if (r) rules.push(r) }
    // The figure: one rule to work out, plus at most one easy one.
    if (opts.twoHard) {
      add(ruleFor(kind === 'copies' ? 'count' : kind, opts, true, rand))
      add(ruleFor('dots', opts, true, rand))
      if (rules.length < 2) continue
    } else if (kind === 'copies') {
      add(ruleFor('count', opts, opts.numbers.length > 0, rand))
      add(ruleFor(pick(['shape', 'fill'] as Part[], rand), opts, false, rand))
    } else if (kind === 'nest') {
      add(ruleFor('nest', opts, rand() < 0.7, rand))
      if (rand() < 0.5) rules.push(...nestFills(opts, rand))
    } else {
      add(ruleFor(kind, opts, kind !== 'quad' || rand() < 0.5, rand))
      if (kind !== 'quad' && rand() < 0.4) add(ruleFor('fill', opts, false, rand))
    }
    if (rules.length === 0) continue
    if (opts.dots !== 'off' && !opts.twoHard) {
      const hard = opts.dots === 'hard' || (opts.dots === 'mixed' && rand() < 0.4)
      if (opts.dots !== 'mixed' || rand() < 0.75) add(ruleFor('dots', opts, hard, rand))
    }
    if (opts.stripes && !opts.twoHard && rand() < 0.6) add(ruleFor('stripe', opts, false, rand))

    const parts = [...KIND_PARTS[kind], 'dots', 'stripe'] as Part[]
    const fixed = Object.fromEntries(parts.map((pt) => [pt, randomValue(pt, rand)])) as LabCell
    if (!opts.stripes) fixed.stripe = -1
    if (opts.dots === 'off' && !opts.twoHard) fixed.dots = 0
    if (kind === 'nest' && fixed.ofill === 2) fixed.ifill = 0
    const cells: LabCell[] = Array.from({ length: 9 }, (_, i) => {
      const c: LabCell = { ...fixed }
      for (const r of rules) c[r.part] = r.grid[i]
      return c
    })
    // The inner shape always stands out from the outer one.
    if (kind === 'nest' && cells.some((c) => c.ofill === c.ifill || !PARTS.nest.valid(c.nest!))) continue
    // A line rule must not leave the grid looking constant.
    if (rules.some((r) => new Set(r.grid.map(key)).size < 2)) continue

    // Options: 4 values of the rule to work out (answer + 3 misreadings) × 2 of another changing part (or a fixed one).
    const ruleOf = (pt: Part) => rules.find((r) => r.part === pt)
    const top = Math.max(...rules.map((r) => LEVEL_RANK[r.level]))
    const focusRule = pick(rules.filter((r) => LEVEL_RANK[r.level] === top), rand)
    const others = shuffle(rules.filter((r) => r !== focusRule).map((r) => r.part), rand)
    // Only parts that change in the grid vary, so a glance at a part that never changes rules nothing out.
    // With just one changing part, all 8 options differ in it.
    const answerCell = cells[8]
    let w2: { part: Part; w: Val } | undefined
    for (const pt of others) { const w = wrongValues(ruleOf(pt), pt, cells, 1, rand); if (w) { w2 = { part: pt, w: w[0] }; break } }
    const wf = wrongValues(focusRule, focusRule.part, cells, w2 ? 3 : 7, rand)
    if (!wf) continue
    const opts8 = [answerCell[focusRule.part]!, ...wf].flatMap((f) =>
      (w2 ? [answerCell[w2.part]!, w2.w] : [undefined]).map((s) => ({ ...answerCell, [focusRule.part]: f, ...(w2 && { [w2.part]: s }) })))
    if (kind === 'nest' && opts8.some((o) => o.ofill === o.ifill)) continue
    const options = shuffle(opts8, rand)
    return { kind, rules, cells, options, answer: options.findIndex((o) => key(o) === key(answerCell)), focus: focusRule.part }
  }
}
