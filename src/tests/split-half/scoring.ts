import { mean, round1, shuffle, type Rand } from '../../lib/random'
import type { ResultDetails } from '../types'
import { clipHalf, polygonArea, pointsFor, type Pt } from '../geometry/scoring'

/** Board is a 100 × 100 viewBox; the cut is a vertical line at x. */
export const ROUNDS = 5

export type ShapeKind = 'triangle' | 'familiar' | 'pointy' | 'bite' | 'spikes'
/** One round of each kind per run (in random order): a triangle, a familiar shape and three irregular ones. */
export const KINDS: ShapeKind[] = ['triangle', 'familiar', 'pointy', 'bite', 'spikes']
/** The line always starts here (the middle of the board). */
export const START_X = 50

const between = (rand: Rand, lo: number, hi: number) => lo + rand() * (hi - lo)
const intBetween = (rand: Rand, lo: number, hi: number) => Math.floor(between(rand, lo, hi + 1))
const P = (pts: [number, number][]): Pt[] => pts.map(([x, y]) => ({ x, y }))

/** A polygon from (angle, radius) corners around the middle, sorted by angle, so it never crosses itself. */
const polar = (corners: { a: number; r: number }[]): Pt[] =>
  [...corners].sort((p, q) => p.a - q.a).map(({ a, r }) => ({ x: Math.cos(a) * r, y: Math.sin(a) * r }))

/** n corners spread evenly around the middle (a little jitter), each at radius r(i). */
const evenCorners = (n: number, r: (i: number) => number, rand: Rand) => {
  const start = rand() * Math.PI * 2
  return Array.from({ length: n }, (_, i) => ({ a: start + ((i + between(rand, -0.25, 0.25)) / n) * Math.PI * 2, r: r(i) }))
}

/** Smallest corner angle of a triangle (degrees), to avoid needle-thin triangles. */
function minAngle(pts: Pt[]) {
  return Math.min(
    ...pts.map((p, i) => {
      const a = pts[(i + 2) % 3], b = pts[(i + 1) % 3]
      const u = { x: a.x - p.x, y: a.y - p.y }, v = { x: b.x - p.x, y: b.y - p.y }
      const cos = (u.x * v.x + u.y * v.y) / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y))
      return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI
    }),
  )
}

/**
 * Familiar shapes in a unit box (y down), with random proportions. `turn`: may be turned by quarter
 * turns and still be recognisable (letters, arrow); the key only lies (standing, its cut is right in the middle); the others stay upright.
 */
/** `turn`: 'quarter' = any quarter turn; 'half' = upside down or not (stays lying, like the key); 'none' = upright. */
type Familiar = { name: string; turn: 'quarter' | 'half' | 'none'; make: (rand: Rand) => Pt[] }
const FAMILIAR: Familiar[] = [
  { name: 'L', turn: 'quarter', make: (rand) => {
    const a = between(rand, 0.25, 0.45), b = between(rand, 0.25, 0.45)
    return P([[0, 0], [a, 0], [a, 1 - b], [1, 1 - b], [1, 1], [0, 1]])
  } },
  { name: 'T', turn: 'quarter', make: (rand) => {
    const a = between(rand, 0.2, 0.4), b = between(rand, 0.2, 0.4), c = between(rand, 0.15, 0.85 - a)
    return P([[0, 0], [1, 0], [1, b], [c + a, b], [c + a, 1], [c, 1], [c, b], [0, b]])
  } },
  { name: 'U', turn: 'quarter', make: (rand) => {
    const a = between(rand, 0.2, 0.4), a2 = between(rand, 0.2, 0.4), d = between(rand, 0.5, 0.8), top = between(rand, 0, 0.4) * d
    return P([[0, 0], [a, 0], [a, d], [1 - a2, d], [1 - a2, top], [1, top], [1, 1], [0, 1]])
  } },
  { name: 'Arrow', turn: 'quarter', make: (rand) => {
    const sw = between(rand, 0.08, 0.18), hw = between(rand, 0.3, 0.5), hl = between(rand, 0.25, 0.45)
    return P([[0, 0.5 - sw], [1 - hl, 0.5 - sw], [1 - hl, 0.5 - hw], [1, 0.5], [1 - hl, 0.5 + hw], [1 - hl, 0.5 + sw], [0, 0.5 + sw]])
  } },
  { name: 'Boot', turn: 'none', make: (rand) => {
    const leg = between(rand, 0.3, 0.5), ankle = between(rand, 0.45, 0.65)
    return P([[0, 0], [leg, 0], [leg, ankle], [0.85, ankle + 0.08], [1, 0.85], [1, 1], [0, 1]])
  } },
  { name: 'Key', turn: 'half', make: (rand) => {
    // a cut-corner head on the left, a shaft, two teeth hanging down near the end
    const hw = between(rand, 0.28, 0.38), h = between(rand, 0.22, 0.32), c = h * 0.4
    const sh = between(rand, 0.05, 0.09), t = between(rand, 0.12, 0.2)
    const t1 = between(rand, 0.6, 0.7), t2 = between(rand, 0.8, 0.86)
    return P([
      [c, 0.5 - h], [hw - c, 0.5 - h], [hw, 0.5 - h + c], [hw, 0.5 - sh], [1, 0.5 - sh], [1, 0.5 + sh + t],
      [t2, 0.5 + sh + t], [t2, 0.5 + sh], [t1 + 0.08, 0.5 + sh], [t1 + 0.08, 0.5 + sh + t * 0.7], [t1, 0.5 + sh + t * 0.7],
      [t1, 0.5 + sh], [hw, 0.5 + sh], [hw, 0.5 + h - c], [hw - c, 0.5 + h], [c, 0.5 + h], [0, 0.5 + h - c], [0, 0.5 - h + c],
    ])
  } },
  { name: 'Fish', turn: 'none', make: (rand) => {
    // a pointed body with a forked tail
    const bh = between(rand, 0.25, 0.4), tw = between(rand, 0.25, 0.4), neck = between(rand, 0.62, 0.72), fork = between(rand, 0.86, 0.94)
    return P([
      [0, 0.5], [0.25, 0.5 - bh], [0.5, 0.5 - bh * 0.75], [neck, 0.46], [1, 0.5 - tw], [fork, 0.5],
      [1, 0.5 + tw], [neck, 0.54], [0.5, 0.5 + bh * 0.75], [0.25, 0.5 + bh],
    ])
  } },
]
export const FAMILIAR_NAMES = FAMILIAR.map((f) => f.name)

/** A familiar shape, stretched 0.7–1.4× in each direction, mirrored, and turned as its `turn` allows. */
export const pickFamiliar = (rand: Rand) => FAMILIAR[Math.floor(rand() * FAMILIAR.length)]
export function familiar(rand: Rand, which: Familiar = pickFamiliar(rand)): Pt[] {
  const sx = between(rand, 0.7, 1.4), sy = between(rand, 0.7, 1.4)
  const flip = rand() < 0.5
  const turns = which.turn === 'quarter' ? intBetween(rand, 0, 3) : which.turn === 'half' ? 2 * intBetween(rand, 0, 1) : 0
  return which.make(rand).map(({ x, y }) => {
    let p = { x: (flip ? -x : x) * sx, y: y * sy }
    for (let i = 0; i < turns; i++) p = { x: -p.y, y: p.x }
    return p
  })
}

/**
 * Pointy: 5–14 corners at uneven angles around the middle, each a spike far out or a notch deep in, never
 * two notches in a row: sharp corners and edges of very different lengths, never a round, even outline.
 */
function pointy(rand: Rand): Pt[] {
  const n = intBetween(rand, 5, 14)
  // uneven gaps; none over 40 % of a full turn (over half a turn, an edge could cross another one)
  let gaps: number[], total: number
  do {
    gaps = Array.from({ length: n }, () => 0.08 + rand() ** 3 * 2)
    total = gaps.reduce((a, b) => a + b, 0)
  } while (Math.max(...gaps) > 0.4 * total)
  let a = rand() * Math.PI * 2, notchBefore = false
  return polar(gaps.map((g) => {
    const notch = !notchBefore && rand() < 0.65
    notchBefore = notch
    const corner = { a, r: notch ? between(rand, 0.12, 0.45) : between(rand, 0.6, 1) }
    a += (g / total) * Math.PI * 2
    return corner
  }))
}

/** Bite: a chunky, fairly round body with a big bite taken out of one side (2–4 corners pulled deep in). */
function bite(rand: Rand): Pt[] {
  const n = intBetween(rand, 11, 14)
  const from = intBetween(rand, 0, n - 1), len = intBetween(rand, 2, 4)
  const inBite = (i: number) => (i - from + n) % n < len
  return polar(evenCorners(n, (i) => (inBite(i) ? between(rand, 0.12, 0.4) : between(rand, 0.8, 1)), rand))
}

/** Spikes: a chunky body with 1–3 long, thin spikes on one side, which make it look wider than its area is. */
function spikes(rand: Rand): Pt[] {
  const body = evenCorners(intBetween(rand, 7, 9), () => between(rand, 0.45, 0.6), rand)
  const count = intBetween(rand, 1, 3), side = rand() * Math.PI * 2
  const tips: number[] = []
  while (tips.length < count) {
    const a = side + between(rand, -1.1, 1.1) // within about 125° of one direction
    if (tips.every((t) => Math.abs(t - a) > 0.45)) tips.push(a)
  }
  const corners = body.filter((c) => tips.every((t) => Math.abs(Math.atan2(Math.sin(c.a - t), Math.cos(c.a - t))) > 0.15))
  for (const t of tips) {
    const w = between(rand, 0.04, 0.08), base = between(rand, 0.4, 0.5)
    corners.push({ a: t - w, r: base }, { a: t, r: between(rand, 1.2, 1.6) }, { a: t + w, r: base })
  }
  // angles to one turn around, so sorting keeps the outline in order
  return polar(corners.map((c) => ({ ...c, a: ((c.a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) })))
}

/** A raw shape of this kind (any size and position; `scale` and `makeRound` fit it on the board). */
export function rawShape(kind: ShapeKind, rand: Rand, which?: Familiar): Pt[] {
  switch (kind) {
    case 'triangle':
      for (;;) {
        const pts = Array.from({ length: 3 }, () => ({ x: rand(), y: rand() }))
        if (minAngle(pts) >= 18 && polygonArea(pts) > 0.12) return pts
      }
    case 'familiar':
      return familiar(rand, which)
    case 'pointy':
      return pointy(rand)
    case 'bite':
      return bite(rand)
    case 'spikes':
      return spikes(rand)
  }
}

const bounds = (pts: Pt[]) => {
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y)
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }
}

/** Scales the shape to 55–80 units across (its longer side), at a random height, left edge at x = 0. */
export function scale(pts: Pt[], rand: Rand): Pt[] {
  const b = bounds(pts)
  const k = between(rand, 55, 80) / Math.max(b.maxX - b.minX, b.maxY - b.minY)
  const h = (b.maxY - b.minY) * k
  const oy = between(rand, 8, 92 - h)
  return pts.map((p) => ({ x: (p.x - b.minX) * k, y: oy + (p.y - b.minY) * k }))
}
const shiftX = (pts: Pt[], dx: number) => pts.map((p) => ({ x: p.x + dx, y: p.y }))

/** Share of the area right of the vertical line at x. */
export const rightShare = (pts: Pt[], x: number) => polygonArea(clipHalf(pts, { x: 0, y: 0 }, { x: 1, y: 0 }, x)) / polygonArea(pts)
/** The part of the shape left / right of the line at x (for drawing the result). */
export const leftPart = (pts: Pt[], x: number) => clipHalf(pts, { x: 0, y: 0 }, { x: -1, y: 0 }, -x)
export const rightPart = (pts: Pt[], x: number) => clipHalf(pts, { x: 0, y: 0 }, { x: 1, y: 0 }, x)

/** x of the vertical line that splits the area exactly in half (binary search). */
export function halvingX(pts: Pt[]) {
  const b = bounds(pts)
  let lo = b.minX, hi = b.maxX
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2
    if (rightShare(pts, mid) > 0.5) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export interface Round {
  kind: ShapeKind
  pts: Pt[]
  /** Correct cut. */
  half: number
}

/**
 * One round of a kind. The line starts in the middle of the board (START_X); the shape is shifted so the
 * correct cut is 6–20 units to the left or right of it. The answer is also never the middle of the shape's
 * width (≥ 2.5 units off), so "cut in the middle of the box" isn't a shortcut.
 */
export function makeRound(kind: ShapeKind, rand: Rand = Math.random): Round {
  // A familiar shape is picked once: a retry only changes its proportions and turn, so shapes that often
  // land near the middle (lightning, tree) aren't quietly replaced by ones that never do (L, boot).
  const which = kind === 'familiar' ? pickFamiliar(rand) : undefined
  for (let tries = 0; ; tries++) {
    const raw = scale(rawShape(kind, rand, which), rand)
    const b = bounds(raw)
    if (polygonArea(raw) < 600 && tries < 60) continue // too thin to judge
    const rawHalf = halvingX(raw)
    if (Math.abs(rawHalf - (b.minX + b.maxX) / 2) < 2.5 && tries < 60) continue
    // Shift the shape so the answer lands 6–20 units left or right of the start line, keeping the
    // shape on the board (x 8–92). Only sides that can be reached are used; none → draw a new shape.
    const lo = rawHalf + 8 - b.minX, hi = rawHalf + 92 - b.maxX // where the answer can go
    const sides = [[START_X - 20, START_X - 6], [START_X + 6, START_X + 20]]
      .map(([a, z]) => [Math.max(a, lo), Math.min(z, hi)])
      .filter(([a, z]) => a <= z)
    if (!sides.length) continue
    const [a, z] = sides[Math.floor(rand() * sides.length)]
    const pts = shiftX(raw, between(rand, a, z) - rawHalf)
    return { kind, pts, half: halvingX(pts) }
  }
}

export const makeRounds = (rand: Rand = Math.random) => shuffle(KINDS, rand).map((k) => makeRound(k, rand))

/** Points for a cut: 100 for a perfect 50 / 50, down to 0 at 30 / 70. */
export function evaluate(round: Round, x: number) {
  const right = rightShare(round.pts, x)
  const left = 1 - right
  return { points: pointsFor(Math.abs(right - 0.5), 0.2), left, right }
}

export const totalScore = (points: number[]) => round1(mean(points))

export function resultDetails(results: { kind: ShapeKind; points: number; left: number }[]): ResultDetails {
  const off = results.map((r) => Math.abs(r.left - 0.5) * 100)
  return {
    stats: [
      { label: 'Closest cut', value: `${(50 + Math.min(...off)).toFixed(1)} / ${(50 - Math.min(...off)).toFixed(1)}` },
      { label: 'Furthest off', value: `${(50 + Math.max(...off)).toFixed(1)} / ${(50 - Math.max(...off)).toFixed(1)}` },
    ],
    chips: {
      title: 'Points per shape',
      items: results.map((r) => ({ label: r.kind[0].toUpperCase() + r.kind.slice(1), value: `${r.points} pts` })),
    },
  }
}
