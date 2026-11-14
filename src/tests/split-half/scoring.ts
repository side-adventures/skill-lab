import { mean, round1, shuffle, type Rand } from '../../lib/random'
import type { ResultDetails } from '../types'
import { clipHalf, polygonArea, pointsFor, type Pt } from '../geometry/scoring'

/** Board is a 100 × 100 viewBox; the cut is a vertical line at x. */
export const ROUNDS = 5

export type ShapeKind = 'triangle' | 'four corners' | 'blocks' | 'star' | 'jagged'
/** One round of each kind per run, so every run gets the same mix of simple and complex shapes. */
export const KINDS: ShapeKind[] = ['triangle', 'four corners', 'blocks', 'star', 'jagged']

const between = (rand: Rand, lo: number, hi: number) => lo + rand() * (hi - lo)
const intBetween = (rand: Rand, lo: number, hi: number) => Math.floor(between(rand, lo, hi + 1))

/** Points at sorted angles around the origin, so the polygon never crosses itself. */
function aroundCenter(n: number, radius: (i: number) => number, rand: Rand, jitter = 0.35): Pt[] {
  const start = rand() * Math.PI * 2
  return Array.from({ length: n }, (_, i) => {
    const a = start + ((i + between(rand, -jitter, jitter)) / n) * Math.PI * 2
    const r = radius(i)
    return { x: Math.cos(a) * r, y: Math.sin(a) * r }
  })
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

/** Straight-edged blocky shapes (L, T, U, steps), each with random proportions. */
function blocks(rand: Rand): Pt[] {
  const w = 1, h = between(rand, 0.7, 1.2)
  const a = between(rand, 0.25, 0.45), b = between(rand, 0.25, 0.45)
  const P = (pts: [number, number][]) => pts.map(([x, y]) => ({ x, y }))
  switch (intBetween(rand, 0, 3)) {
    case 0: // L
      return P([[0, 0], [a, 0], [a, h - b * h], [w, h - b * h], [w, h], [0, h]])
    case 1: { // T with the stem off-centre
      const c = between(rand, 0.1, w - a - 0.1)
      return P([[0, 0], [w, 0], [w, b * h], [c + a, b * h], [c + a, h], [c, h], [c, b * h], [0, b * h]])
    }
    case 2: { // U with arms of different widths and heights
      const a2 = between(rand, 0.2, 0.4), d = between(rand, 0.3, 0.7) * h, top = between(rand, 0, 0.6) * d
      return P([[0, 0], [a, 0], [a, d], [w - a2, d], [w - a2, top], [w, top], [w, h], [0, h]])
    }
    default: { // 3 steps of random sizes
      const x1 = between(rand, 0.2, 0.4), x2 = between(rand, 0.5, 0.75)
      const y1 = between(rand, 0.15, 0.35) * h, y2 = between(rand, 0.45, 0.7) * h
      return P([[0, 0], [x1, 0], [x1, y1], [x2, y1], [x2, y2], [w, y2], [w, h], [0, h]])
    }
  }
}

/** A raw shape of this kind (any size and position; `place` fits it on the board). */
export function rawShape(kind: ShapeKind, rand: Rand): Pt[] {
  switch (kind) {
    case 'triangle':
      for (;;) {
        const pts = Array.from({ length: 3 }, () => ({ x: rand(), y: rand() }))
        if (minAngle(pts) >= 18 && polygonArea(pts) > 0.12) return pts
      }
    case 'four corners':
      return aroundCenter(4, () => between(rand, 0.55, 1), rand, 0.3)
    case 'blocks': {
      const pts = blocks(rand)
      // mirror and turn by a quarter, so the open side and the long arm point anywhere
      const flip = rand() < 0.5, turn = intBetween(rand, 0, 3)
      return pts.map(({ x, y }) => {
        let p = { x: flip ? -x : x, y }
        for (let i = 0; i < turn; i++) p = { x: -p.y, y: p.x }
        return p
      })
    }
    case 'star': {
      const spikes = intBetween(rand, 4, 7)
      const inner = between(rand, 0.3, 0.55)
      return aroundCenter(spikes * 2, (i) => (i % 2 ? inner * between(rand, 0.8, 1.2) : between(rand, 0.65, 1)), rand, 0.25)
    }
    case 'jagged':
      return aroundCenter(intBetween(rand, 7, 11), () => between(rand, 0.3, 1), rand, 0.3)
  }
}

const bounds = (pts: Pt[]) => {
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y)
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }
}

/** Scales the shape to 55–80 units across (its longer side) and puts it at a random spot on the board. */
export function place(pts: Pt[], rand: Rand): Pt[] {
  const b = bounds(pts)
  const k = between(rand, 55, 80) / Math.max(b.maxX - b.minX, b.maxY - b.minY)
  const w = (b.maxX - b.minX) * k, h = (b.maxY - b.minY) * k
  const ox = between(rand, 8, 92 - w), oy = between(rand, 8, 92 - h)
  return pts.map((p) => ({ x: ox + (p.x - b.minX) * k, y: oy + (p.y - b.minY) * k }))
}

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
  /** Where the line starts: clearly off the answer. */
  start: number
}

/**
 * One round of a kind. The answer is never the middle of the shape's width (≥ 2.5 units off), so
 * "cut in the middle of the box" isn't a shortcut, and the line starts 10–18 units off the answer.
 */
export function makeRound(kind: ShapeKind, rand: Rand = Math.random): Round {
  for (let tries = 0; ; tries++) {
    const pts = place(rawShape(kind, rand), rand)
    const half = halvingX(pts)
    const b = bounds(pts)
    if (Math.abs(half - (b.minX + b.maxX) / 2) < 2.5 && tries < 60) continue
    let start = half + (rand() < 0.5 ? -1 : 1) * between(rand, 10, 18)
    if (start < 4 || start > 96) start = half * 2 - start // other side if it would leave the board
    return { kind, pts, half, start }
  }
}

export const makeRounds = (rand: Rand = Math.random) => shuffle(KINDS, rand).map((k) => makeRound(k, rand))

/** Accuracy of a cut: 100 % for a perfect 50 / 50, down to 0 at 40 / 60 (same as Eye for Geometry's split). */
export function evaluate(round: Round, x: number) {
  const right = rightShare(round.pts, x)
  const left = 1 - right
  return { points: pointsFor(Math.abs(right - 0.5), 0.1), left, right }
}

export const totalScore = (points: number[]) => round1(mean(points))

export function resultDetails(results: { kind: ShapeKind; points: number; left: number }[]): ResultDetails {
  const off = results.map((r) => Math.abs(r.left - 0.5) * 100)
  return {
    stats: [
      { label: 'Closest cut', value: `${Math.min(...off).toFixed(1)} % off` },
      { label: 'Furthest off', value: `${Math.max(...off).toFixed(1)} % off` },
    ],
    chips: {
      title: 'Accuracy per shape',
      items: results.map((r) => ({ label: r.kind[0].toUpperCase() + r.kind.slice(1), value: `${r.points} %` })),
    },
  }
}
