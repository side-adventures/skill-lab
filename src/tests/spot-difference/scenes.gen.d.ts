/** Types for the generated scene module (scripts/spot-difference/build.py writes scenes.gen.js). */
export type Rng = () => number

/** One thing in a scene (a knight, a window, the hydrant); `p` are its drawing parameters. */
export interface SceneItem {
  kind: string
  p: Record<string, unknown>
  z?: number
  g?: string
}

/** One change picked for the right picture: which item, the change type and its hitbox (scene units, 120 × 90). */
export interface Diff {
  i: number
  t: string
  b: [number, number, number, number]
  p2: Record<string, unknown>
  easy: boolean
  cat: string
  g?: string
}

export interface Scene {
  name: string
  sub: string
  gen: (r: Rng) => SceneItem[]
}

export const GENS: Scene[]
export function rnd(seed: number): Rng
/** Picks n changes (default 3): unit first (weighted by its changes), then one of its changes; spread over the scene. */
export function pickDiffs(items: SceneItem[], r: Rng, n?: number, opts?: { lastFree?: boolean }): { diffs: Diff[]; all: number }
/** SVG markup (viewBox 0 0 120 90) of the scene; with `diffs`, the changed version (several changes on one item combine). */
export function renderItems(items: SceneItem[], diffs?: Diff[]): string
