import { describe, expect, it } from 'vitest'
import { DURATION_MS, SYMBOL_COUNT, makeSymbolSource, partPoints, symbolScore, type Answer } from './scoring'

// ---- Review 2026-11-17 (scoring-reviewer): shortcuts, luck vs skill ----

// mulberry32, seeded
const seeded = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
const sd = (xs: number[]) => { const m = mean(xs); return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))) }
const pctl = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.floor(p * (xs.length - 1))]
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r())

/** Plays 60 s: `respond` gives (symbol shown, rand) → [key pressed, ms taken]. */
function run(respond: (shown: number, r: () => number) => [number, number], r: () => number) {
  const next = makeSymbolSource(r)
  const answers: Answer[] = []
  let t = 0
  for (;;) {
    const shown = next()
    const [key, ms] = respond(shown, r)
    t += ms
    if (t > DURATION_MS) break
    answers.push({ at: t, correct: key === shown })
  }
  const c = answers.filter((a) => a.correct).length
  return { score: symbolScore(c, answers.length - c), answers }
}
/** A human: median `ms` per answer (lognormal spread), gets faster by `learn` over the minute, `err` wrong. */
const human = (ms: number, err: number) => (shown: number, r: () => number): [number, number] =>
  [r() < err ? (shown + 1) % SYMBOL_COUNT : shown, ms * Math.exp(0.35 * gauss(r))]

describe('symbol code (review)', () => {
  it('same player run to run: 900 ms vs 600 ms per symbol (passes; numbers in the log)', () => {
    const r = seeded(1)
    const weak = Array.from({ length: 1000 }, () => run(human(900, 0.05), r).score)
    const strong = Array.from({ length: 1000 }, () => run(human(600, 0.03), r).score)
    const gap = mean(strong) - mean(weak)
    const line = (n: string, xs: number[]) => `${n}: mean ${mean(xs).toFixed(1)}, p10–p90 ${pctl(xs, 0.1)}–${pctl(xs, 0.9)}, sd ${(sd(xs) / gap).toFixed(3)} of gap`
    console.log(`[symbol-code] gap ${gap.toFixed(1)} pts\n${line('weak', weak)}\n${line('strong', strong)}`)
    expect(sd(weak) / gap).toBeLessThan(0.2)
  })

  it('spamming scores below 0: random keys, one key, cycling the keys (passes)', () => {
    const r = seeded(2)
    let cyc = 0
    const spam: Record<string, (s: number, r: () => number) => [number, number]> = {
      'random keys, 8/s': (_s, r) => [Math.floor(r() * SYMBOL_COUNT), 125],
      'one key, 10/s': () => [0, 100],
      'cycling 1–6, 10/s': () => [cyc++ % SYMBOL_COUNT, 100],
    }
    const rows: string[] = []
    for (const [name, f] of Object.entries(spam)) {
      const s = mean(Array.from({ length: 200 }, () => run(f, r).score))
      rows.push(`${name}: ${s.toFixed(1)}`)
      expect(s).toBeLessThan(0)
    }
    console.log('[symbol-code] spam\n' + rows.join('\n'))
  })

  it('the 20 s chips always add up to the score (passes)', () => {
    const r = seeded(3)
    for (let k = 0; k < 300; k++) {
      const { score, answers } = run(human(700, 0.1), r)
      expect(partPoints(answers).reduce((a, b) => a + b, 0)).toBe(score)
    }
  })
})
