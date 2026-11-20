import { randInt, shuffle, type Rand } from '../../lib/random'

export const DURATION_MS = 120_000
/** Correct answers per level: every 3 make the pattern harder. */
export const PER_LEVEL = 3

/**
 * A tile: one of 3 kinds (0 triangle = half the tile cut diagonally, 1 quarter circle, 2 half tile), turned to one of
 * 4 corners / sides (`rot`, clockwise). Every kind looks different in each of its 4 turns.
 */
export interface Tile { kind: number; rot: number }
export type Attr = keyof Tile

/**
 * A repeating rule for one feature: the value at (row, col) is `vals[(a·row + b·col + off) mod vals.length]`.
 * (a, b) = (0, 1) repeats along a row, (1, 0) down a column, (1, 1) along the diagonals.
 */
export interface Rule { attr: Attr; vals: number[]; a: number; b: number; off: number }

export interface Pattern {
  level: number
  size: number
  rules: Rule[]
  tiles: Tile[]
  /** The tile that breaks the rule (row * size + col). */
  broken: number
}

export const levelOf = (correct: number) => 1 + Math.floor(correct / PER_LEVEL)

const pick = <T,>(xs: T[], rand: Rand) => xs[randInt(0, xs.length - 1, rand)]
const dir1D = (rand: Rand): [number, number] => pick([[0, 1], [1, 0]], rand)

/** Rotation values for a cycle of p: all 4 turns in order (either way round), or 2 different turns. */
function rotVals(p: number, rand: Rand) {
  if (p === 4) return pick([[0, 1, 2, 3], [0, 3, 2, 1]], rand)
  return shuffle([0, 1, 2, 3], rand).slice(0, 2)
}
const kindVals = (p: number, rand: Rand) => shuffle([0, 1, 2], rand).slice(0, p)

interface Spec { size: number; rules: { attr: Attr; p: number; dir: 'row' | 'col' | '1d' | 'other1d' | 'diag' | 'knight' }[] }
const LEVELS: Spec[] = [
  { size: 4, rules: [{ attr: 'rot', p: 2, dir: '1d' }] },
  { size: 5, rules: [{ attr: 'rot', p: 4, dir: '1d' }] },
  { size: 5, rules: [{ attr: 'rot', p: 4, dir: 'diag' }] },
  { size: 6, rules: [{ attr: 'rot', p: 4, dir: '1d' }, { attr: 'kind', p: 2, dir: 'other1d' }] },
  { size: 6, rules: [{ attr: 'rot', p: 4, dir: 'diag' }, { attr: 'kind', p: 3, dir: '1d' }] },
  { size: 6, rules: [{ attr: 'rot', p: 4, dir: 'knight' }, { attr: 'kind', p: 3, dir: 'diag' }] },
]
export const levelSpec = (level: number) => LEVELS[Math.min(level, LEVELS.length) - 1]

/** Interior cells (never on the outer edge) of one quadrant; the middle row / column of an odd board is left out. */
export function quadrantCells(size: number, q: number) {
  const half = (size - 1) / 2
  const out: number[] = []
  for (let r = 1; r < size - 1; r++)
    for (let c = 1; c < size - 1; c++) {
      if (r === half || c === half) continue
      const qq = (r > half ? 2 : 0) + (c > half ? 1 : 0)
      if (qq === q) out.push(r * size + c)
    }
  return out
}

const valueAt = (rule: Rule, r: number, c: number) => {
  const p = rule.vals.length
  return rule.vals[(((rule.a * r + rule.b * c + rule.off) % p) + p) % p]
}

/** Could `xs` (one feature, row by row) be a repeating rule with only the cell `skip` out of line? */
export function fitsExcept(xs: number[], size: number, skip: number) {
  for (const p of [1, 2, 3, 4])
    for (let a = 0; a < p; a++)
      for (let b = 0; b < p; b++) {
        const cls = new Map<number, number>()
        let ok = true
        for (let i = 0; i < xs.length && ok; i++) {
          if (i === skip) continue
          const k = (a * Math.floor(i / size) + b * (i % size)) % p
          const seen = cls.get(k)
          if (seen === undefined) cls.set(k, xs[i])
          else if (seen !== xs[i]) ok = false
        }
        if (ok) return true
      }
  return false
}

/** True when some other tile could be the broken one under a different repeating rule. */
export function isAmbiguous(p: Pattern) {
  const feats = (['kind', 'rot'] as Attr[]).map((a) => p.tiles.map((t) => t[a]))
  return p.tiles.some((_, i) => i !== p.broken && feats.every((xs) => fitsExcept(xs, p.size, i)))
}

/** Tiles that differ between two boards of the same size (all of them when the sizes differ). */
export function tilesChanged(a: Pattern, b: Pattern) {
  if (a.size !== b.size) return a.tiles.length
  return a.tiles.filter((t, i) => t.kind !== b.tiles[i].kind || t.rot !== b.tiles[i].rot).length
}

/**
 * A pattern for a level, with the broken tile in quadrant `q` (spread evenly over a run by the caller).
 * Retries until no other tile could be read as the broken one, and until at least half the tiles differ from the
 * previous board `prev` (otherwise the break could be found by comparing the two boards).
 */
export function makePattern(level: number, q: number, prev?: Pattern, rand: Rand = Math.random): Pattern {
  const spec = levelSpec(level)
  for (;;) {
    const [d1a, d1b] = dir1D(rand)
    const rules: Rule[] = spec.rules.map(({ attr, p, dir }) => {
      const [a, b] =
        dir === '1d' ? [d1a, d1b] : dir === 'other1d' ? [d1b, d1a] : dir === 'diag' ? pick([[1, 1], [1, p - 1]], rand) : pick([[1, 2], [2, 1]], rand)
      return { attr, a, b, off: randInt(0, p - 1, rand), vals: attr === 'rot' ? rotVals(p, rand) : kindVals(p, rand) }
    })
    const fixedKind = randInt(0, 2, rand)
    const tiles: Tile[] = Array.from({ length: spec.size * spec.size }, (_, i) => {
      const r = Math.floor(i / spec.size), c = i % spec.size
      const rot = rules.find((x) => x.attr === 'rot')!
      const kind = rules.find((x) => x.attr === 'kind')
      return { rot: valueAt(rot, r, c), kind: kind ? valueAt(kind, r, c) : fixedKind }
    })
    const broken = pick(quadrantCells(spec.size, q), rand)
    // Break one changing feature: another value from its own cycle, so the tile itself looks like all the others.
    const rule = pick(rules, rand)
    tiles[broken] = { ...tiles[broken], [rule.attr]: pick(rule.vals.filter((v) => v !== tiles[broken][rule.attr]), rand) }
    const pattern = { level, size: spec.size, rules, tiles, broken }
    if (prev && tilesChanged(pattern, prev) * 2 < pattern.tiles.length) continue
    if (!isAmbiguous(pattern)) return pattern
  }
}

/** Quadrants for the broken tile over a run: each one equally often, shuffled in blocks of 4. */
export function quadrantBag(rand: Rand = Math.random) {
  let bag: number[] = []
  return () => {
    if (!bag.length) bag = shuffle([0, 1, 2, 3], rand)
    return bag.pop()!
  }
}
