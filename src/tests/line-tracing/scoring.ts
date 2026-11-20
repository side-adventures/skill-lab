export const WIDTH = 1000
export const HEIGHT = 667 // 3:2, like the stage
export const END_RADIUS = 38
export const PENALTY_MS = 3000
/** How far along the path (back or ahead of your progress) a point is checked; keeps you on your own pass at the loop. */
export const WINDOW = 160
const SAMPLES_PER_SEGMENT = 24

export interface Pt { x: number; y: number }
/** A control point: position and corridor width (board units). */
type Ctrl = [x: number, y: number, w: number]

/** One way from GO to the flag, as a dense polyline. `half[i]` is the half width of segment i → i+1. */
export interface Route { pts: Pt[]; half: number[]; acc: number[]; length: number }

export interface Track {
  name: string
  /** Every way from GO to the flag (two at a fork). All share GO and the flag. */
  routes: Route[]
  /** Arc range of route 0 drawn as a bridge over the earlier pass (the loop): just where it crosses. */
  bridge?: [number, number]
  /** Where the path crosses itself (corridors may overlap there). */
  crossings: Pt[]
}

/** Catmull-Rom through the control points (or straight lines), width interpolated linearly. */
function sample(ctrl: Ctrl[], smooth: boolean): { pts: Pt[]; w: number[] } {
  const pts: Pt[] = [], w: number[] = []
  for (let i = 0; i < ctrl.length - 1; i++) {
    const a = ctrl[Math.max(0, i - 1)], b = ctrl[i], c = ctrl[i + 1], d = ctrl[Math.min(ctrl.length - 1, i + 2)]
    for (let s = 0; s < SAMPLES_PER_SEGMENT; s++) {
      const t = s / SAMPLES_PER_SEGMENT, t2 = t * t, t3 = t2 * t
      const f = (k: 0 | 1) =>
        smooth
          ? 0.5 * (2 * b[k] + (-a[k] + c[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t3)
          : b[k] + (c[k] - b[k]) * t
      pts.push({ x: f(0), y: f(1) })
      w.push(b[2] + (c[2] - b[2]) * t)
    }
  }
  const last = ctrl[ctrl.length - 1]
  pts.push({ x: last[0], y: last[1] })
  w.push(last[2])
  return { pts, w }
}

export function makeRoute(ctrl: Ctrl[], smooth = true): Route {
  const { pts, w } = sample(ctrl, smooth)
  const acc = cumulative(pts)
  const half = pts.slice(0, -1).map((_, i) => (w[i] + w[i + 1]) / 4)
  return { pts, half, acc, length: acc[acc.length - 1] }
}

/** Cumulative length at every polyline point. */
export function cumulative(path: Pt[]): number[] {
  const acc = [0]
  for (let i = 1; i < path.length; i++) acc.push(acc[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y))
  return acc
}

/**
 * The closest point of the route between arc lengths `lo` and `hi`: distance, arc length there and the corridor's
 * half width there. `inside` = within the corridor.
 */
export function nearestIn(p: Pt, r: Route, lo = 0, hi = Infinity) {
  let dist = Infinity, along = 0, half = 0
  for (let i = 0; i < r.pts.length - 1; i++) {
    if (r.acc[i + 1] < lo || r.acc[i] > hi) continue
    const a = r.pts[i], b = r.pts[i + 1]
    const dx = b.x - a.x, dy = b.y - a.y
    const len2 = dx * dx + dy * dy || 1
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2))
    const d = Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
    // compare by how far outside the corridor, so a wide part next to a thin one counts right
    if (d - r.half[i] < dist - half) {
      dist = d
      half = r.half[i]
      along = r.acc[i] + t * Math.sqrt(len2)
    }
  }
  return { dist, along, half, inside: dist <= half }
}

/** The half-open sample index range of a route covering arc lengths [from, to]. */
export function indexRange(r: Route, from: number, to: number): [number, number] {
  const i0 = Math.max(0, r.acc.findIndex((a) => a >= from))
  const i1 = r.acc.findIndex((a) => a > to)
  return [i0, i1 === -1 ? r.pts.length : i1]
}

// ---------- the 5 tracks (fixed, so every run and every player gets the same; Loop last, as it takes longest) ----------

const spiral: Ctrl[] = Array.from({ length: 61 }, (_, i) => {
  const t = i / 60, th = Math.PI + t * 2.25 * 2 * Math.PI, r = 300 - 240 * t
  return [500 + r * Math.cos(th), 333 + r * Math.sin(th), 64 - 28 * t]
})

// Loop: long straight, chicane, sweeping arc, S-bend, the loop (later pass on a bridge), bumpy narrow top straight.
const flowing: Ctrl[] = [
  [80, 600, 70], [420, 605, 70], [540, 600, 55], [600, 560, 40], [660, 605, 40], [720, 560, 40], [800, 600, 55],
  [910, 560, 60], [940, 440, 60], [880, 350, 55], [760, 360, 50], [690, 310, 45], [600, 345, 45],
  [540, 389, 50], [430, 389, 50], [330, 387, 50], [270, 300, 50], [340, 195, 50], [460, 240, 50], [430, 385, 50],
  [360, 470, 50],
  [190, 480, 45], [100, 360, 45], [160, 140, 40], [300, 85, 36], [480, 85, 34], [560, 140, 32], [640, 85, 32],
  [720, 140, 32], [800, 85, 32], [900, 150, 32], [910, 220, 32],
]
const BRIDGE_FROM = 18, BRIDGE_TO = 20 // control points of the pass going down through the loop
// the first pass runs straight under the bridge (its bend comes after), so nothing hidden there surprises you
const CROSSING: Pt = { x: 428, y: 386 }

// Fork: chicane, thin straight, hairpin, then the wide main way sweeps around (it carries straight on), while a
// thin zigzag shortcut drops off at a sharp angle: shorter, but narrow and twisty.
const techStart: Ctrl[] = [
  [80, 100, 45], [200, 100, 45], [260, 170, 45], [330, 100, 45], [400, 170, 45], [470, 105, 45], [650, 100, 40],
  [800, 100, 34], [900, 130, 40], [910, 230, 40], [800, 255, 50], [700, 262, 55],
]
const techMain: Ctrl[] = [[540, 270, 60], [380, 290, 60], [240, 360, 60], [200, 480, 60], [300, 590, 60], [500, 600, 60], [640, 560, 55]]
const techShortcut: Ctrl[] = [[690, 340, 26], [620, 410, 26], [690, 480, 26], [640, 560, 55]]
const techEnd: Ctrl[] = [[780, 600, 50], [900, 540, 45], [920, 420, 40], [880, 360, 36]]

export function makeTracks(): Track[] {
  const flow = makeRoute(flowing)
  const b0 = flow.acc[BRIDGE_FROM * SAMPLES_PER_SEGMENT], b1 = flow.acc[BRIDGE_TO * SAMPLES_PER_SEGMENT]
  const over = nearestIn(CROSSING, flow, b0, b1).along
  return [
    { name: 'Straight', routes: [makeRoute([[80, 333, 28], [920, 333, 28]], false)], crossings: [] },
    {
      name: 'Zigzag',
      routes: [makeRoute([[80, 560, 50], [248, 110, 50], [416, 560, 50], [584, 110, 50], [752, 560, 50], [920, 110, 50]], false)],
      crossings: [],
    },
    { name: 'Spiral', routes: [makeRoute(spiral)], crossings: [] },
    {
      name: 'Fork',
      routes: [makeRoute([...techStart, ...techMain, ...techEnd]), makeRoute([...techStart, ...techShortcut, ...techEnd])],
      crossings: [],
    },
    { name: 'Loop', routes: [flow], bridge: [over - 70, over + 70], crossings: [CROSSING] },
  ]
}

/** Steering-law difficulty of a stretch: ∫ ds / width. */
export function difficulty(r: Route, from = 0, to = r.length) {
  let sum = 0
  for (let i = 0; i < r.pts.length - 1; i++) {
    const a = Math.max(from, r.acc[i]), b = Math.min(to, r.acc[i + 1])
    if (b > a) sum += (b - a) / (2 * r.half[i])
  }
  return sum
}

/** Total score: the finished track times plus 3 s per exit. */
export const totalMs = (trackMs: number[], exits: number) => trackMs.reduce((s, t) => s + t, 0) + exits * PENALTY_MS
