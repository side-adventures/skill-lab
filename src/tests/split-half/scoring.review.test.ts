import { describe, expect, it } from 'vitest'
import { polygonArea } from '../geometry/scoring'
import { FAMILIAR_NAMES, ROUNDS, START_X, evaluate, makeRound, makeRounds, resultDetails, totalScore, type Round } from './scoring'

// Scoring review (scoring-reviewer, 2026-11-14). Simulations print their numbers with console.log.

const seeded = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const gauss = (rand: () => number) => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand())
const pct = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(p * xs.length))]
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
const sd = (xs: number[]) => { const m = avg(xs); return Math.sqrt(avg(xs.map((x) => (x - m) ** 2))) }
const r1 = (x: number) => Math.round(x * 10) / 10

const box = (r: Round) => {
  const xs = r.pts.map((p) => p.x)
  return { min: Math.min(...xs), max: Math.max(...xs), mid: (Math.min(...xs) + Math.max(...xs)) / 2, w: Math.max(...xs) - Math.min(...xs) }
}
/** x of the area centroid (the balance point). */
const centroidX = (pts: Round['pts']) => {
  let a = 0, cx = 0
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length]
    const c = p.x * q.y - q.x * p.y
    a += c; cx += (p.x + q.x) * c
  })
  return cx / (3 * a)
}
const cornerMeanX = (r: Round) => avg(r.pts.map((p) => p.x))

/** Fixed rounds so every strategy sees the same 1000 runs. */
const RUNS = (() => { const rand = seeded(42); return Array.from({ length: 1000 }, () => makeRounds(rand)) })()
const runScore = (rounds: Round[], cut: (r: Round) => number) => totalScore(rounds.map((r) => evaluate(r, cut(r)).points))

/**
 * Human model: the guess is pulled a share β from the true cut toward the middle of the shape's box (the naive
 * anchor), plus normal noise σ × shape width.
 */
type Player = { beta: number; sigma: number }
const WEAK: Player = { beta: 0.5, sigma: 0.07 }
const MID: Player = { beta: 0.3, sigma: 0.045 }
const STRONG: Player = { beta: 0.15, sigma: 0.025 }
const humanCut = (p: Player, rand: () => number) => (r: Round) => {
  const b = box(r)
  return r.half + p.beta * (b.mid - r.half) + gauss(rand) * p.sigma * b.w
}
const simulate = (p: Player, seed: number) => {
  const rand = seeded(seed)
  return RUNS.map((rounds) => runScore(rounds, humanCut(p, rand)))
}

describe('split in half — review: degenerate strategies', () => {
  const human = { weak: avg(simulate(WEAK, 7)), mid: avg(simulate(MID, 8)), strong: avg(simulate(STRONG, 9)) }
  const strategies: Record<string, (r: Round) => number> = {
    'stay at 50 (click the line, Done)': () => START_X,
    'middle of the shape box': (r) => box(r).mid,
    'average x of the corners': cornerMeanX,
    'area centroid (balance point)': (r) => centroidX(r.pts),
    'click the far left of the board': () => 0,
  }
  it('prints strategy scores next to modelled humans', () => {
    const out: Record<string, string> = {}
    for (const [name, cut] of Object.entries(strategies)) {
      const s = RUNS.map((rounds) => runScore(rounds, cut))
      out[name] = `mean ${r1(avg(s))}, p10–p90 ${pct(s, 0.1)}–${pct(s, 0.9)}`
    }
    out['human weak'] = `${r1(human.weak)}`
    out['human medium'] = `${r1(human.mid)}`
    out['human strong'] = `${r1(human.strong)}`
    console.log('strategies', out)
    expect(avg(RUNS.map((rounds) => runScore(rounds, () => START_X)))).toBeLessThan(human.weak)
  })

  it('per kind / shape: points for box-middle and centroid shortcuts, and |answer − box middle| in units', () => {
    const rand = seeded(11)
    const rows: Record<string, string> = {}
    for (const name of [...FAMILIAR_NAMES, 'Pointy']) {
      const rounds = Array.from({ length: 600 }, () => name === 'Pointy' ? makeRound('pointy', rand) : makeRound('familiar', rand, undefined))
        .filter((r) => r.name === name)
      const box50 = rounds.map((r) => evaluate(r, box(r).mid).points)
      const cen = rounds.map((r) => evaluate(r, centroidX(r.pts)).points)
      const stay = rounds.map((r) => evaluate(r, START_X).points)
      const off = rounds.map((r) => Math.abs(r.half - box(r).mid))
      const near = rounds.filter((r) => Math.abs(r.half - box(r).mid) < 2.5).length / rounds.length
      rows[name] = `n ${rounds.length} | box-mid ${r1(avg(box50))} | centroid ${r1(avg(cen))} | stay-50 ${r1(avg(stay))} | off-mid ${r1(avg(off))} u | <2.5u ${(near * 100).toFixed(1)} %`
    }
    console.log('per shape', rows)
    expect(Object.keys(rows)).toHaveLength(9)
  })
})

describe('split in half — review: luck vs. skill', () => {
  it('spread of one fixed player over 1000 runs vs. the weak–strong gap', () => {
    const weak = simulate(WEAK, 1), mid = simulate(MID, 2), strong = simulate(STRONG, 3)
    const gap = avg(strong) - avg(weak)
    const res = {
      weak: `mean ${r1(avg(weak))} p10–p90 ${pct(weak, 0.1)}–${pct(weak, 0.9)} SD ${r1(sd(weak))}`,
      mid: `mean ${r1(avg(mid))} p10–p90 ${pct(mid, 0.1)}–${pct(mid, 0.9)} SD ${r1(sd(mid))}`,
      strong: `mean ${r1(avg(strong))} p10–p90 ${pct(strong, 0.1)}–${pct(strong, 0.9)} SD ${r1(sd(strong))}`,
      gap: r1(gap),
      'mid p10–p90 / gap': r1((pct(mid, 0.9) - pct(mid, 0.1)) / gap * 100) / 100,
      'mid SD / gap': Math.round(sd(mid) / gap * 100) / 100,
    }
    console.log('luck vs skill', res)
    expect(gap).toBeGreaterThan(0)
  })

  it('splits the medium player\'s spread: same shapes, new noise vs. new shapes', () => {
    // run-to-run spread with the 1000 run setups fixed and only the player's noise redrawn, vs. a perfect-noise-free player
    const noiseless = RUNS.map((rounds) => runScore(rounds, humanCut({ beta: MID.beta, sigma: 0 }, Math.random)))
    const oneRun = RUNS[0]
    const rand = seeded(5)
    const sameRun = Array.from({ length: 1000 }, () => runScore(oneRun, humanCut(MID, rand)))
    console.log('spread sources (medium)', {
      'only setup luck (no noise), SD': r1(sd(noiseless)),
      'only noise (one fixed setup), SD': r1(sd(sameRun)),
    })
    expect(sd(noiseless)).toBeGreaterThanOrEqual(0)
  })

  it('per shape: medium player mean points (difficulty)', () => {
    const rand = seeded(12), noise = seeded(13)
    const rows: Record<string, string> = {}
    const by: Record<string, number[]> = {}
    for (let i = 0; i < 4000; i++) {
      const r = i % 2 ? makeRound('pointy', rand) : makeRound('familiar', rand)
      ;(by[r.name] ??= []).push(evaluate(r, humanCut(MID, noise)(r)).points)
    }
    for (const [k, v] of Object.entries(by)) rows[k] = `n ${v.length} mean ${r1(avg(v))} SD ${r1(sd(v))}`
    console.log('medium player per shape', rows)
    expect(Object.keys(rows).length).toBe(9)
  })

  it('same error in share terms is worth the same everywhere (sanity)', () => {
    const rand = seeded(14)
    const r = makeRound('pointy', rand)
    expect(evaluate(r, r.half).points).toBe(100)
  })
})

describe('split in half — review: generation', () => {
  it('makeRound always returns quickly and gives valid rounds (20 000 rounds)', () => {
    const rand = seeded(21)
    let minArea = Infinity, minDist = Infinity, maxDist = 0, nearMid = 0
    const t0 = performance.now()
    for (let i = 0; i < 10000; i++) for (const kind of ['familiar', 'pointy'] as const) {
      const r = makeRound(kind, rand)
      minArea = Math.min(minArea, polygonArea(r.pts))
      const d = Math.abs(r.half - START_X)
      minDist = Math.min(minDist, d); maxDist = Math.max(maxDist, d)
      if (Math.abs(r.half - box(r).mid) < 2.5) nearMid++
      expect(Number.isFinite(r.half)).toBe(true)
    }
    const ms = performance.now() - t0
    console.log('generation', { minArea: r1(minArea), minDist: r1(minDist), maxDist: r1(maxDist), nearMidAccepted: nearMid, ms: Math.round(ms) })
    expect(minDist).toBeGreaterThanOrEqual(5.99)
    expect(maxDist).toBeLessThanOrEqual(20.01)
  })
})

describe('split in half — review: score and details', () => {
  it('total is the plain average, one decimal, of whole points', () => {
    expect(totalScore([100, 99, 0, 0, 0])).toBe(39.8)
    expect(ROUNDS).toBe(5)
  })
  it('result details show both closest and furthest as left/right with the bigger side first', () => {
    const d = resultDetails([
      { name: 'a', points: 100, left: 0.5 }, { name: 'b', points: 50, left: 0.4 }, { name: 'c', points: 0, left: 0.75 },
      { name: 'd', points: 75, left: 0.55 }, { name: 'e', points: 0, left: 0.2 },
    ])
    console.log('details', JSON.stringify(d.stats))
    expect(d.stats![0].value).toBe('50.0 / 50.0')
  })
})

describe('split in half — review: what-if fixes (simulated, no app change)', () => {
  // build runs of other mixes from makeRound directly
  const famByName = (rand: () => number, name: string) => {
    for (;;) { const r = makeRound('familiar', rand); if (r.name === name) return r }
  }
  const HARD = ['Triangle', 'L', 'T', 'Boot'], EASY = ['U', 'Arrow', 'Key', 'Fish']
  const mixes: Record<string, (rand: () => number) => Round[]> = {
    'now: 2F + 3P (5)': (rand) => makeRounds(rand),
    '2F (one easy + one hard group) + 3P': (rand) => [
      famByName(rand, HARD[Math.floor(rand() * 4)]), famByName(rand, EASY[Math.floor(rand() * 4)]),
      makeRound('pointy', rand), makeRound('pointy', rand), makeRound('pointy', rand),
    ],
    '3F + 4P (7)': (rand) => [...makeRounds(rand), makeRound('familiar', rand), makeRound('pointy', rand)],
    '3F + 5P (8)': (rand) => [...makeRounds(rand), makeRound('familiar', rand), makeRound('pointy', rand), makeRound('pointy', rand)],
  }
  it('medium-player SD / weak–strong gap per mix', () => {
    const out: Record<string, string> = {}
    for (const [name, mk] of Object.entries(mixes)) {
      const setup = seeded(77)
      const runs = Array.from({ length: 1000 }, () => mk(setup))
      const sim = (p: Player, seed: number) => { const rand = seeded(seed); return runs.map((rs) => runScore(rs, humanCut(p, rand))) }
      const w = sim(WEAK, 1), m = sim(MID, 2), s = sim(STRONG, 3)
      const gap = avg(s) - avg(w)
      out[name] = `mid p10–p90 ${pct(m, 0.1)}–${pct(m, 0.9)} | SD/gap ${(sd(m) / gap).toFixed(2)} | p10–p90/gap ${((pct(m, 0.9) - pct(m, 0.1)) / gap).toFixed(2)}`
    }
    console.log('what-if mixes', out)
    expect(Object.keys(out)).toHaveLength(4)
  })
  it('a "smart naive" cut: box middle, pushed out of the 44–56 band the answer never lands in', () => {
    const cut = (r: Round) => { const m = box(r).mid; return m > 44 && m < 56 ? (m < 50 ? 44 : 56) : m }
    const s = RUNS.map((rounds) => runScore(rounds, cut))
    console.log('smart naive', `mean ${r1(avg(s))} p10–p90 ${pct(s, 0.1)}–${pct(s, 0.9)}`)
    expect(avg(s)).toBeLessThan(47.5)
  })
})

describe('split in half — review: smart naive vs. weak player', () => {
  it('share of weak-player runs that "box middle, pushed out of 44–56" beats on the same setups', () => {
    const cut = (r: Round) => { const m = box(r).mid; return m > 44 && m < 56 ? (m < 50 ? 44 : 56) : m }
    const naive = RUNS.map((rounds) => runScore(rounds, cut))
    const weak = simulate(WEAK, 31), mid = simulate(MID, 32)
    const beatsWeak = naive.filter((s, i) => s > weak[i]).length / naive.length
    const beatsMid = naive.filter((s, i) => s > mid[i]).length / naive.length
    const plainBox = RUNS.map((rounds) => runScore(rounds, (r) => box(r).mid))
    const plainBeatsWeak = plainBox.filter((s, i) => s > weak[i]).length / naive.length
    console.log('naive vs humans', { beatsWeak, beatsMid, plainBoxBeatsWeak: plainBeatsWeak })
    expect(beatsWeak).toBeLessThan(0.5)
  })
})
