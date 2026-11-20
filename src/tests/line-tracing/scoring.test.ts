import { describe, expect, it } from 'vitest'
import { HEIGHT, WIDTH, WINDOW, cumulative, difficulty, makeRoute, makeTracks, nearestIn, totalMs } from './scoring'

const tracks = makeTracks()

describe('line tracing tracks', () => {
  it('has 5 tracks, all on the board', () => {
    expect(tracks).toHaveLength(5)
    for (const t of tracks)
      for (const r of t.routes)
        r.pts.forEach((p, i) => {
          const h = r.half[Math.min(i, r.half.length - 1)]
          expect(p.x - h > 0 && p.x + h < WIDTH && p.y - h > 0 && p.y + h < HEIGHT).toBe(true)
        })
  })

  it('keeps separate parts of a route apart (except at the loop crossing)', () => {
    for (const t of tracks)
      for (const r of t.routes)
        for (let i = 0; i < r.pts.length; i += 2)
          for (let j = i + 1; j < r.pts.length; j += 2) {
            if (r.acc[j] - r.acc[i] < 2 * WINDOW) continue
            const a = r.pts[i], b = r.pts[j]
            if (t.crossings.some((c) => Math.hypot(a.x - c.x, a.y - c.y) < 90 && Math.hypot(b.x - c.x, b.y - c.y) < 90)) continue
            const ha = r.half[Math.min(i, r.half.length - 1)], hb = r.half[Math.min(j, r.half.length - 1)]
            expect(Math.hypot(a.x - b.x, a.y - b.y), `${t.name} ${i}/${j}`).toBeGreaterThan(ha + hb + 10)
          }
  })

  it('makes the fork shortcut shorter and narrower, but not easier per length', () => {
    const [long, short] = tracks.find((t) => t.name === 'Fork')!.routes
    expect(short.length).toBeLessThan(long.length * 0.8)
    expect(Math.min(...short.half)).toBeLessThan(Math.min(...long.half))
    // a clean shortcut still pays off (lower total difficulty), but only a bit
    const ratio = difficulty(short) / difficulty(long)
    expect(ratio).toBeGreaterThan(0.7)
    expect(ratio).toBeLessThan(1)
  })

  it('stays on its own pass at the loop crossing', () => {
    const t = tracks.find((t) => t.name === 'Loop')!, loop = t.routes[0], c = t.crossings[0]
    const firstPass = nearestIn(c, loop, 0, t.bridge![0])
    const secondPass = nearestIn(c, loop, t.bridge![0])
    expect(firstPass.inside && secondPass.inside, `${firstPass.dist} ${secondPass.dist}`).toBe(true)
    // the passes are far apart along the path, so a window around one never reaches the other
    expect(secondPass.along - firstPass.along).toBeGreaterThan(2 * WINDOW)
  })

  it('keeps the first pass of the loop straight where the bridge hides it', () => {
    const t = tracks.find((t) => t.name === 'Loop')!, loop = t.routes[0]
    const at = nearestIn(t.crossings[0], loop, 0, t.bridge![0]).along
    const heading = (s: number) => {
      const i = loop.acc.findIndex((a) => a >= s)
      return Math.atan2(loop.pts[i + 1].y - loop.pts[i].y, loop.pts[i + 1].x - loop.pts[i].x)
    }
    // 60 units each side: the bridge deck with its edge plus some margin
    const d = heading(at + 60) - heading(at - 60)
    const turn = Math.abs(Math.atan2(Math.sin(d), Math.cos(d))) * (180 / Math.PI)
    expect(turn).toBeLessThan(6)
  })
})

describe('line tracing helpers', () => {
  it('measures distance and width', () => {
    const r = makeRoute([[0, 0, 20], [100, 0, 20]], false)
    const h = nearestIn({ x: 40, y: 8 }, r)
    expect(h.dist).toBeCloseTo(8)
    expect(h.along).toBeCloseTo(40)
    expect(h.inside).toBe(true)
    expect(nearestIn({ x: 40, y: 12 }, r).inside).toBe(false)
    expect(cumulative(r.pts).at(-1)).toBeCloseTo(100)
  })
  it('adds 3 s per exit', () => {
    expect(totalMs([1000, 2000], 2)).toBe(9000)
  })
})
