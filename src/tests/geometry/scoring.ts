import type { ResultDetails } from '../types'
import { mean, randInt, round1, shuffle, type Rand } from '../../lib/random'

/** Board is a 100 × 100 viewBox. Angles are in degrees, counter-clockwise on screen. */
export interface Pt { x: number; y: number }

export type Shape =
  | { t: 'seg'; a: Pt; b: Pt }
  | { t: 'circle'; c: Pt; r: number }
  | { t: 'dot'; p: Pt }
  | { t: 'poly'; pts: Pt[] }
  | { t: 'polyline'; pts: Pt[] } // open path (the zigzag line)
  | { t: 'arcline'; c: Pt; r: number; from: number; span: number } // part of a circle's outline: from `from`, CCW by `span`
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
  /** length input: the smallest and largest length the handle allows */
  lengthRange?: [number, number]
  /** draws the current answer when a plain dot / arm / segment isn't enough (Match the size: the resized shape) */
  drawAnswer?: (a: Answer) => Shape[]
  /** point input: moves the clicked point, e.g. onto the line (Middle of the line) */
  snap?: (p: Pt) => Pt
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

// ---------- the tasks ----------
const C: Pt = { x: 50, y: 50 }

/** True if segments ab and cd cross (touching at a shared end doesn't count). */
function segmentsCross(a: Pt, b: Pt, c: Pt, d: Pt) {
  const o = (p: Pt, q: Pt, r: Pt) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x))
  return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0
}
const onBoard = (p: Pt, m = 8) => p.x >= m && p.x <= 100 - m && p.y >= m && p.y <= 100 - m

/** The point halfway along a path (by length). */
export function pathMiddle(pts: Pt[]) {
  const lens = pts.slice(1).map((p, i) => dist(pts[i], p))
  const total = lens.reduce((x, y) => x + y, 0)
  let left = total / 2
  for (let i = 0; i < lens.length; i++) {
    if (left <= lens[i]) return { mid: add(pts[i], { x: pts[i + 1].x - pts[i].x, y: pts[i + 1].y - pts[i].y }, left / lens[i]), total }
    left -= lens[i]
  }
  return { mid: pts[pts.length - 1], total }
}

/** The point on a path closest to p, how far along the path it is, and the direction of that section (deg). */
export function closestOnPath(pts: Pt[], p: Pt) {
  let best = { point: pts[0], along: 0, angle: angleTo(pts[0], pts[1]), d: Infinity }
  let walked = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], len = dist(a, b)
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / (len * len)))
    const q = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
    const d = dist(p, q)
    if (d < best.d) best = { point: q, along: walked + t * len, angle: angleTo(a, b), d }
    walked += len
  }
  return best
}

/** A short bar across the line at a point of it (the answer and solution marker of Middle of the line). */
const barAcross = (pts: Pt[], p: Pt): Shape => {
  const { point, angle } = closestOnPath(pts, p)
  const n = dirOf(angle + 90)
  return { t: 'seg', a: add(point, n, -3), b: add(point, n, 3) }
}

/**
 * Middle of a zigzag line: 3–5 sections (2–4 bends) of very different lengths (the longest at least 2.5× the
 * shortest), centered on the board. The point snaps onto the line; it's scored by how far along the line it is.
 */
export function middleOfLine(rand: Rand): Task {
  for (;;) {
    const segments = randInt(3, 5, rand)
    const lens = Array.from({ length: segments }, () => between(rand, 7, 40))
    if (Math.max(...lens) < 2.5 * Math.min(...lens)) continue
    let p = { x: 0, y: 0 }, ang = between(rand, 0, 360)
    let pts = [p]
    lens.forEach((len, i) => {
      if (i > 0) ang += (rand() < 0.5 ? -1 : 1) * between(rand, 35, 120)
      p = add(p, dirOf(ang), len)
      pts.push(p)
    })
    // center the whole line on the board
    const xs = pts.map((q) => q.x), ys = pts.map((q) => q.y)
    const dx = 50 - (Math.min(...xs) + Math.max(...xs)) / 2, dy = 50 - (Math.min(...ys) + Math.max(...ys)) / 2
    pts = pts.map((q) => ({ x: q.x + dx, y: q.y + dy }))
    if (!pts.every((q) => onBoard(q))) continue
    const crosses = pts.slice(1).some((q, i) => pts.slice(1).some((r, j) => j > i + 1 && segmentsCross(pts[i], q, pts[j], r)))
    if (crosses) continue
    const { mid, total } = pathMiddle(pts)
    if (total < 60) continue
    return {
      kind: 'middle', title: 'Middle of the line', prompt: 'Place the mark halfway along the line, measured along its bends.', input: 'point',
      shapes: [{ t: 'polyline', pts }],
      snap: (q) => closestOnPath(pts, q).point,
      drawAnswer: ({ point }) => (point ? [barAcross(pts, point)] : []),
      evaluate: ({ point }) => {
        const e = Math.abs(closestOnPath(pts, point!).along - total / 2) / total
        return { points: pointsFor(e, 0.08), label: pct(e), solution: [barAcross(pts, mid), { t: 'dot', p: mid }] }
      },
    }
  }
}

/** Center of a circle of which only an arc (90–180°) is shown. */
export function centerOfCircle(rand: Rand): Task {
  const r = between(rand, 24, 40), span = between(rand, 90, 180), from = between(rand, 0, 360)
  // the whole circle (shown after the answer) fits on the board, not just the arc
  const c = { x: between(rand, 5 + r, 95 - r), y: between(rand, 5 + r, 95 - r) }
  return {
    kind: 'center', title: 'Center of the circle', prompt: 'Only part of a circle is shown. Place the point at its center.', input: 'point',
    shapes: [{ t: 'arcline', c, r, from, span }],
    evaluate: ({ point }) => {
      const e = dist(point!, c) / r
      return { points: pointsFor(e, 0.3), label: pct(e), solution: [{ t: 'dot', p: c }, { t: 'circle', c, r }] }
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

/** Smallest corner angle (degrees) of a triangle. */
function minCorner(t: Pt[]) {
  return Math.min(...t.map((p, i) => {
    const a = t[(i + 1) % 3], b = t[(i + 2) % 3]
    return angleDiff(angleTo(p, a), angleTo(p, b))
  }))
}

/** Balance point: the centroid (center of mass) of a random triangle. */
export function balancePoint(rand: Rand): Task {
  for (;;) {
    const a0 = between(rand, 0, 360)
    const pts = [0, 1, 2].map((i) => add(C, dirOf(a0 + i * 120 + between(rand, -45, 45)), between(rand, 22, 42)))
    if (!pts.every((q) => onBoard(q, 6)) || minCorner(pts) < 20) continue
    const g = { x: mean(pts.map((p) => p.x)), y: mean(pts.map((p) => p.y)) }
    const longest = Math.max(...pts.map((p, i) => dist(p, pts[(i + 1) % 3])))
    const medians: Shape[] = pts.map((p, i) => {
      const q = pts[(i + 1) % 3], r = pts[(i + 2) % 3]
      return { t: 'seg', a: p, b: { x: (q.x + r.x) / 2, y: (q.y + r.y) / 2 } }
    })
    return {
      kind: 'balance', title: 'Balance point', prompt: 'Place the point where the triangle would balance on a pin.', input: 'point',
      shapes: [{ t: 'poly', pts }],
      evaluate: ({ point }) => {
        const e = dist(point!, g) / longest
        return { points: pointsFor(e, 0.12), label: pct(e), solution: [...medians, { t: 'dot', p: g }] }
      },
    }
  }
}

/** Where they meet: two line pieces point toward a hidden crossing point; place it. */
export function whereTheyMeet(rand: Rand): Task {
  for (;;) {
    const P = { x: between(rand, 25, 75), y: between(rand, 25, 75) }
    const a1 = between(rand, 0, 360), a2 = a1 + (rand() < 0.5 ? -1 : 1) * between(rand, 30, 80)
    const pieces = [a1, a2].map((a) => {
      const far = between(rand, 45, 70), near = between(rand, 18, 30)
      return { from: add(P, dirOf(a), far), to: add(P, dirOf(a), near), near }
    })
    if (!pieces.every((s) => onBoard(s.from, 5) && onBoard(s.to, 5))) continue
    const gap = mean(pieces.map((s) => s.near))
    return {
      kind: 'meet', title: 'Where they meet', prompt: 'Both lines go on beyond their ends. Place the point where they would cross.', input: 'point',
      shapes: pieces.map((s) => ({ t: 'seg', a: s.from, b: s.to }) as Shape),
      evaluate: ({ point }) => {
        const e = dist(point!, P) / gap
        return {
          points: pointsFor(e, 0.5),
          label: pct(e),
          solution: [...pieces.map((s) => ({ t: 'seg', a: s.to, b: P }) as Shape), { t: 'dot', p: P }],
        }
      },
    }
  }
}

/** Mirror point: place the mirror image of a dot across a slanted line. */
export function mirrorPoint(rand: Rand): Task {
  for (;;) {
    const angle = between(rand, 15, 75) + (rand() < 0.5 ? 0 : 90) // never (nearly) level or upright
    const L0 = { x: between(rand, 35, 65), y: between(rand, 35, 65) }
    const n = dirOf(angle + 90), h = between(rand, 10, 28) * (rand() < 0.5 ? -1 : 1)
    const base = add(L0, dirOf(angle), between(rand, -18, 18))
    const D = add(base, n, h), M = add(base, n, -h)
    if (!onBoard(D) || !onBoard(M)) continue
    return {
      kind: 'mirror', title: 'Mirror point', prompt: 'Place the point where the dot would be in a mirror along the line.', input: 'point',
      shapes: [{ t: 'line', through: L0, angle }, { t: 'dot', p: D }],
      evaluate: ({ point }) => {
        const e = dist(point!, M) / (2 * Math.abs(h))
        return { points: pointsFor(e, 0.35), label: pct(e), solution: [{ t: 'seg', a: D, b: M }, { t: 'dot', p: M }] }
      },
    }
  }
}

/** The shapes of Match the size, as unit outlines (circumradius 1, centered on 0, 0). */
const UNIT_SHAPES: Record<string, Pt[]> = {
  square: [45, 135, 225, 315].map((a) => dirOf(a)),
  circle: Array.from({ length: 48 }, (_, i) => dirOf(i * 7.5)),
  triangle: [90, 210, 330].map((a) => dirOf(a)),
  star: Array.from({ length: 10 }, (_, i) => ({ ...dirOf(90 + i * 36), r: i % 2 ? 0.45 : 1 })).map(({ x, y, r }) => ({ x: x * r, y: y * r })),
}
export const SIZE_SHAPES = Object.keys(UNIT_SHAPES)
const placeShape = (kind: string, c: Pt, r: number): Pt[] => UNIT_SHAPES[kind].map((p) => add(c, p, r))
/** Area of a shape of this kind at circumradius r. */
export const shapeArea = (kind: string, r: number) => polygonArea(UNIT_SHAPES[kind]) * r * r

/** Match the size: resize one shape until it has the same area as another, different shape. */
export function matchSize(rand: Rand): Task {
  const [refKind, adjKind] = shuffle(SIZE_SHAPES, rand)
  const refC = { x: 26, y: 50 }, adjC = { x: 70, y: 50 }
  const refR = between(rand, 11, 16)
  const target = shapeArea(refKind, refR)
  const goal = Math.sqrt(target / shapeArea(adjKind, 1)) // the right circumradius for the adjustable shape
  const start = Math.min(25, Math.max(4, goal * (rand() < 0.5 ? between(rand, 0.55, 0.75) : between(rand, 1.3, 1.6))))
  return {
    kind: 'size', title: 'Match the size', prompt: 'Drag to resize the right shape until it has the same area as the left one.', input: 'length',
    shapes: [{ t: 'poly', pts: placeShape(refKind, refC, refR) }],
    pivot: adjC, dir: { x: 1, y: 0 }, lengthRange: [3, 25], initial: { length: start },
    drawAnswer: ({ length }) => (length === undefined ? [] : [{ t: 'poly', pts: placeShape(adjKind, adjC, length) }]),
    evaluate: ({ length }) => {
      const ratio = shapeArea(adjKind, length!) / target
      const e = Math.abs(Math.log(ratio))
      return {
        points: pointsFor(e, 0.35),
        label: `${Math.abs(ratio * 100 - 100).toFixed(0)} % ${ratio < 1 ? 'too small' : 'too big'}`,
        solution: [{ t: 'poly', pts: placeShape(adjKind, adjC, goal) }],
      }
    },
  }
}

export const TASK_MAKERS = [
  middleOfLine, centerOfCircle, setAngle, bisectAngle, makeParallel, completeSquare, copyLength, equalDistance,
  balancePoint, whereTheyMeet, mirrorPoint, matchSize,
]
/** The tasks added or changed on 2026-11-14, for the test link `#/test/geometry?tasks=new` (dev server only). */
export const NEW_TASK_MAKERS = [middleOfLine, centerOfCircle, balancePoint, whereTheyMeet, mirrorPoint, matchSize]

/** One round of every task type, in random order (`makers`: a subset, for testing). */
export const makeTasks = (rand: Rand = Math.random, makers = TASK_MAKERS) => shuffle(makers, rand).map((make) => make(rand))

export const totalScore = (points: number[]) => round1(mean(points))

/** Short task names for the result chips (all tasks must fit in two rows). */
const SHORT: Record<string, string> = {
  middle: 'Middle', center: 'Center', bisect: 'Half angle', parallel: 'Parallel', balance: 'Balance',
  meet: 'Meet', mirror: 'Mirror', size: 'Size',
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
