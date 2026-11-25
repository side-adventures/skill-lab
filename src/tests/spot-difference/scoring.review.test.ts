/**
 * Scoring review (2026-11-23). Demonstrating tests: they all pass and print / lock the numbers quoted in the review.
 * Player model (an assumption, not data): each difference is found after an exponential search time with rate
 * skill × √(box area, capped at 400) / 90 (× 1.5 for an "easy" one); wrong clicks within the minute are Poisson per picture.
 */
import { describe, expect, it } from 'vitest'
import { GENS, rnd } from './scenes.gen.js'
import { DIFFS, PER_FIND, PICTURES, POINTS_MS, clickArea, hitDiff, makePictures, pictureScore, runScore, wrongCost, wrongCosts, type Picture, type PictureResult } from './scoring'

type Rng = () => number
const PER_SCENE = 24
// a fixed pool of pictures per scene (built once, seeded), so the simulations below stay fast
const pool: Picture[][] = GENS.map(() => [])
for (let s = 1; pool.some((p) => p.length < PER_SCENE); s++)
  for (const p of makePictures(rnd(s))) {
    const gi = GENS.findIndex((g) => g.name === p.scene)
    if (pool[gi].length < PER_SCENE) pool[gi].push(p)
  }

const exp = (r: Rng) => -Math.log(1 - r())
const pois = (m: number, r: Rng) => { let k = 0, t = exp(r); while (t < m) { k++; t += exp(r) } return k }
const stats = (xs: number[]) => {
  const s = xs.slice().sort((a, b) => a - b), m = xs.reduce((a, b) => a + b, 0) / xs.length
  return { mean: m, sd: Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length), p10: s[Math.floor(xs.length * 0.1)], p90: s[Math.floor(xs.length * 0.9)] }
}
type Cost = (from: number, n: number) => number

interface Player { skill: number; slips: number }
const weak: Player = { skill: 0.6, slips: 0.8 }, avg: Player = { skill: 1, slips: 0.4 }, strong: Player = { skill: 1.6, slips: 0.2 }
const findTimes = (p: Picture, pl: Player, r: Rng) => p.diffs.map((d) => exp(r) / ((pl.skill * Math.sqrt(Math.min(d.b[2] * d.b[3], 400)) / 90) * (d.easy ? 1.5 : 1)))
const playPic = (p: Picture, pl: Player, r: Rng, wrongBefore: number, cost: Cost): PictureResult => {
  const T = findTimes(p, pl, r)
  const found = T.filter((t) => t < 60).length
  const wrong = pois(pl.slips, r)
  return { scene: p.scene, found, leftMs: found === DIFFS ? POINTS_MS - Math.max(...T) * 1000 : null, wrong, penalty: cost(wrongBefore, wrong), skipped: false }
}
const drawRun = (r: Rng) => shuffled(r).slice(0, PICTURES).map((gi) => pool[gi][Math.floor(r() * PER_SCENE)])
const shuffled = (r: Rng) => { const a = [...GENS.keys()]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
const run = (pl: Player, r: Rng, cost: Cost = wrongCosts, pics = drawRun(r)) => {
  const rs: PictureResult[] = []
  let w = 0
  for (const p of pics) { const x = playPic(p, pl, r, w, cost); w += x.wrong; rs.push(x) }
  return runScore(rs)
}
const many = (n: number, f: () => number) => stats(Array.from({ length: n }, f))
const best10 = (n: number, f: () => number) => stats(Array.from({ length: n }, () => Math.max(...Array.from({ length: 10 }, f)))).mean

/** A random clicker: `n` random clicks per picture within the minute, in either picture (both map to the same scene units). */
const randomRun = (n: number, r: Rng, cost: Cost = wrongCosts) => {
  let tot = 0, w = 0
  for (const p of drawRun(r)) {
    const f = Array(DIFFS).fill(false)
    for (let c = 0; c < n; c++) {
      const k = hitDiff(p.diffs, r() * 120, r() * 90, f)
      if (k >= 0) { f[k] = true; tot += PER_FIND } else { tot -= cost(w, 1); w++ }
    }
  }
  return Math.max(0, tot)
}

describe('review: random setups', () => {
  const inter = (a: number[], b: number[]) => Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]))
  it('no two real boxes overlap, the first 4 centres are ≥ 14 units apart, the free 5th overlaps no click area, every change is reachable', () => {
    let clickOverlaps = 0
    for (const pics of pool) for (const p of pics) {
      p.diffs.forEach((d, i) => {
        const [x, y, w, h] = d.b
        expect(hitDiff(p.diffs, x + w / 2, y + h / 2)).toBe(i) // its centre hits it
        // still reachable when all the others are found (a found box can't swallow it)
        const skip = p.diffs.map((_, j) => j !== i)
        expect(hitDiff(p.diffs, x + w / 2, y + h / 2, skip)).toBe(i)
        p.diffs.forEach((e, j) => {
          if (j <= i) return
          expect(inter(d.b, e.b)).toBe(0)
          // the first 4 keep centres ≥ 14 apart; the free 5th only may not overlap a click area
          if (j < p.diffs.length - 1) expect(Math.hypot(x + w / 2 - e.b[0] - e.b[2] / 2, y + h / 2 - e.b[1] - e.b[3] / 2)).toBeGreaterThanOrEqual(14)
          else expect(inter(clickArea(d.b), clickArea(e.b))).toBe(0)
          if (inter(clickArea(d.b), clickArea(e.b)) > 0) clickOverlaps++
        })
      })
    }
    // click areas touch now and then (≈ 0.1 per picture); the nearest real box wins there, which is fine
    expect(clickOverlaps / (GENS.length * PER_SCENE)).toBeLessThan(0.3)
  })
})

describe('review: degenerate strategies', () => {
  it('random clicking scores about 0: mean and best of 10 runs (current growing cost)', () => {
    const r = rnd(101)
    const out = [1, 2, 5, 20].map((n) => ({ n, mean: many(400, () => randomRun(n, r)).mean, best10: best10(80, () => randomRun(n, r)) }))
    console.log('random clicker (clicks per picture → mean, best of 10)', out)
    for (const o of out) expect(o.best10).toBeLessThan(PER_FIND) // at most one lucky find survives the costs
  })

  it('a grid sweep (every 8 units) within the minute ends at 0', () => {
    const p = pool[0][0], f = Array(DIFFS).fill(false)
    let tot = 0, w = 0
    for (let x = 4; x < 120; x += 8) for (let y = 4; y < 90; y += 8) {
      const k = hitDiff(p.diffs, x, y, f)
      if (k >= 0) { f[k] = true; tot += PER_FIND } else tot -= wrongCost(++w)
    }
    expect(Math.max(0, tot)).toBe(0)
  })

  it('a find is counted once: a second click on it (either picture) hits nothing and is free', () => {
    const p = pool[3][0], [x, y, w, h] = p.diffs[0].b, found = [true, false, false, false, false]
    expect(hitDiff(p.diffs, x + w / 2, y + h / 2, found)).toBe(-1)
    // the component treats it as free because the same click without `skip` hits a change
    expect(hitDiff(p.diffs, x + w / 2, y + h / 2)).toBe(0)
  })
})

describe('review (applied): wrong-click cost capped (now at 20, a find)', () => {
  it('10 / 15 / 20 wrong clicks in a run cost 151 / 251 / 351 points (uncapped +10 each: 501 / 1301 / 2601)', () => {
    expect([wrongCosts(0, 10), wrongCosts(0, 15), wrongCosts(0, 20)]).toEqual([151, 251, 351])
  })

  it('an honest player who finds 16 of 25 with 3 wrong clicks per picture keeps 69 points (was 0 uncapped)', () => {
    const rs: PictureResult[] = []
    let w = 0
    for (let i = 0; i < PICTURES; i++) { rs.push({ scene: 's', found: i === 0 ? 4 : 3, leftMs: null, wrong: 3, penalty: wrongCosts(w, 3), skipped: false }); w += 3 }
    expect(runScore(rs)).toBe(69)
  })

  it('model: weak but sloppy players stay well above 0; random clicking stays at about 0', () => {
    const r = rnd(202)
    const sloppy = [1, 2, 3].map((slips) => ({ slips, s: many(300, () => run({ skill: 0.6, slips }, r)) }))
    console.log('weak skill, wrong clicks per picture → mean, p10', sloppy.map((x) => ({ slips: x.slips, mean: Math.round(x.s.mean), p10: x.s.p10 })))
    const random = [1, 5, 20].map((n) => best10(80, () => randomRun(n, r)))
    console.log('random clicker best of 10', random)
    expect(sloppy[2].s.mean).toBeGreaterThan(130)
    for (const b of random) expect(b).toBeLessThan(PER_FIND) // at most one lucky find
  })
})

describe('review: luck vs skill (model)', () => {
  it('same player, 500 runs: spread as a share of the weak–strong gap; how much of it is the picture draw', () => {
    const r = rnd(303)
    const w = many(500, () => run(weak, r)), a = many(500, () => run(avg, r)), s = many(500, () => run(strong, r))
    const fixed = drawRun(rnd(9))
    const aFixed = many(500, () => run(avg, r, wrongCosts, fixed))
    const gap = s.mean - w.mean
    const out = { weak: w, avg: a, strong: s, gap, sdRatio: a.sd / gap, p10p90Ratio: (a.p90 - a.p10) / gap, sdFixedPictures: aFixed.sd, drawShareOfVariance: 1 - aFixed.sd ** 2 / a.sd ** 2 }
    console.log('luck vs skill', out)
    expect(out.sdRatio).toBeGreaterThan(0.2)
    expect(out.sdRatio).toBeLessThan(0.35)
  })

  it('scene difficulty (box size only): mean picture points of an average player per scene', () => {
    const r = rnd(404)
    const per = GENS.map((g, gi) => ({ scene: g.name, pts: stats(Array.from({ length: 1200 }, (_, k) => pictureScore(playPic(pool[gi][k % PER_SCENE], { ...avg, slips: 0 }, r, 0, wrongCosts)))).mean }))
    per.sort((x, y) => x.pts - y.pts)
    const hard5 = per.slice(0, 5).reduce((t, x) => t + x.pts, 0), easy5 = per.slice(-5).reduce((t, x) => t + x.pts, 0)
    console.log('per scene', per.map((x) => `${x.scene} ${x.pts.toFixed(1)}`).join(' · '), '| 5 hardest vs 5 easiest scenes:', hard5.toFixed(0), easy5.toFixed(0))
    expect(easy5 - hard5).toBeLessThan(40)
  })

  it('tiny changes per picture vary by scene (0.25 – 0.84) and a tiny one costs points: picture points with 0 vs 1 tiny change', () => {
    const r = rnd(505)
    const by: number[][] = [[], []]
    for (const pics of pool) for (const p of pics) {
      const t = p.diffs.filter((d) => d.b[2] * d.b[3] < 16).length
      for (let k = 0; k < 20; k++) by[t].push(pictureScore(playPic(p, { ...avg, slips: 0 }, r, 0, wrongCosts)))
    }
    console.log('avg player picture points: no tiny', stats(by[0]).mean.toFixed(1), '· one tiny', stats(by[1]).mean.toFixed(1), '· share with one tiny', (by[1].length / (by[0].length + by[1].length)).toFixed(2))
  })

  it('answering style: cautious vs bold (finds 15 % faster, 0.6 more wrong clicks per picture): mean and mean best of 10', () => {
    const r = rnd(606)
    const bold = { skill: 1.15, slips: 1.0 }
    const out = { cautious: [many(400, () => run(avg, r)).mean, best10(100, () => run(avg, r))], bold: [many(400, () => run(bold, r)).mean, best10(100, () => run(bold, r))] }
    console.log('style (mean, best of 10)', out)
    expect(Math.abs(out.cautious[1] - out.bold[1])).toBeLessThan(25)
  })

  it('early vs late mistakes: two extra wrong clicks cost the same in picture 1 or picture 5 (cost depends only on the count)', () => {
    const base = (at: number) => runScore(Array.from({ length: PICTURES }, (_, i) => ({ scene: 's', found: 5, leftMs: 30_000, wrong: i === at ? 3 : 1, penalty: 0, skipped: false })).map((r, i, a) => ({ ...r, penalty: wrongCosts(a.slice(0, i).reduce((s, x) => s + x.wrong, 0), r.wrong) })))
    expect(base(0)).toBe(base(4))
  })
})

describe('review: edges', () => {
  it('whole seconds: the 5th find with 0.9 s left gives no bonus; 4 finds never give one; an empty run is 0', () => {
    expect(pictureScore({ scene: 's', found: 5, leftMs: 900, wrong: 0, penalty: 0, skipped: false })).toBe(100)
    expect(pictureScore({ scene: 's', found: 4, leftMs: 30_000, wrong: 0, penalty: 0, skipped: false })).toBe(80)
    expect(runScore([])).toBe(0)
  })
})
