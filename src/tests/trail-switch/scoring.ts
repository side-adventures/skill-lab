import type { Rand } from '../../lib/random'

/** Circles per part (Part B: 1-A-2-B … 8-H). */
export const COUNT = 16
/** Circle radius, as a fraction of the board side. */
export const RADIUS = 0.045
/** Centers are at least this far apart (board fractions), and this far from the edge. */
export const MIN_GAP = 0.14
export const MARGIN = 0.07
/**
 * The path through all circles in order (sum of the 15 straight steps) must lie in this band, in board sides, so no
 * layout is much shorter or longer to trace than another.
 */
export const PATH_MIN = 5.6
export const PATH_MAX = 6.4
/** Added to your time for each wrong click. */
export const PENALTY_MS = 1000

export const LABELS_A = Array.from({ length: COUNT }, (_, i) => String(i + 1))
export const LABELS_B = Array.from({ length: COUNT }, (_, i) => (i % 2 === 0 ? String(i / 2 + 1) : String.fromCharCode(65 + (i - 1) / 2)))

export interface Point { x: number; y: number }

export const pathLength = (pts: Point[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0)

/**
 * Circle positions in visiting order: spread out (MIN_GAP), and the whole path within the PATH_MIN–PATH_MAX band.
 * Each step is drawn so the path stays near the band (a random spot at a distance close to the needed average).
 */
export function makeLayout(rand: Rand = Math.random): Point[] {
  for (;;) {
    const pts: Point[] = []
    let tries = 0
    while (pts.length < COUNT && tries < 4000) {
      tries++
      const p = { x: MARGIN + rand() * (1 - 2 * MARGIN), y: MARGIN + rand() * (1 - 2 * MARGIN) }
      if (pts.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < MIN_GAP)) continue
      // Keep steps between 0.2 and 0.65 board sides, so the order is neither all neighbours nor all far jumps.
      const last = pts[pts.length - 1]
      if (last) {
        const d = Math.hypot(p.x - last.x, p.y - last.y)
        if (d < 0.2 || d > 0.65) continue
      }
      pts.push(p)
    }
    if (pts.length < COUNT) continue
    const len = pathLength(pts)
    if (len >= PATH_MIN && len <= PATH_MAX) return pts
  }
}

export interface PartResult { ms: number; wrong: number }

/** A part's time with penalties. */
export const partTime = (p: PartResult) => p.ms + p.wrong * PENALTY_MS
