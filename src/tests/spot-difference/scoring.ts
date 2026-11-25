import { shuffle, type Rand } from '../../lib/random'
import { GENS, pickDiffs, rnd, type Diff, type SceneItem } from './scenes.gen.js'

/** Pictures per run, each from a different scene. */
export const PICTURES = 5
/** Differences per picture. */
export const DIFFS = 5
/** Points time per picture: finds after it still show, but score nothing. */
export const POINTS_MS = 60_000
/** Points per difference found in time. */
export const PER_FIND = 20
/** Extra room around a hitbox (scene units of 120 × 90), so a click on the edge of a small change counts. */
export const HIT_PAD = 2.5

export interface Picture {
  scene: string
  items: SceneItem[]
  diffs: Diff[]
}

/**
 * 5 pictures from 5 different scenes, each with exactly DIFFS differences. The last one is free: it may land on an item,
 * group or area that already has a change (another window, a second knight …), so finding one there doesn't rule it out;
 * it only may not overlap another change's click area, and on the same item / group it must be another kind of change
 * (appearing and disappearing count as one kind).
 */
export function makePictures(rand: Rand = Math.random): Picture[] {
  const scenes = shuffle(GENS.map((_, i) => i), rand).slice(0, PICTURES)
  return scenes.map((gi) => {
    const g = GENS[gi]
    for (;;) {
      const items = g.gen(rnd(Math.floor(rand() * 1e9) + 1))
      const { diffs } = pickDiffs(items, rnd(Math.floor(rand() * 1e9) + 1), DIFFS, { lastFree: true })
      if (diffs.length === DIFFS) return { scene: g.name, items, diffs }
    }
  })
}

/**
 * Points the k-th wrong click of the run costs (k from 1): 1, 3, 5, 7, then 10 each. The count carries over the whole run,
 * so a slip is cheap but from the 5th on a guess costs half of what a find is worth (it only pays when you are more than
 * a third sure). Capped at 10, so an honest but sloppy player isn't pushed down to a random clicker's 0. Clicks after the
 * points time and on found changes are free.
 */
export const wrongCost = (k: number) => (k <= 4 ? 2 * k - 1 : 10)

/** What wrong clicks number `from + 1` … `from + n` of the run cost together. */
export const wrongCosts = (from: number, n: number) => Array.from({ length: n }, (_, i) => wrongCost(from + i + 1)).reduce((a, b) => a + b, 0)

/** A change's box is at least this wide and tall for clicking (scene units), grown around its centre; the drawn box stays as it is. */
export const HIT_MIN = 6

/** The click area of a change: its box grown to HIT_MIN, plus HIT_PAD on every side. */
export function clickArea([x, y, w, h]: Diff['b']): Diff['b'] {
  const W = Math.max(w, HIT_MIN), H = Math.max(h, HIT_MIN)
  return [x + w / 2 - W / 2 - HIT_PAD, y + h / 2 - H / 2 - HIT_PAD, W + 2 * HIT_PAD, H + 2 * HIT_PAD]
}

/** Distance from a point to a box (0 inside). */
const distToBox = (x: number, y: number, [bx, by, bw, bh]: Diff['b']) => Math.hypot(Math.max(bx - x, 0, x - bx - bw), Math.max(by - y, 0, y - by - bh))

/**
 * Which difference a click (in scene units) hits: its index, or -1. Already found ones (`skip`) are left out, and a click
 * inside a found one's own box hits nothing; when the click is in several click areas, the change whose real box is nearest wins (a click inside a real box always gets it).
 */
export function hitDiff(diffs: Diff[], x: number, y: number, skip: boolean[] = []): number {
  // a click inside a found change's own box belongs to it (no new find, no penalty)
  if (diffs.some((d, i) => skip[i] && distToBox(x, y, d.b) === 0)) return -1
  let best = -1, bestD = Infinity
  diffs.forEach((d, i) => {
    if (skip[i]) return
    const [cx, cy, cw, ch] = clickArea(d.b)
    if (x < cx || x > cx + cw || y < cy || y > cy + ch) return
    const dist = distToBox(x, y, d.b)
    if (dist < bestD) [best, bestD] = [i, dist]
  })
  return best
}

export interface PictureResult {
  scene: string
  /** Differences found within the points time. */
  found: number
  /** Points time left when the last one was found in time (ms); null when not all were found in time. */
  leftMs: number | null
  /** How long the round took (ms), until all were found or it was ended; for the result table. */
  ms?: number
  /** Wrong clicks within the points time. */
  wrong: number
  /** What they cost (the cost grows over the run). */
  penalty: number
  /** Ended early with End round. */
  skipped: boolean
}

/** A round's points before wrong clicks: 20 per difference found in time, plus the whole seconds left when all were found in time. */
export const roundPoints = (r: PictureResult) => PER_FIND * r.found + (r.found === DIFFS && r.leftMs !== null ? Math.floor(r.leftMs / 1000) : 0)

/** A round's points minus its wrong-click cost. */
export const pictureScore = (r: PictureResult) => roundPoints(r) - r.penalty

/** The run's points (never below 0). */
export const runScore = (rs: PictureResult[]) => Math.max(0, rs.reduce((s, r) => s + pictureScore(r), 0))
