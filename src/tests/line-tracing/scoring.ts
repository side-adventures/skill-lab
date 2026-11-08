import type { Rand } from '../../lib/random'

export const WIDTH = 1000
export const HEIGHT = 600
export const HALF_WIDTH = 30 // corridor half width (viewBox units)
export const END_RADIUS = 38
export const CONTROL_POINTS = 7
export const SAMPLES_PER_SEGMENT = 60

export interface Pt { x: number; y: number }

/** Control points left → right with alternating, clearly visible turns (similar difficulty every time). */
export function makeControlPoints(rand: Rand = Math.random): Pt[] {
  const pts: Pt[] = []
  let up = rand() < 0.5
  for (let i = 0; i < CONTROL_POINTS; i++) {
    const x = 80 + (i * (WIDTH - 160)) / (CONTROL_POINTS - 1)
    if (i === 0) pts.push({ x, y: 150 + rand() * 300 })
    else {
      const prev = pts[i - 1].y
      const dy = 160 + rand() * 160 // 160..320 change per segment
      let y = up ? prev - dy : prev + dy
      if (y < 80 || y > HEIGHT - 80) y = up ? prev + dy : prev - dy // bounce off the edge
      y = Math.min(HEIGHT - 80, Math.max(80, y))
      pts.push({ x, y })
      up = !up
    }
  }
  return pts
}

/** Catmull-Rom spline through the control points, as a dense polyline. */
export function samplePath(ctrl: Pt[]): Pt[] {
  const out: Pt[] = []
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)]
    for (let s = 0; s < SAMPLES_PER_SEGMENT; s++) {
      const t = s / SAMPLES_PER_SEGMENT, t2 = t * t, t3 = t2 * t
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
      out.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) })
    }
  }
  out.push(ctrl[ctrl.length - 1])
  return out
}

/** Cumulative length at every polyline point. */
export function cumulative(path: Pt[]): number[] {
  const acc = [0]
  for (let i = 1; i < path.length; i++) acc.push(acc[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y))
  return acc
}

/** Distance from p to the polyline and the arc length of the closest point. */
export function nearest(p: Pt, path: Pt[], acc: number[]) {
  let best = Infinity, along = 0
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1]
    const dx = b.x - a.x, dy = b.y - a.y
    const len2 = dx * dx + dy * dy || 1
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2))
    const d = Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
    if (d < best) {
      best = d
      along = acc[i] + t * Math.sqrt(len2)
    }
  }
  return { dist: best, along }
}
