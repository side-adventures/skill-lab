import { randInt, type Rand } from '../../lib/random'

export const DURATION_MS = 60_000
export const CELLS = 7

export type Cell = [number, number]
export type Shape = Cell[]

const key = (s: Shape) => s.map(([x, y]) => `${x},${y}`).sort().join(';')
const normalize = (s: Shape): Shape => {
  const minX = Math.min(...s.map((c) => c[0])), minY = Math.min(...s.map((c) => c[1]))
  return s.map(([x, y]) => [x - minX, y - minY] as Cell).sort((a, b) => a[0] - b[0] || a[1] - b[1])
}
const rotate90 = (s: Shape): Shape => s.map(([x, y]) => [y, -x] as Cell)
export const mirror = (s: Shape): Shape => s.map(([x, y]) => [-x, y] as Cell)

/** All 4 quarter-turn rotations, normalized. */
const rotations = (s: Shape) => {
  const out: string[] = []
  let cur = s
  for (let i = 0; i < 4; i++) {
    out.push(key(normalize(cur)))
    cur = rotate90(cur)
  }
  return out
}

/** A shape is usable only if its mirror image can't be produced by rotating it. */
export const isChiral = (s: Shape) => !rotations(s).includes(key(normalize(mirror(s))))

/** Random connected shape of CELLS squares (grown cell by cell) that is chiral. */
export function makeShape(rand: Rand = Math.random): Shape {
  for (;;) {
    const cells: Shape = [[0, 0]]
    while (cells.length < CELLS) {
      const [x, y] = cells[randInt(0, cells.length - 1, rand)]
      const dirs: Cell[] = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      const [dx, dy] = dirs[randInt(0, 3, rand)]
      const next: Cell = [x + dx, y + dy]
      if (!cells.some((c) => c[0] === next[0] && c[1] === next[1])) cells.push(next)
    }
    const s = normalize(cells)
    // avoid blobby shapes: require a reasonably spread outline
    const w = Math.max(...s.map((c) => c[0])) + 1, h = Math.max(...s.map((c) => c[1])) + 1
    if (isChiral(s) && w * h >= 12 && Math.max(w, h) <= 4) return s
  }
}

export interface Trial {
  shape: Shape
  mirrored: boolean
  leftAngle: number
  rightAngle: number
}

export function makeTrial(rand: Rand = Math.random): Trial {
  const leftAngle = randInt(0, 23, rand) * 15
  const delta = randInt(3, 21, rand) * 15 // 45°..315°, never (almost) the same orientation
  return { shape: makeShape(rand), mirrored: rand() < 0.5, leftAngle, rightAngle: (leftAngle + delta) % 360 }
}
