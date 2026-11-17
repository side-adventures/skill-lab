import { describe, expect, it } from 'vitest'
import { MIN_GAP, START_STAIR, TRIALS, capacityScore, fitK, makeChangePlan, nextStair, rates, type Answer } from './scoring'

// ---- Review 2026-11-17 (scoring-reviewer): bias, spread, loopholes of the ML capacity score ----

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

/** How the player answers one trial: (size, change, trial index, answers so far) → said "changed". */
type Strategy = (size: number, change: boolean, i: number, prev: Answer[], r: () => number) => boolean

/** Plays a run like ChangeDetectionTest: the change plan up front, the staircase picks the size. */
function play(strategy: Strategy, r: () => number) {
  const plan = makeChangePlan(r)
  let stair = START_STAIR
  const answers: Answer[] = []
  for (let i = 0; i < TRIALS; i++) {
    const said = strategy(stair.size, plan[i], i, answers, r)
    answers.push({ size: stair.size, change: plan[i], saidChange: said })
    stair = nextStair(stair, said === plan[i])
  }
  return answers
}

/**
 * Human-like player: holds about K shapes (K varies ±0.7 from trial to trial), guesses "changed" with g when the
 * change wasn't among the held shapes, and slips (random answer) on 4 % of trials.
 */
const human = (K: number, g = 0.2, slip = 0.04): Strategy => (size, change, _i, _p, r) => {
  if (r() < slip) return r() < 0.5
  const k = Math.max(0, K + 0.7 * gauss(r))
  if (!change) return r() < g
  return r() < Math.min(1, k / size) || r() < g
}

function stats(strategy: Strategy, runs: number, seed: number) {
  const r = seeded(seed)
  const scores: number[] = []
  let scaled = 0
  let scaleLoss = 0
  for (let n = 0; n < runs; n++) {
    const a = play(strategy, r)
    const s = capacityScore(a)
    const { hit, fa } = rates(a)
    if (hit - fa < MIN_GAP) {
      scaled++
      scaleLoss += Math.round(fitK(a) * 10) / 10 - s
    }
    scores.push(s)
  }
  return { mean: mean(scores), sd: sd(scores), p10: pctl(scores, 0.1), p90: pctl(scores, 0.9), scaled: scaled / runs, scaleLoss: scaled ? scaleLoss / scaled : 0, scores }
}

const RUNS = 400

describe('change detection capacity (review)', { timeout: 30_000 }, () => {
  it('bias: mean score tracks the true K (passes)', () => {
    const rows: string[] = []
    for (const K of [2, 3, 4, 5, 6, 8]) {
      const s = stats(human(K), RUNS / 2, 10 + K)
      rows.push(`K=${K}: mean ${s.mean.toFixed(2)}, p10–p90 ${s.p10}–${s.p90}, sd ${s.sd.toFixed(2)}`)
      expect(Math.abs(s.mean - K)).toBeLessThan(1)
    }
    console.log('[change-detection] bias\n' + rows.join('\n'))
  })

  it('guess bias barely moves the score: liberal vs conservative player with K=4 (passes)', () => {
    const lo = stats(human(4, 0.05), RUNS / 2, 21)
    const hi = stats(human(4, 0.45), RUNS / 2, 22)
    console.log(`[change-detection] K=4, g=0.05: mean ${lo.mean.toFixed(2)} sd ${lo.sd.toFixed(2)}; g=0.45: mean ${hi.mean.toFixed(2)} sd ${hi.sd.toFixed(2)}`)
    expect(Math.abs(lo.mean - hi.mean)).toBeLessThan(0.6)
  })

  it('luck vs skill: same player run to run, K=3 vs K=5 (passes; numbers in the log)', () => {
    const weak = stats(human(3), RUNS, 31)
    const strong = stats(human(5), RUNS, 32)
    const mid = stats(human(4), RUNS, 33)
    const gap = strong.mean - weak.mean
    const line = (n: string, s: typeof weak) =>
      `${n}: mean ${s.mean.toFixed(2)}, p10–p90 ${s.p10}–${s.p90} (= ${((s.p90 - s.p10) / gap).toFixed(2)} of gap), sd ${s.sd.toFixed(2)} (= ${(s.sd / gap).toFixed(2)} of gap)`
    console.log(`[change-detection] gap K5−K3 = ${gap.toFixed(2)}\n${line('K=3', weak)}\n${line('K=4', mid)}\n${line('K=5', strong)}`)
    // How often does the K=3 player beat the K=4 player's median?
    const midMedian = pctl(mid.scores, 0.5)
    console.log(`[change-detection] K=3 runs above the K=4 median: ${(weak.scores.filter((s) => s > midMedian).length / RUNS * 100).toFixed(1)} %`)
    expect(weak.sd / gap).toBeLessThan(1)
  })

  it('MIN_GAP scaling almost never touches honest players (passes)', () => {
    const rows: string[] = []
    for (const K of [2, 3, 4, 5]) {
      const s = stats(human(K), RUNS, 40 + K)
      rows.push(`K=${K}: ${(s.scaled * 100).toFixed(1)} % of runs scaled, losing ${s.scaleLoss.toFixed(2)} shapes on average when scaled`)
      expect(s.scaled).toBeLessThan(0.05)
    }
    console.log('[change-detection] MIN_GAP\n' + rows.join('\n'))
  })

  it('two early mistakes (rounds 1–2) cost a K=4 player little since the warm-up weighting (passes; was ~0.7 before 2026-11-17)', () => {
    const base = human(4)
    const early: Strategy = (size, change, i, p, r) => (i < 2 ? !change : base(size, change, i, p, r))
    const runs = (st: Strategy) => { const r = seeded(51); return Array.from({ length: RUNS / 2 }, () => capacityScore(play(st, r))) }
    const [clean, slipped] = [runs(base), runs(early)]
    console.log(`[change-detection] K=4 with warm-up weights: clean ${mean(clean).toFixed(2)} (sd ${sd(clean).toFixed(2)}), two early mistakes ${mean(slipped).toFixed(2)}`)
    expect(mean(clean) - mean(slipped)).toBeLessThan(0.4)
  })

  it('guessing "changed" liberally when unsure raises the spread, and with it the best of 10 runs (demonstrates)', () => {
    const rows: string[] = []
    const best: number[] = []
    for (const g of [0.05, 0.2, 0.45]) {
      const s = stats(human(4, g), 1000, 90).scores
      const best10 = mean(Array.from({ length: 100 }, (_, i) => Math.max(...s.slice(i * 10, i * 10 + 10))))
      best.push(best10)
      rows.push(`K=4, g=${g}: mean ${mean(s).toFixed(2)}, sd ${sd(s).toFixed(2)}, mean best of 10 runs ${best10.toFixed(2)}`)
    }
    console.log('[change-detection] guess bias\n' + rows.join('\n'))
    expect(best[2] - best[0]).toBeGreaterThan(0.8)
  })

  it('degenerate answer patterns score near 0 (passes)', () => {
    const rows: string[] = []
    const strategies: Record<string, Strategy> = {
      'always same': () => false,
      'always changed': () => true,
      alternating: (_s, _c, i) => i % 2 === 0,
      random: (_s, _c, _i, _p, r) => r() < 0.5,
      'changed only on small boards (≤ 3)': (size) => size <= 3,
    }
    for (const [name, st] of Object.entries(strategies)) {
      const s = stats(st, 200, 60 + name.length)
      rows.push(`${name}: mean ${s.mean.toFixed(2)}, p90 ${s.p90}, max ${Math.max(...s.scores)}`)
      expect(s.mean).toBeLessThan(0.6)
    }
    console.log('[change-detection] degenerate\n' + rows.join('\n'))
  })

  it('counting the 20/20 plan through the feedback gains little (passes)', () => {
    // Uses the flash to know the truth of every past trial; when the rest of the plan is all one kind, answer it.
    const base = human(4)
    const counting: Strategy = (size, change, i, prev, r) => {
      const changes = prev.filter((a) => a.change).length
      const left = TRIALS - i
      if (changes === TRIALS / 2) return false
      if (TRIALS / 2 - changes === left) return true
      return base(size, change, i, prev, r)
    }
    const a = stats(base, RUNS / 2, 71)
    const b = stats(counting, RUNS / 2, 71)
    console.log(`[change-detection] K=4 honest ${a.mean.toFixed(2)}, counting the plan ${b.mean.toFixed(2)}`)
    expect(b.mean - a.mean).toBeLessThan(0.3)
  })

  it('a perfect player hits the ceiling of 12 (passes)', () => {
    const s = stats((_s, change) => change, 5, 80)
    expect(s.mean).toBe(12)
  })
})
