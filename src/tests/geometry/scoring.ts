import type { ResultDetails } from '../types'
import { mean, round1, shuffle, type Rand } from '../../lib/random'

/** Board is a 100 × 100 viewBox. Angles are in degrees, counter-clockwise on screen. */
export interface Pt { x: number; y: number }

export type Shape =
  | { t: 'seg'; a: Pt; b: Pt }
  | { t: 'circle'; c: Pt; r: number }
  | { t: 'dot'; p: Pt }
  | { t: 'poly'; pts: Pt[] }
  | { t: 'ray'; from: Pt; angle: number; len: number }
  | { t: 'line'; through: Pt; angle: number } // infinite line (clipped by the board)
  | { t: 'arc'; c: Pt; r: number; from: number; span: number } // marks an angle: from `from`, CCW by `span`

export type Input = 'point' | 'ray' | 'length' | 'offset' | 'number'

export interface Answer { point?: Pt; angle?: number; length?: number; offset?: number; number?: number }

export interface Evaluation { points: number; label: string; solution: Shape[] }

export interface Task {
  kind: string
  title: string
  prompt: string
  input: Input
  shapes: Shape[]
  /** ray input rotates around this point; length input starts here */
  pivot?: Pt
  /** length of the ray input's arm (default 42) */
  armLen?: number
  /** ray input can only point inside this angle (CCW from `from` by `span`) */
  range?: { from: number; span: number }
  /** length input direction; offset input normal (unit vectors) */
  dir?: Pt
  /** starting value shown before the player moves anything */
  initial?: Answer
  evaluate: (a: Answer) => Evaluation
}

// ---------- helpers ----------
const rad = (d: number) => (d * Math.PI) / 180
export const dirOf = (deg: number): Pt => ({ x: Math.cos(rad(deg)), y: -Math.sin(rad(deg)) })
export const add = (p: Pt, v: Pt, k = 1): Pt => ({ x: p.x + v.x * k, y: p.y + v.y * k })
export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)
/** Direction (deg, CCW on screen) from a to b. */
export const angleTo = (a: Pt, b: Pt) => (Math.atan2(-(b.y - a.y), b.x - a.x) * 180) / Math.PI
/** Smallest absolute difference between two directions (deg), with given period. */
export const angleDiff = (a: number, b: number, period = 360) => {
  const d = (((a - b) % period) + period) % period
  return Math.min(d, period - d)
}
const between = (rand: Rand, lo: number, hi: number) => lo + rand() * (hi - lo)
const norm360 = (a: number) => ((a % 360) + 360) % 360

/** Keeps a direction inside an angle (CCW from `from` by `span`), snapping to the nearer arm. */
export function clampToRange(angle: number, { from, span }: { from: number; span: number }) {
  const rel = norm360(angle - from)
  if (rel <= span) return from + rel
  return rel - span < 360 - rel ? from + span : from
}

/** 100 (%) for a perfect answer, falling linearly to 0 at `tolerance` error. */
export const pointsFor = (error: number, tolerance: number) => Math.round(100 * Math.max(0, 1 - error / tolerance))

const pct = (e: number) => `${(e * 100).toFixed(1)} % off`
const deg = (e: number) => `${e.toFixed(1)}° off`

// ---------- polygon area (used by Split in Half) ----------
export const polygonArea = (pts: Pt[]) =>
  Math.abs(pts.reduce((s, p, i) => {
    const q = pts[(i + 1) % pts.length]
    return s + p.x * q.y - q.x * p.y
  }, 0)) / 2

/** Part of the polygon on the side where (p − origin)·n ≥ offset (Sutherland–Hodgman, one plane). */
export function clipHalf(pts: Pt[], origin: Pt, n: Pt, offset: number): Pt[] {
  const side = (p: Pt) => (p.x - origin.x) * n.x + (p.y - origin.y) * n.y - offset
  const out: Pt[] = []
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length]
    const sp = side(p), sq = side(q)
    if (sp >= 0) out.push(p)
    if (sp >= 0 !== sq >= 0) {
      const t = sp / (sp - sq)
      out.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t })
    }
  })
  return out
}

export function middleOfLine(rand: Rand): Task {
  const len = between(rand, 55, 85), ang = between(rand, 0, 180)
  const mid = { x: between(rand, 45, 55), y: between(rand, 45, 55) }
  const a = add(mid, dirOf(ang), -len / 2), b = add(mid, dirOf(ang), len / 2)
  return {
    kind: 'middle', title: 'Middle of the line', prompt: 'Place the point exactly in the middle of the line.', input: 'point',
    shapes: [{ t: 'seg', a, b }],
    evaluate: ({ point }) => {
      const e = dist(point!, mid) / len
      return { points: pointsFor(e, 0.08), label: pct(e), solution: [{ t: 'dot', p: mid }] }
    },
  }
}

export function centerOfCircle(rand: Rand): Task {
  const r = between(rand, 18, 34), c = { x: between(rand, 38, 62), y: between(rand, 38, 62) }
  return {
    kind: 'center', title: 'Center of the circle', prompt: 'Place the point at the exact center of the circle.', input: 'point',
    shapes: [{ t: 'circle', c, r }],
    evaluate: ({ point }) => {
      const e = dist(point!, c) / r
      return { points: pointsFor(e, 0.25), label: pct(e), solution: [{ t: 'dot', p: c }] }
    },
  }
}

export function setAngle(rand: Rand): Task {
  const base = between(rand, 0, 360), target = Math.round(between(rand, 15, 165))
  return {
    kind: 'set-angle', title: `Make ${target}°`, prompt: `Rotate the arm to make a ${target}° angle with the fixed line.`, input: 'ray',
    shapes: [{ t: 'ray', from: C, angle: base, len: 42 }], pivot: C, initial: { angle: base },
    evaluate: ({ angle }) => {
      const made = angleDiff(angle!, base)
      const e = Math.abs(made - target)
      const right = angleDiff(angle!, base + target) < angleDiff(angle!, base - target) ? base + target : base - target
      return { points: pointsFor(e, 25), label: `${made.toFixed(1)}° made · ${deg(e)}`, solution: [{ t: 'ray', from: C, angle: right, len: 42 }] }
    },
  }
}

export function guessAngle(rand: Rand): Task {
  const base = between(rand, 0, 360), target = Math.round(between(rand, 10, 170))
  return {
    kind: 'guess-angle', title: 'Name the angle', prompt: 'How many degrees is the marked angle? Type your guess.', input: 'number',
    shapes: [
      { t: 'arc', c: C, r: 10, from: base, span: target },
      { t: 'ray', from: C, angle: base, len: 42 },
      { t: 'ray', from: C, angle: base + target, len: 42 },
    ],
    evaluate: ({ number }) => {
      const e = Math.abs(number! - target)
      return { points: pointsFor(e, 25), label: `It was ${target}° · ${deg(e)}`, solution: [] }
    },
  }
}

export function bisectAngle(rand: Rand): Task {
  const base = between(rand, 0, 360), spread = between(rand, 45, 160), bis = base + spread / 2
  return {
    kind: 'bisect', title: 'Half the angle', prompt: 'Rotate the arm so it splits the marked angle into two equal halves.', input: 'ray',
    shapes: [
      { t: 'arc', c: C, r: 10, from: base, span: spread },
      { t: 'ray', from: C, angle: base, len: 42 },
      { t: 'ray', from: C, angle: base + spread, len: 42 },
    ],
    // The arm stays inside the angle and starts close to one of its sides.
    pivot: C, range: { from: base, span: spread },
    initial: { angle: rand() < 0.5 ? base + spread * 0.08 : base + spread * 0.92 },
    evaluate: ({ angle }) => {
      const e = angleDiff(angle!, bis)
      return { points: pointsFor(e, 15), label: deg(e), solution: [{ t: 'ray', from: C, angle: bis, len: 42 }] }
    },
  }
}

export function makeParallel(rand: Rand): Task {
  const L = between(rand, 24, 30), refAng = between(rand, 0, 180)
  // Reference line in one top corner, the movable one starts in the opposite bottom corner.
  const left = rand() < 0.5
  const refMid = { x: left ? between(rand, 28, 36) : between(rand, 64, 72), y: between(rand, 26, 34) }
  const a = add(refMid, dirOf(refAng), -L / 2), b = add(refMid, dirOf(refAng), L / 2)
  const pivot = { x: left ? between(rand, 58, 66) : between(rand, 34, 42), y: between(rand, 62, 68) }
  const start = refAng + (rand() < 0.5 ? -1 : 1) * between(rand, 30, 70)
  return {
    kind: 'parallel', title: 'Make it parallel', prompt: 'Rotate the lower line until it is exactly parallel to the upper one.', input: 'ray',
    shapes: [{ t: 'seg', a, b }], pivot, armLen: L, initial: { angle: start },
    evaluate: ({ angle }) => {
      const e = angleDiff(angle!, refAng, 180) // either direction counts
      const right = angleDiff(angle!, refAng) <= 90 ? refAng : refAng + 180
      return { points: pointsFor(e, 10), label: deg(e), solution: [{ t: 'ray', from: pivot, angle: right, len: L }] }
    },
  }
}

export function completeSquare(rand: Rand): Task {
  const side = between(rand, 32, 42), rot = between(rand, 0, 90)
  const u = dirOf(rot), v = dirOf(rot + 90)
  const center = { x: between(rand, 46, 54), y: between(rand, 46, 54) }
  const corner = (i: number, j: number) => add(add(center, u, (i - 0.5) * side), v, (j - 0.5) * side)
  const [a, b, c, d] = [corner(0, 0), corner(1, 0), corner(1, 1), corner(0, 1)]
  return {
    kind: 'square', title: 'Complete the square', prompt: 'Place the missing fourth corner of the square.', input: 'point',
    shapes: [{ t: 'seg', a, b }, { t: 'seg', a: b, b: c }, { t: 'dot', p: a }, { t: 'dot', p: b }, { t: 'dot', p: c }],
    evaluate: ({ point }) => {
      const e = dist(point!, d) / side
      return { points: pointsFor(e, 0.25), label: pct(e), solution: [{ t: 'seg', a: c, b: d }, { t: 'seg', a: d, b: a }, { t: 'dot', p: d }] }
    },
  }
}

export function copyLength(rand: Rand): Task {
  const L = between(rand, 22, 42)
  const refAng = between(rand, 35, 145), refMid = { x: 50, y: 27 }
  const a = add(refMid, dirOf(refAng), -L / 2), b = add(refMid, dirOf(refAng), L / 2)
  const origin = { x: 14, y: between(rand, 66, 80) }, dirAng = between(rand, -15, 20), dir = dirOf(dirAng)
  return {
    kind: 'copy-length', title: 'Copy the length', prompt: 'Drag the lower line so it is exactly as long as the upper one.', input: 'length',
    shapes: [{ t: 'seg', a, b }, { t: 'dot', p: origin }], pivot: origin, dir, initial: { length: 8 },
    evaluate: ({ length }) => {
      const e = Math.abs(length! - L) / L
      return { points: pointsFor(e, 0.25), label: `${length! < L ? 'short' : 'long'} by ${(e * 100).toFixed(1)} %`, solution: [{ t: 'seg', a: origin, b: add(origin, dir, L) }] }
    },
  }
}

export function equalDistance(rand: Rand): Task {
  for (;;) {
    const g1 = between(rand, 80, 160), g2 = between(rand, 80, 160), g3 = 360 - g1 - g2
    if (g3 < 80 || g3 > 160) continue // keep the triangle acute so the answer is inside it
    const R = between(rand, 24, 34), c = { x: between(rand, 42, 58), y: between(rand, 42, 58) }, a0 = between(rand, 0, 360)
    const pts = [a0, a0 + g1, a0 + g1 + g2].map((a) => add(c, dirOf(a), R))
    if (pts.some((p) => p.x < 6 || p.x > 94 || p.y < 6 || p.y > 94)) continue
    return {
      kind: 'equidistant', title: 'Equal distance', prompt: 'Place the point so it is equally far from all three dots.', input: 'point',
      shapes: pts.map((p) => ({ t: 'dot', p }) as Shape),
      evaluate: ({ point }) => {
        const e = dist(point!, c) / R
        return { points: pointsFor(e, 0.3), label: pct(e), solution: [{ t: 'dot', p: c }, { t: 'circle', c, r: R }] }
      },
    }
  }
}

export const TASK_MAKERS = [
  middleOfLine, centerOfCircle, setAngle, guessAngle, bisectAngle,
  makeParallel, completeSquare, copyLength, equalDistance,
]

/** One round of every task type, in random order. */
export const makeTasks = (rand: Rand = Math.random) => shuffle(TASK_MAKERS, rand).map((make) => make(rand))

export const totalScore = (points: number[]) => round1(mean(points))

/** Short task names for the result chips (all tasks must fit in two rows). */
const SHORT: Record<string, string> = {
  middle: 'Middle', center: 'Center', 'guess-angle': 'Name angle', bisect: 'Half angle', parallel: 'Parallel',
  square: 'Square', 'copy-length': 'Length', equidistant: 'Equal dist.',
}
const shortName = (t: Task) => SHORT[t.kind] ?? t.title

/** Result screen stats: best and weakest task, and the accuracy of each task (in %, like the score). */
export function resultDetails(results: { task: Task; ev: Evaluation }[]): ResultDetails {
  const byPoints = [...results].sort((a, b) => b.ev.points - a.ev.points)
  const best = byPoints[0], worst = byPoints[byPoints.length - 1]
  return {
    stats: [
      { label: 'Best task', value: `${best.task.title} · ${best.ev.points} %` },
      { label: 'Weakest task', value: `${worst.task.title} · ${worst.ev.points} %` },
    ],
    chips: { title: 'Accuracy per task', items: results.map((r) => ({ label: shortName(r.task), value: `${r.ev.points} %` })) },
  }
}
