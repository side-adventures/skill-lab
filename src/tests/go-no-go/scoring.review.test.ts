import { describe, expect, it } from 'vitest'
import { WINDOW_MS, makeTrials, totalMs, type Stats } from './scoring'

// mulberry32, seeded
const seeded = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() || 1e-12)) * Math.cos(2 * Math.PI * r())
const pctl = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.floor(p * (xs.length - 1))]
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

/** mu/sd/tau: ex-Gaussian RT; pf: click on red; pm: lapse on green; pe: early click per trial. */
interface Player { mu: number; sd: number; tau: number; pf: number; pm: number; pe: number }
const STRONG: Player = { mu: 290, sd: 30, tau: 40, pf: 0.05, pm: 0.005, pe: 0.005 }
const WEAK: Player = { mu: 370, sd: 40, tau: 70, pf: 0.2, pm: 0.03, pe: 0.03 }

function play(p: Player, r: () => number) {
  const s: Stats = { rts: [], misses: 0, falseTaps: 0 }
  for (const green of makeTrials(r)) {
    if (r() < p.pe) s.falseTaps++
    if (green) {
      const rt = p.mu + p.sd * gauss(r) - p.tau * Math.log(r() || 1e-12)
      if (r() < p.pm || rt >= WINDOW_MS) s.misses++
      else s.rts.push(rt)
    } else if (r() < p.pf) s.falseTaps++
  }
  return totalMs(s)
}

describe('go / no-go 0.8 s wrong-click cost (review 2026-11-13)', () => {
  it('blind clicking on every circle loses to an average weak player (passes)', () => {
    const blind = totalMs({ rts: Array(21).fill(260), misses: 0, falseTaps: 9 }) // 12.66 s
    const r = seeded(1)
    const weak = Array.from({ length: 1000 }, () => play(WEAK, r))
    expect(blind).toBeGreaterThan(mean(weak)) // weak ≈ 11.6 s
    // only clicking the first green and then idling: 16+ s, never better than honest
    expect(totalMs({ rts: [300], misses: 20, falseTaps: 0 })).toBeGreaterThan(pctl(weak, 0.99))
  })

  it('luck: one strong player spreads ±0.8 s, well under the strong–weak gap (passes)', () => {
    const r = seeded(2)
    const strong = Array.from({ length: 1000 }, () => play(STRONG, r))
    const weak = Array.from({ length: 1000 }, () => play(WEAK, r))
    const spread = pctl(strong, 0.9) - pctl(strong, 0.1) // measured ≈ 6.7–8.3 s
    expect(spread / (mean(weak) - mean(strong))).toBeLessThan(0.5) // gap ≈ 4.1 s
  })
})
