import { describe, expect, it } from 'vitest'
import { LIVES, START_DIGITS, makeSequence, spanScore } from './scoring'

// ---- Review 2026-11-17 (scoring-reviewer): luck vs skill, sequence generation ----

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

/** Plays a run like BackwardSpanTest: start at 2, +1 per success, a miss costs a life and replays the same length. */
function run(pass: (len: number) => boolean) {
  let len = START_DIGITS
  let lives = LIVES
  while (lives > 0 && len < 30) {
    if (pass(len)) len++
    else lives--
  }
  return spanScore(len)
}
/** A player with backward span S: chance to get length L right falls off around S (logistic, width 0.5), plus 2 % slips. */
const player = (S: number, r: () => number) => (len: number) => r() >= 0.02 && r() < 1 / (1 + Math.exp((len - S - 0.5) / 0.5))

describe('backward span (review)', () => {
  it('same player run to run: span 4 vs span 6 (passes; numbers in the log)', () => {
    const r = seeded(1)
    const res: Record<number, number[]> = {}
    for (const S of [4, 5, 6]) res[S] = Array.from({ length: 1000 }, () => run(player(S, r)))
    const gap = mean(res[6]) - mean(res[4])
    const rows = [4, 5, 6].map((S) =>
      `S=${S}: mean ${mean(res[S]).toFixed(2)}, p10–p90 ${pctl(res[S], 0.1)}–${pctl(res[S], 0.9)}, sd ${sd(res[S]).toFixed(2)} (= ${(sd(res[S]) / gap).toFixed(2)} of gap)`)
    console.log(`[backward-span] gap S6−S4 = ${gap.toFixed(2)}\n${rows.join('\n')}`)
    expect(sd(res[5]) / gap).toBeLessThan(0.5)
  })

  it('one miss on the first 2-digit sequence costs a strong player ~0.7 digits, since the 2 lives last the whole run (passes; numbers in the log)', () => {
    const r = seeded(2)
    const clean = Array.from({ length: 1000 }, () => run(player(5, r)))
    const early = Array.from({ length: 1000 }, () => {
      let missed = false // misses the first 2-digit sequence, then plays normally
      return run((len) => (len === 2 && !missed ? ((missed = true), false) : player(5, r)(len)))
    })
    console.log(`[backward-span] S=5 clean ${mean(clean).toFixed(2)}, a miss at 2 digits ${mean(early).toFixed(2)}`)
    expect(mean(clean) - mean(early)).toBeLessThan(1)
  })

  it('sequences: no A B A (or A B A B) patterns since 2026-11-17, digits still evenly used (passes; was ~7–9 % A B A B)', () => {
    const r = seeded(3)
    const counts = Array(10).fill(0)
    const N = 20_000
    const rows: string[] = []
    const share: Record<number, number> = {}
    for (const len of [5, 6, 7]) {
      let abab = 0
      let aba = 0
      for (let k = 0; k < N; k++) {
        const s = makeSequence(len, r)
        if (len === 6) for (const d of s) counts[+d]++
        if (/(\d)(\d)\1\2/.test(s)) abab++
        if (/(\d)\d\1/.test(s)) aba++
      }
      share[len] = abab / N
      rows.push(`${len} digits: A B A B in ${(abab / N * 100).toFixed(1)} %, A B A in ${(aba / N * 100).toFixed(1)} %`)
    }
    const shares = counts.slice(1).map((c) => c / (N * 6))
    console.log(`[backward-span] digit shares 1–9 (6 digits): ${shares.map((x) => (x * 100).toFixed(1)).join(' ')} %\n${rows.join('\n')}`)
    expect(Math.min(...shares)).toBeGreaterThan(0.08)
    expect(share[6]).toBe(0)
  })

  it('failing the first length twice scores 0, a played run, saved (passes)', () => {
    expect(run(() => false)).toBe(0)
  })
})
