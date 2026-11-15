/**
 * Scoring review of Eye for Geometry (2026-11-15). Seeded simulations on the pure functions.
 * Numbers in the report come from the console output of these tests (run: npx vitest run src/tests/geometry).
 */
import { describe, expect, it } from 'vitest'
import type { Rand } from '../../lib/random'
import {
  TASK_GROUPS, TASK_MAKERS, angleDiff, angleTo, clampToRange, closestOnPath, dist, makeTasks, matchSize, pathMiddle,
  resultDetails, setAngle, anglePercent, totalScore, type Answer, type Evaluation, type Pt, type Shape, type Task,
} from './scoring'

// ---------- tools ----------
const seeded = (seed: number): Rand => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const gauss = (rand: Rand) => () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand())
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
const sd = (xs: number[]) => { const m = avg(xs); return Math.sqrt(avg(xs.map((x) => (x - m) ** 2))) }
const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))] }
const r1 = (x: number) => Math.round(x * 10) / 10
const r2 = (x: number) => Math.round(x * 100) / 100
const KINDS = TASK_MAKERS.map((m) => m(seeded(1)).kind)
const makerOf = Object.fromEntries(TASK_MAKERS.map((m) => [m(seeded(1)).kind, m]))

const dotOf = (ev: Evaluation) => (ev.solution.filter((s) => s.t === 'dot').at(-1) as Extract<Shape, { t: 'dot' }>).p
const ringR = (ev: Evaluation) => (ev.zone![0] as Extract<Shape, { t: 'circle' }>).r
function pointAlong(pts: Pt[], s: number): Pt {
  for (let i = 0; i < pts.length - 1; i++) {
    const len = dist(pts[i], pts[i + 1])
    if (s <= len) return { x: pts[i].x + ((pts[i + 1].x - pts[i].x) * s) / len, y: pts[i].y + ((pts[i + 1].y - pts[i].y) * s) / len }
    s -= len
  }
  return pts[pts.length - 1]
}

/**
 * The right answer of a task plus the scale a human error is measured in:
 * - point tasks: the distance the player judges across (arc: radius, dots: radius, balance: mean vertex distance,
 *   crossing: the lines' gap, square: side, mirror: the line-to-dot distance h)
 * - zigzag: half the line's length (the player compares the two halves)
 */
function truth(t: Task) {
  const ev = t.evaluate({ point: { x: 0, y: 0 }, angle: 0, length: 10 })
  switch (t.kind) {
    case 'center': case 'equidistant': return { p: dotOf(ev), scale: ringR(ev) / 0.3 }
    case 'balance': {
      const g = dotOf(ev), poly = t.shapes[0] as Extract<Shape, { t: 'poly' }>
      return { p: g, scale: avg(poly.pts.map((q) => dist(q, g))) }
    }
    case 'meet': return { p: dotOf(ev), scale: ringR(ev) / 0.5 }
    case 'square': return { p: dotOf(ev), scale: ringR(ev) / 0.25 }
    case 'mirror': return { p: dotOf(ev), scale: ringR(ev) / 0.7 }
    default: return { p: { x: 0, y: 0 }, scale: 1 }
  }
}

/** Noise of one player for one task: positions (fraction of the judged distance), angles (deg), lengths / areas (fraction). */
interface Noise { pos: number; ang: number; len: number }

function humanAnswer(t: Task, n: Noise, g: () => number, rand: Rand): Answer {
  switch (t.kind) {
    case 'center': case 'equidistant': case 'balance': case 'meet': case 'square': case 'mirror': {
      const { p, scale } = truth(t)
      return { point: { x: p.x + g() * n.pos * scale, y: p.y + g() * n.pos * scale } }
    }
    case 'middle': {
      const pts = (t.shapes[0] as Extract<Shape, { t: 'polyline' }>).pts
      const { total } = pathMiddle(pts)
      const s = Math.min(total, Math.max(0, total / 2 + g() * n.len * (total / 2)))
      return { point: pointAlong(pts, s) }
    }
    case 'set-angle': {
      const base = (t.shapes[0] as Extract<Shape, { t: 'ray' }>).angle, target = Number(t.title.match(/\d+/)![0])
      return { angle: base + (rand() < 0.5 ? -1 : 1) * (target + g() * n.ang) }
    }
    case 'angle-pct': {
      const goal = (t.evaluate({ angle: 0 }).solution[0] as Extract<Shape, { t: 'ray' }>).angle
      return { angle: clampToRange(goal + g() * n.ang, t.range!) }
    }
    case 'parallel': {
      const s = t.shapes[0] as Extract<Shape, { t: 'seg' }>
      return { angle: angleTo(s.a, s.b) + (rand() < 0.5 ? 0 : 180) + g() * n.ang }
    }
    case 'copy-length': {
      const s = t.shapes[0] as Extract<Shape, { t: 'seg' }>
      return { length: Math.max(0, dist(s.a, s.b) * (1 + g() * n.len)) }
    }
    case 'size': {
      const sol = t.evaluate({ length: 10 }).solution[0] as Extract<Shape, { t: 'poly' }>
      const goal = dist(sol.pts[0], { x: 70, y: 50 })
      // area off by a factor e^(N(0, len)): the width by half that; the handle stops at 3 and 25
      return { length: Math.min(25, Math.max(3, goal * Math.exp((g() * n.len) / 2))) }
    }
  }
  throw new Error(t.kind)
}

const BASE: Noise = { pos: 0.08, ang: 4, len: 0.08 }
const scaled = (n: Noise, k: number): Noise => ({ pos: n.pos * k, ang: n.ang * k, len: n.len * k })
const SLIP = 0.05 // chance per task of a sloppy answer (3× the noise)
const PLAYERS = { weak: 1.6, average: 1, strong: 0.6 }

function playTask(t: Task, noise: Noise, rand: Rand, g: () => number) {
  const n = rand() < SLIP ? scaled(noise, 3) : noise
  return t.evaluate(humanAnswer(t, n, g, rand)).points
}

/** Per-task noise; `perKind` overrides the default for single kinds (calibrated model). */
function simulateRuns(k: number, runs: number, seed: number, perKind?: Record<string, Noise>) {
  const rand = seeded(seed), g = gauss(rand)
  const scores: number[] = [], draws: string[][] = []
  for (let i = 0; i < runs; i++) {
    const tasks = makeTasks(rand)
    scores.push(totalScore(tasks.map((t) => playTask(t, scaled(perKind?.[t.kind] ?? BASE, k), rand, g))))
    draws.push(tasks.map((t) => t.kind))
  }
  return { scores, draws }
}

function perKindMeans(k: number, n: number, seed: number, perKind?: Record<string, Noise>) {
  const rand = seeded(seed), g = gauss(rand)
  const out: Record<string, { mean: number; sd: number }> = {}
  for (const kind of KINDS) {
    const pts = Array.from({ length: n }, () => playTask(makerOf[kind](rand), scaled(perKind?.[kind] ?? BASE, k), rand, g))
    out[kind] = { mean: r1(avg(pts)), sd: r1(sd(pts)) }
  }
  return out
}

/** The user's own per-task averages (10 older runs, one player). */
const USER: Record<string, number> = {
  'set-angle': 95, balance: 86, meet: 84, parallel: 84, square: 82, equidistant: 78, mirror: 77, 'angle-pct': 77,
  'copy-length': 72, center: 71, middle: 65, size: 51,
}

/** Finds, per kind, the noise multiplier at which the average player (incl. slips) scores the user's average. */
function calibrate(): Record<string, Noise> {
  const out: Record<string, Noise> = {}
  for (const kind of KINDS) {
    let lo = 0.01, hi = 10
    for (let it = 0; it < 30; it++) {
      const mid = Math.sqrt(lo * hi)
      const rand = seeded(77), g = gauss(rand)
      const m = avg(Array.from({ length: 600 }, () => playTask(makerOf[kind](rand), scaled(BASE, mid), rand, g)))
      if (m > USER[kind]) lo = mid; else hi = mid
    }
    out[kind] = scaled(BASE, Math.sqrt(lo * hi))
  }
  return out
}

function spreadReport(label: string, perKind?: Record<string, Noise>) {
  const res = Object.fromEntries(Object.entries(PLAYERS).map(([name, k]) => [name, simulateRuns(k, 1000, 11, perKind)]))
  const means = Object.fromEntries(Object.entries(res).map(([n, r]) => [n, avg(r.scores)]))
  const gap = means.strong - means.weak
  const a = res.average.scores
  // how much of the average player's spread comes from which kinds are drawn
  const kindMean = perKindMeans(1, 3000, 5, perKind)
  const drawMeans = res.average.draws.map((d) => avg(d.map((kind) => kindMean[kind].mean)))
  const drawShare = sd(drawMeans) ** 2 / sd(a) ** 2
  const summary = {
    label,
    weak: r1(means.weak), average: r1(means.average), strong: r1(means.strong), gap: r1(gap),
    averageP10: pct(a, 0.1), averageP90: pct(a, 0.9), averageSD: r2(sd(a)),
    sdShareOfGap: r2(sd(a) / gap), p10p90ShareOfGap: r2((pct(a, 0.9) - pct(a, 0.1)) / gap),
    drawSD: r2(sd(drawMeans)), varianceFromDraw: r2(drawShare),
  }
  return { summary, kindMean }
}

// ---------- 1. degenerate strategies ----------
describe('review: degenerate strategies per task', () => {
  const N = 3000
  const stats = (pts: number[]) => ({ mean: r1(avg(pts)), over0: r2(pts.filter((p) => p > 0).length / pts.length), over50: r2(pts.filter((p) => p > 50).length / pts.length) })
  const run = (kind: string, answer: (t: Task) => Answer, seed = 3) => {
    const rand = seeded(seed)
    return stats(Array.from({ length: N }, () => { const t = makerOf[kind](rand); return t.evaluate(answer(t)).points }))
  }
  const centre = { point: { x: 50, y: 50 } }
  const bboxCentre = (pts: Pt[]) => {
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y)
    return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 }
  }
  const vertexAvg = (pts: Pt[]) => ({ x: avg(pts.map((p) => p.x)), y: avg(pts.map((p) => p.y)) })

  it('prints what each shortcut scores (mean points, share > 0, share > 50)', () => {
    const out: Record<string, unknown> = {}
    for (const kind of ['center', 'equidistant', 'balance', 'meet', 'square', 'mirror']) out[`${kind}: board centre`] = run(kind, () => centre)
    out['middle: board centre (snapped)'] = run('middle', (t) => ({ point: t.snap!({ x: 50, y: 50 }) }))
    out['middle: middle of the middle section / middle bend'] = run('middle', (t) => {
      const pts = (t.shapes[0] as Extract<Shape, { t: 'polyline' }>).pts, n = pts.length - 1
      return { point: n % 2 ? { x: (pts[(n - 1) / 2].x + pts[(n + 1) / 2].x) / 2, y: (pts[(n - 1) / 2].y + pts[(n + 1) / 2].y) / 2 } : pts[n / 2] }
    })
    out['middle: half the bends (vertex average, snapped)'] = run('middle', (t) => ({ point: t.snap!(vertexAvg((t.shapes[0] as Extract<Shape, { t: 'polyline' }>).pts)) }))
    out['equidistant: average of the 3 dots (centroid)'] = run('equidistant', (t) => ({ point: vertexAvg(t.shapes.map((s) => (s as Extract<Shape, { t: 'dot' }>).p)) }))
    out['equidistant: bounding-box centre'] = run('equidistant', (t) => ({ point: bboxCentre(t.shapes.map((s) => (s as Extract<Shape, { t: 'dot' }>).p)) }))
    out['balance: bounding-box centre'] = run('balance', (t) => ({ point: bboxCentre((t.shapes[0] as Extract<Shape, { t: 'poly' }>).pts) }))
    out['meet: midpoint of the two near ends'] = run('meet', (t) => {
      const [a, b] = t.shapes as Extract<Shape, { t: 'seg' }>[]
      return { point: { x: (a.b.x + b.b.x) / 2, y: (a.b.y + b.b.y) / 2 } }
    })
    out['set-angle: keep the start (click on the arm)'] = run('set-angle', (t) => t.initial!)
    out['angle-pct: keep the start (100 %)'] = run('angle-pct', (t) => t.initial!)
    out['angle-pct: always the middle of the angle (50 %)'] = run('angle-pct', (t) => ({ angle: t.range!.from + t.range!.span / 2 }))
    out['parallel: keep the start'] = run('parallel', (t) => t.initial!)
    out['copy-length: keep the start'] = run('copy-length', (t) => t.initial!)
    // best constant length, found by trying 10…60
    let bestC = { c: 0, mean: -1 }
    for (let c = 10; c <= 60; c++) { const m = run('copy-length', () => ({ length: c })).mean; if (m > bestC.mean) bestC = { c, mean: m } }
    out['copy-length: best fixed length'] = bestC
    out['size: keep the start'] = run('size', (t) => t.initial!)
    out['size: same width as the left shape (naive)'] = run('size', (t) => {
      const p = (t.shapes[0] as Extract<Shape, { t: 'poly' }>).pts
      return { length: Math.min(25, dist(p[0], { x: 26, y: 50 })) }
    })
    out['size: drag to the largest size (25)'] = run('size', () => ({ length: 25 }))
    let bestS = { c: 0, mean: -1 }
    for (let c = 3; c <= 25; c += 0.5) { const m = run('size', () => ({ length: c })).mean; if (m > bestS.mean) bestS = { c, mean: m } }
    out['size: best fixed size'] = bestS
    for (const [k, v] of Object.entries(out)) console.log('DEGENERATE', k, JSON.stringify(v))
    // honest players for comparison (model B, calibrated to the user's averages)
    const weak = perKindMeans(PLAYERS.weak, 2000, 6, calibrate())
    console.log('WEAK HONEST PLAYER per task', JSON.stringify(Object.fromEntries(Object.entries(weak).map(([k, v]) => [k, v.mean]))))
    // a whole run with the best shortcut per task (no judging at all), compared with the weak honest player's run
    const best: Record<string, number> = {}
    for (const [k, v] of Object.entries(out)) {
      const kind = k.split(':')[0], m = (v as { mean: number }).mean
      if (!k.includes('average of the 3 dots')) best[kind] = Math.max(best[kind] ?? 0, m) // the dots' centroid still takes judging
    }
    console.log('BEST NO-SKILL SHORTCUT per task', JSON.stringify(best), 'expected run score', r1(avg(KINDS.map((k) => best[k] ?? 0))))
  })

  // Fixed 2026-11-15 (was a known issue in the review).
  it('FINDING: in Match the size the start can already score well, because the start is capped at the handle limit 25', () => {
    const rand = seeded(9)
    const startPts: number[] = [], capped: number[] = []
    for (let i = 0; i < 5000; i++) {
      const t = matchSize(rand)
      const p = t.evaluate(t.initial!).points
      startPts.push(p)
      if (t.initial!.length === 25) capped.push(p)
    }
    const share = (xs: number[], f: (x: number) => boolean) => r2(xs.filter(f).length / xs.length)
    console.log('SIZE START', JSON.stringify({
      startMean: r1(avg(startPts)), startOver0: share(startPts, (p) => p > 0), startOver50: share(startPts, (p) => p > 50),
      cappedShare: r2(capped.length / startPts.length), cappedMean: r1(avg(capped)), cappedOver80: share(capped, (p) => p > 80),
    }))
    // Fails on purpose if Done right away can score more than 50 % in over 1 % of the tasks
    expect(share(startPts, (p) => p > 50)).toBeLessThan(0.01)
  })

  it('FINDING: Match the size, the handle stops at 25, so "too big" can be impossible for big goals', () => {
    const rand = seeded(10)
    let blocked = 0, total = 0
    const goals: number[] = []
    for (let i = 0; i < 5000; i++) {
      const t = matchSize(rand)
      const sol = t.evaluate({ length: 10 }).solution[0] as Extract<Shape, { t: 'poly' }>
      const goal = dist(sol.pts[0], { x: 70, y: 50 })
      goals.push(goal)
      total++
      if (goal * Math.exp(0.3) > 25) blocked++ // the 0 % "too big" outline is past what the handle can reach
    }
    console.log('SIZE CAP', JSON.stringify({ shareGoalNearCap: r2(blocked / total), goalMax: r1(Math.max(...goals)), goalP90: r1(pct(goals, 0.9)) }))
  })
})

// ---------- 2. generation ----------
describe('review: round generation over many seeds', () => {
  it('no maker loops long; all answers and figures stay on the board', () => {
    const report: Record<string, unknown> = {}
    for (const make of TASK_MAKERS) {
      let maxCalls = 0, offBoard = 0
      let kind = ''
      for (let s = 0; s < 20000; s++) {
        const base = seeded(1000 + s)
        let calls = 0
        const t = make(() => { calls++; return base() })
        kind = t.kind
        maxCalls = Math.max(maxCalls, calls)
        const ev = t.evaluate({ point: { x: 50, y: 50 }, angle: 0, length: 10 })
        const dots = ev.solution.filter((x) => x.t === 'dot').map((x) => (x as Extract<Shape, { t: 'dot' }>).p)
        if (dots.some((p) => p.x < 2 || p.x > 98 || p.y < 2 || p.y > 98)) offBoard++
      }
      report[kind] = { maxRandCalls: maxCalls, solutionDotOffBoard: offBoard }
    }
    console.log('GENERATION', JSON.stringify(report))
    expect(Object.values(report).every((r) => (r as { solutionDotOffBoard: number }).solutionDotOffBoard === 0)).toBe(true)
  })

  // Fixed 2026-11-15 (was a known issue in the review).
  it('zigzag: how close the line comes to itself (non-neighbouring sections), and snapping at the true middle', () => {
    const segDist = (a: Pt, b: Pt, c: Pt, d: Pt) => {
      const pd = (p: Pt, u: Pt, v: Pt) => closestOnPath([u, v], p).d
      return Math.min(pd(a, c, d), pd(b, c, d), pd(c, a, b), pd(d, a, b))
    }
    const rand = seeded(12)
    const gaps: number[] = []
    let snapWrong = 0
    for (let i = 0; i < 5000; i++) {
      const t = makerOf.middle(rand)
      const pts = (t.shapes[0] as Extract<Shape, { t: 'polyline' }>).pts
      let g = Infinity
      for (let a = 0; a < pts.length - 1; a++) for (let b = a + 2; b < pts.length - 1; b++) g = Math.min(g, segDist(pts[a], pts[a + 1], pts[b], pts[b + 1]))
      gaps.push(g)
      if (t.evaluate({ point: t.snap!(pathMiddle(pts).mid) }).points !== 100) snapWrong++
    }
    const finite = gaps.filter(Number.isFinite)
    console.log('ZIGZAG', JSON.stringify({ withNonNeighbours: finite.length, closestUnder3: finite.filter((x) => x < 3).length, closestUnder5: finite.filter((x) => x < 5).length, min: r2(Math.min(...finite)), snapWrong }))
    expect(snapWrong).toBe(0)
    // FINDING (fails on purpose): about 2 % of zigzags pass within 3 units of themselves, so they look touching or crossing
    expect(finite.filter((x) => x < 3).length).toBe(0)
  })
})

// ---------- 3. luck vs skill ----------
describe('review: luck vs skill over whole runs (1000 runs per player)', () => {
  it('model A: the same relative noise for every task of a skill (position 8 %, angle 4°, length / area 8 %)', () => {
    const { summary, kindMean } = spreadReport('A: uniform noise')
    const ranked = Object.entries(kindMean).sort((a, b) => b[1].mean - a[1].mean).map(([k, v]) => `${k} ${v.mean} (sd ${v.sd}, user ${USER[k]})`)
    console.log('MODEL A', JSON.stringify(summary), '\nA ranked:', ranked.join(' | '))
  })

  it('model B: noise per task calibrated so the average player matches the user’s own averages', () => {
    const perKind = calibrate()
    const mult = Object.fromEntries(Object.entries(perKind).map(([k, n]) => [k, r2(n.pos / BASE.pos)]))
    const { summary, kindMean } = spreadReport('B: calibrated to user data', perKind)
    console.log('MODEL B', JSON.stringify(summary), '\nB per-kind noise multipliers vs model A:', JSON.stringify(mult),
      '\nB check means:', JSON.stringify(Object.fromEntries(Object.entries(kindMean).map(([k, v]) => [k, `${v.mean} sd ${v.sd}`]))))
    // what the user's averages mean as typical error, and what limit would put each task at ~75 %
    // (mean points m → mean error = tol × (1 − m/100); limit for 75 % = 4 × mean error, ignoring errors past the limit)
    const TOL: Record<string, [number, string]> = {
      middle: [8, '% of length'], center: [30, '% of radius'], 'set-angle': [25, '°'], 'angle-pct': [15, '°'], parallel: [10, '°'],
      square: [25, '% of side'], 'copy-length': [25, '% of length'], equidistant: [30, '% of radius'], balance: [12, '% of longest side'],
      meet: [50, '% of gap'], mirror: [35, '% of mirror distance'], size: [60, ' (ln area ×100)'],
    }
    const implied = Object.fromEntries(KINDS.map((k) => {
      const [tol, unit] = TOL[k], err = tol * (1 - USER[k] / 100)
      return [k, `now ${tol}${unit}, mean error ${r2(err)} → limit for 75 %: ${r1(4 * err)}`]
    }))
    for (const [k, v] of Object.entries(implied)) console.log('IMPLIED', k, v)
    // the tuning idea from the backlog: every task at ~75 % for the average player (a wider limit = less noise per limit)
    const USER75 = Object.fromEntries(KINDS.map((k) => [k, 75]))
    const saved = { ...USER }
    Object.assign(USER, USER75)
    const tuned = calibrate()
    Object.assign(USER, saved)
    const t = spreadReport('B tuned: every task ~75 % for the average player', tuned)
    console.log('MODEL B TUNED', JSON.stringify(t.summary), JSON.stringify(Object.fromEntries(Object.entries(t.kindMean).map(([k, v]) => [k, `${v.mean} sd ${v.sd}`]))))
  })

  it('more tasks: the same players with all 12 kinds once per run (model B)', () => {
    const perKind = calibrate()
    const res = Object.fromEntries(Object.entries(PLAYERS).map(([name, k]) => {
      const rand = seeded(13), g = gauss(rand)
      return [name, Array.from({ length: 1000 }, () => totalScore(KINDS.map((kind) => playTask(makerOf[kind](rand), scaled(perKind[kind], k), rand, g))))]
    }))
    const gap = avg(res.strong) - avg(res.weak)
    console.log('MODEL B 12 TASKS', JSON.stringify({ gap: r1(gap), averageSD: r2(sd(res.average)), sdShareOfGap: r2(sd(res.average) / gap), p10p90ShareOfGap: r2((pct(res.average, 0.9) - pct(res.average, 0.1)) / gap) }))
  })

  it('which group pairs are drawn matters: best and worst possible draw for the average player (model B)', () => {
    const kindMean = perKindMeans(1, 3000, 5, calibrate())
    const pairs = Object.entries(TASK_GROUPS).map(([group, makers]) => {
      const kinds = makers.map((m) => m(seeded(1)).kind)
      const pairMeans = [[0, 1], [0, 2], [1, 2]].map(([a, b]) => (kindMean[kinds[a]].mean + kindMean[kinds[b]].mean) / 2)
      return { group, lo: Math.min(...pairMeans), hi: Math.max(...pairMeans) }
    })
    const lo = avg(pairs.map((p) => p.lo)), hi = avg(pairs.map((p) => p.hi))
    console.log('DRAW RANGE', JSON.stringify({ pairs, worstDraw: r1(lo), bestDraw: r1(hi) }))
  })

  it('X % of the angle: a fixed 15° limit on angles of 50–160°, the same proportional error scores very differently', () => {
    const rand = seeded(21), g = gauss(rand)
    const narrow: number[] = [], wide: number[] = []
    for (let i = 0; i < 6000; i++) {
      const t = anglePercent(rand)
      const span = t.range!.span
      const goal = (t.evaluate({ angle: 0 }).solution[0] as Extract<Shape, { t: 'ray' }>).angle
      const p = t.evaluate({ angle: clampToRange(goal + g() * 0.06 * span, t.range!) }).points // 6 % of the angle
      if (span < 80) narrow.push(p)
      if (span > 130) wide.push(p)
    }
    console.log('ANGLE-PCT BY SPREAD', JSON.stringify({ spread50to80: r1(avg(narrow)), spread130to160: r1(avg(wide)) }))
  })

  it('Where the lines cross: the same aiming error per line costs more when the lines meet at a flat angle', () => {
    const rand = seeded(22), g = gauss(rand)
    const byCross: Record<string, number[]> = { '30-45°': [], '65-80°': [] }
    for (let i = 0; i < 6000; i++) {
      const t = makerOf.meet(rand)
      const [s1, s2] = t.shapes as Extract<Shape, { t: 'seg' }>[]
      const turn = angleDiff(angleTo(s1.a, s1.b), angleTo(s2.a, s2.b), 180)
      // extend each line with a 2° aiming error and click where the two extended lines cross
      const a1 = angleTo(s1.a, s1.b) + g() * 2, a2 = angleTo(s2.a, s2.b) + g() * 2
      const d1 = { x: Math.cos((a1 * Math.PI) / 180), y: -Math.sin((a1 * Math.PI) / 180) }, d2 = { x: Math.cos((a2 * Math.PI) / 180), y: -Math.sin((a2 * Math.PI) / 180) }
      const den = d1.x * d2.y - d1.y * d2.x
      const k = ((s2.b.x - s1.b.x) * d2.y - (s2.b.y - s1.b.y) * d2.x) / den
      const p = t.evaluate({ point: { x: s1.b.x + d1.x * k, y: s1.b.y + d1.y * k } }).points
      if (turn < 45) byCross['30-45°'].push(p)
      if (turn > 65) byCross['65-80°'].push(p)
    }
    console.log('MEET BY CROSSING ANGLE', JSON.stringify(Object.fromEntries(Object.entries(byCross).map(([k, v]) => [k, r1(avg(v))]))))
  })
})

// ---------- 4–5. edge cases, zones, details ----------
describe('review: zones, rounding and details', () => {
  it('Make X°: where the drawn 0 % lines are not the 0 % limit (targets near 0° or 180°)', () => {
    const rand = seeded(31)
    const wrong: Record<string, number[]> = {}
    for (let i = 0; i < 4000; i++) {
      const t = setAngle(rand)
      const target = Number(t.title.match(/\d+/)![0])
      const base = (t.shapes[0] as Extract<Shape, { t: 'ray' }>).angle
      const ev = t.evaluate({ angle: base + target })
      for (const z of ev.zone!) {
        const p = t.evaluate({ angle: (z as Extract<Shape, { t: 'ray' }>).angle }).points
        if (p > 0) (wrong[target < 90 ? 'below 0°' : 'past 180°'] ??= []).push(p)
      }
    }
    console.log('SET-ANGLE ZONE', JSON.stringify(Object.fromEntries(Object.entries(wrong).map(([k, v]) => [k, { lines: v.length, maxPoints: Math.max(...v) }]))))
  })

  it('every point / length zone sits exactly at the 0 % limit (Match the size outlines included)', () => {
    const rand = seeded(32)
    for (let i = 0; i < 2000; i++) {
      const t = matchSize(rand)
      const ev = t.evaluate({ length: 10 })
      const [small, big] = ev.zone as Extract<Shape, { t: 'poly' }>[]
      const rOf = (s: Extract<Shape, { t: 'poly' }>) => dist(s.pts[0], { x: 70, y: 50 })
      expect(t.evaluate({ length: rOf(small) * 1.001 }).points).toBeGreaterThanOrEqual(0)
      expect(t.evaluate({ length: rOf(small) * 0.99 }).points).toBe(0)
      expect(t.evaluate({ length: rOf(big) * 1.01 }).points).toBe(0)
      expect(t.evaluate({ length: rOf(big) * 0.98 }).points).toBeGreaterThan(0)
    }
    for (let i = 0; i < 2000; i++) {
      const t = makerOf['copy-length'](rand)
      const L = dist((t.shapes[0] as Extract<Shape, { t: 'seg' }>).a, (t.shapes[0] as Extract<Shape, { t: 'seg' }>).b)
      expect(t.evaluate({ length: L * 0.749 }).points).toBe(0)
      expect(t.evaluate({ length: L * 1.251 }).points).toBe(0)
      expect(t.evaluate({ length: L * 0.76 }).points).toBeGreaterThan(0)
    }
    for (let i = 0; i < 2000; i++) {
      const t = makerOf.middle(rand)
      const pts = (t.shapes[0] as Extract<Shape, { t: 'polyline' }>).pts
      const { total } = pathMiddle(pts)
      expect(t.evaluate({ point: pointAlong(pts, total * 0.419) }).points).toBe(0)
      expect(t.evaluate({ point: pointAlong(pts, total * 0.43) }).points).toBeGreaterThan(0)
    }
  })

  it('details: the chips average to the score, names are the short names, the score keeps 1 decimal', () => {
    const rand = seeded(33), g = gauss(rand)
    for (let i = 0; i < 300; i++) {
      const tasks = makeTasks(rand)
      const results = tasks.map((task) => ({ task, ev: task.evaluate(humanAnswer(task, BASE, g, rand)) }))
      const score = totalScore(results.map((r) => r.ev.points))
      const d = resultDetails(results)
      const chipVals = d.chips!.items.map((c) => Number(String(c.value).replace(' %', '')))
      expect(Math.abs(avg(chipVals) - score)).toBeLessThanOrEqual(0.05 + 1e-9)
      expect(Number(score.toFixed(1))).toBe(score)
      expect(Number.isFinite(score)).toBe(true)
    }
  })
})
