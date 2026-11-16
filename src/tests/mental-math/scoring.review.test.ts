/**
 * Scoring review of the reworked Quick Maths (2026-11-15). Seeded simulations on the pure functions.
 * Numbers in the report come from the console output of these tests (run: npx vitest run src/tests/mental-math).
 *
 * Human model (a heuristic, not data): time = read + type (0.7 s + 0.2 s per answer digit, the same for everyone)
 * + compute × skill × lognormal noise (σ 0.25). Compute is built from 1-digit facts with a problem-size effect
 * (+ fact 0.3 s + 0.02 × (a + b), × fact 0.35 s + 0.025 × a × b), column work (copy 0.15 s, carry 0.4 s,
 * borrow 0.6 s, − is "adding up" × 1.2), 2-digit × 1-digit = two facts + adding the parts, 11–15 × 11–15 =
 * 10x + x × ones, ÷ = 1.3 × the matching ×. Error chance 2 % + 3 % per second of compute.
 * Skill: strong 0.6, average 1.0, weak 1.6 (compute time factor).
 */
import { describe, expect, it } from 'vitest'
import type { Rand } from '../../lib/random'
import { DURATION_MS, MAX_LEVEL, OPS, levelFor, makeOpQueue, makeProblem, problemKey, type Op, type Problem } from './scoring'

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
const gauss = (rand: Rand) => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand())
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
const sd = (xs: number[]) => { const m = avg(xs); return Math.sqrt(avg(xs.map((x) => (x - m) ** 2))) }
const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))] }
const r2 = (x: number) => Math.round(x * 100) / 100
const digitsOf = (x: number) => String(x).split('').map(Number).reverse()

// ---------- cost model (seconds of "compute" for skill 1.0) ----------
const addFact = (a: number, b: number) => (a === 0 || b === 0 ? 0.15 : 0.3 + 0.02 * (a + b))
const mulFact = (a: number, b: number) => (a === 1 || b === 1 ? 0.15 : 0.35 + 0.025 * a * b)
function addCost(x: number, y: number, borrow = false): number {
  const dx = digitsOf(x), dy = digitsOf(y)
  let t = 0, carry = 0
  for (let i = 0; i < Math.max(dx.length, dy.length); i++) {
    const a = dx[i] ?? 0, b = dy[i] ?? 0
    if (a && b) t += addFact(a, b)
    else t += carry ? 0.3 : 0.15
    if (carry) t += 0.1
    carry = a + b + carry >= 10 ? 1 : 0
    if (carry) t += borrow ? 0.6 : 0.4
  }
  return t
}
function mulCost(x: number, y: number): number {
  if (x < y) [x, y] = [y, x]
  if (x < 10) return mulFact(x, y)
  if (y < 10) { // 2-digit × 1-digit
    const t = Math.floor(x / 10), u = x % 10
    return mulFact(t, y) + mulFact(u, y) + addCost(t * y * 10, u * y)
  }
  const u = y % 10 // 11–15 × 11–15 = 10x + x × u
  return mulCost(x, u) + addCost(10 * x, x * u)
}
function computeCost({ a, b, op, answer }: Problem): number {
  switch (op) {
    case '+': return addCost(a, b)
    case '−': return 1.2 * addCost(answer, b, true)
    case '×': return mulCost(a, b)
    case '÷': return 1.3 * mulCost(answer, b)
  }
}

// ---------- run simulation ----------
interface Player { skill: number; noise?: number; errors?: boolean; skipAbove?: number }
const SKIP_COST = 0.8 // read, type "0", Enter
function simulateRun(player: Player, rand: Rand, timeRand: Rand = rand) {
  const { skill, noise = 0.25, errors = true, skipAbove } = player
  const ops = makeOpQueue(rand)
  const seen = new Set<string>()
  let prev: Problem | undefined
  let problem = makeProblem(0, ops.next(), seen, prev, rand)
  seen.add(problemKey(problem))
  let t = 0, correct = 0, wrong = 0
  for (;;) {
    const c = computeCost(problem)
    const skip = skipAbove !== undefined && c * skill > skipAbove
    const dt = skip ? SKIP_COST : 0.7 + 0.2 * String(problem.answer).length + c * skill * Math.exp(noise * gauss(timeRand))
    t += dt
    if (t > DURATION_MS / 1000) break
    const ok = !skip && !(errors && timeRand() < Math.min(0.5, 0.02 + 0.03 * c * skill))
    if (ok) correct++
    else { wrong++; ops.retry(problem.op) }
    prev = problem
    problem = makeProblem(levelFor(correct), ops.next(), seen, prev, rand)
    seen.add(problemKey(problem))
  }
  return { correct, wrong, level: levelFor(correct) }
}
const runs = (player: Player, n = 1000, seed = 1) => Array.from({ length: n }, (_, i) => simulateRun(player, seeded(seed + i * 7919)))
const SKILLS = { strong: 0.6, average: 1.0, weak: 1.6 }

describe('Quick Maths review: degenerate strategies', () => {
  it('spamming a wrong answer (typing 0 + Enter) scores 0; answers are never 0 or 1', () => {
    for (let level = 0; level <= MAX_LEVEL; level++)
      for (const op of OPS)
        for (let i = 0; i < 2000; i++) expect(makeProblem(level, op).answer).toBeGreaterThanOrEqual(2)
  })

  it('always typing the same number: best fixed answer hits only a few % per problem', () => {
    // Per level, the most frequent answer over all four operations (equal mix, as the blocks give).
    const out: string[] = []
    for (let level = 0; level <= MAX_LEVEL; level++) {
      const counts = new Map<number, number>()
      const n = 4000
      for (const op of OPS) for (let i = 0; i < n; i++) { const a = makeProblem(level, op, undefined, undefined, seeded(level * 1e6 + i * 4 + OPS.indexOf(op))).answer; counts.set(a, (counts.get(a) ?? 0) + 1) }
      const [best, k] = [...counts].sort((x, y) => y[1] - x[1])[0]
      out.push(`level ${level + 1}: "${best}" right ${r2((100 * k) / (4 * n))} %`)
    }
    console.log('[same answer]', out.join(' · '))
  })

  it('DEMONSTRATES: skipping hard problems by answering wrong (reroll) raises the score', () => {
    const table: string[] = []
    for (const [name, skill] of Object.entries(SKILLS)) {
      const honest = avg(runs({ skill }, 600).map((r) => r.correct))
      let best = { th: Infinity, score: honest, wrong: 0 }
      for (const th of [0.8, 1, 1.2, 1.5, 2, 2.5, 3, 4, 5]) {
        const rs = runs({ skill, skipAbove: th }, 600)
        const s = avg(rs.map((r) => r.correct))
        if (s > best.score) best = { th, score: s, wrong: avg(rs.map((r) => r.wrong)) }
      }
      table.push(`${name}: honest ${r2(honest)} → skip above ${best.th} s compute ${r2(best.score)} (+${r2(best.score - honest)}, ${r2(best.wrong)} skips)`)
    }
    const gap = avg(runs({ skill: SKILLS.strong }, 600).map((r) => r.correct)) - avg(runs({ skill: SKILLS.weak }, 600).map((r) => r.correct))
    console.log('[reroll]', table.join(' · '), `· strong−weak gap ${r2(gap)}`)
  })
})

describe('Quick Maths review: difficulty within and between levels', () => {
  const sample = (level: number, op: Op, n = 3000) =>
    Array.from({ length: n }, (_, i) => makeProblem(level, op, undefined, undefined, seeded(1000 * level + 17 * i + OPS.indexOf(op) + 1)))

  it('model compute time per operation and level (mean, p10–p90, max/min ratio of p90/p10)', () => {
    const lines: string[] = []
    const means: Record<Op, number[]> = { '+': [], '−': [], '×': [], '÷': [] }
    for (const op of OPS) {
      const row: string[] = []
      for (let level = 0; level <= MAX_LEVEL; level++) {
        const c = sample(level, op).map(computeCost)
        means[op].push(avg(c))
        row.push(`L${level + 1} ${r2(avg(c))} (${r2(pct(c, 0.1))}–${r2(pct(c, 0.9))})`)
      }
      lines.push(`${op}: ${row.join(' · ')}`)
    }
    console.log('[cost by level]\n' + lines.join('\n'))
    // Share of level L+1 problems that are easier (model) than the level L median.
    const overlap: string[] = []
    for (const op of OPS)
      for (let level = 0; level < MAX_LEVEL; level++) {
        const lo = sample(level, op).map(computeCost), hi = sample(level + 1, op).map(computeCost)
        const med = pct(lo, 0.5)
        overlap.push(`${op} L${level + 1}→${level + 2}: ${Math.round((100 * hi.filter((x) => x < med).length) / hi.length)} %`)
      }
    console.log('[next level easier than this level\'s median]', overlap.join(' · '))
  })

  it('level 1 +: share with a carry, and how it compares with level 2 +', () => {
    const l1 = sample(0, '+'), l2 = sample(1, '+')
    const carry = l1.filter(({ a, b }) => (a % 10) + (b % 10) >= 10)
    const c1c = carry.map(computeCost), c1n = l1.filter((p) => !carry.includes(p)).map(computeCost), c2 = l2.map(computeCost)
    console.log('[+ L1]', `carry ${Math.round((100 * carry.length) / l1.length)} %`, `· L1 carry ${r2(avg(c1c))} s, L1 no carry ${r2(avg(c1n))} s, L2 ${r2(avg(c2))} s`,
      `· 1-digit + 1-digit ${Math.round((100 * l1.filter((p) => p.a < 10 && p.b < 10).length) / l1.length)} %`)
  })

  it('level 5 ×: the two kinds side by side', () => {
    const ps = sample(4, '×')
    const big = ps.filter((p) => Math.max(p.a, p.b) > 20), teen = ps.filter((p) => Math.max(p.a, p.b) <= 20)
    const elevens = teen.filter((p) => p.a === 11 || p.b === 11)
    console.log('[× L5]', `21–29 × 1d ${r2(avg(big.map(computeCost)))} s (n ${big.length})`, `· 11–15 × 11–15 ${r2(avg(teen.map(computeCost)))} s (n ${teen.length}, with an 11: ${Math.round((100 * elevens.length) / teen.length)} %)`)
    const div = sample(4, '÷'), sq = div.filter((p) => p.b === p.answer)
    console.log('[÷ L5]', `squares (121 ÷ 11 …) ${Math.round((100 * sq.length) / div.length)} %`, `· 2-digit divisor ${Math.round((100 * div.filter((p) => p.b > 9).length) / div.length)} %`)
  })

  it('+ carries per level (model-free): level 2 has none, level 5 often fewer than level 4', () => {
    const carries = (x: number, y: number) => { let c = 0, k = 0; for (const [a, b] of digitsOf(Math.max(x, y)).map((d, i) => [d, digitsOf(Math.min(x, y))[i] ?? 0])) { k = a + b + k >= 10 ? 1 : 0; c += k } return c }
    const out: string[] = []
    for (let level = 0; level <= MAX_LEVEL; level++) {
      const cs = sample(level, '+').map((p) => carries(p.a, p.b))
      out.push(`L${level + 1}: ${[0, 1, 2].map((n) => `${n} carries ${Math.round((100 * cs.filter((c) => c === n).length) / cs.length)} %`).join(', ')}`)
    }
    console.log('[+ carries]', out.join(' · '))
    const l1 = sample(0, '+').filter(({ a, b }) => (a % 10) + (b % 10) >= 10).length / 3000
    expect(l1).toBeGreaterThan(0.5) // level 1 + carries more often than not; level 2 + never does
  })

  it('× level 3 and 4 share most problems', () => {
    const key = (p: Problem) => problemKey(p)
    const l3 = new Set(sample(2, '×').map(key)), l4 = sample(3, '×')
    const share = l4.filter((p) => l3.has(key(p))).length / l4.length
    console.log('[× L4 problems that also occur at L3]', `${Math.round(share * 100)} %`)
    const d3 = new Set(sample(2, '÷').map(key)), d4 = sample(3, '÷')
    console.log('[÷ L4 problems that also occur at L3]', `${Math.round((100 * d4.filter((p) => d3.has(key(p))).length) / d4.length)} %`)
  })
})

describe('Quick Maths review: luck vs skill', () => {
  it('same player, 1000 runs: spread vs the weak–strong gap', () => {
    const lines: string[] = []
    const res = Object.fromEntries(Object.entries(SKILLS).map(([k, skill]) => [k, runs({ skill }).map((r) => r)]))
    const gap = avg(res.strong.map((r) => r.correct)) - avg(res.weak.map((r) => r.correct))
    for (const [k, rs] of Object.entries(res)) {
      const s = rs.map((r) => r.correct)
      const lvl = (n: number) => Math.round((100 * rs.filter((r) => r.level >= n).length) / rs.length)
      lines.push(`${k}: mean ${r2(avg(s))}, p10–p90 ${pct(s, 0.1)}–${pct(s, 0.9)} (${r2((pct(s, 0.9) - pct(s, 0.1)) / gap)} of gap), SD ${r2(sd(s))} (${r2(sd(s) / gap)} of gap), reach L5 ${lvl(4)} %, L4 ${lvl(3)} %`)
    }
    console.log(`[luck] gap strong−weak ${r2(gap)}\n` + lines.join('\n'))
    // Draw only: no time noise, no slips: what the random problems alone do.
    const draw = runs({ skill: SKILLS.average, noise: 0, errors: false }).map((r) => r.correct)
    const noProblemLuck: number[] = []
    for (let i = 0; i < 1000; i++) noProblemLuck.push(simulateRun({ skill: SKILLS.average }, seeded(42), seeded(9000 + i)).correct)
    console.log('[luck sources, average player]', `problem draw only: SD ${r2(sd(draw))} (${r2(sd(draw) / gap)} of gap), p10–p90 ${pct(draw, 0.1)}–${pct(draw, 0.9)}`,
      `· same problems, only time noise + slips: SD ${r2(sd(noProblemLuck))} (${r2(sd(noProblemLuck) / gap)} of gap)`)
    expect(gap).toBeGreaterThan(0)
  })
})

describe('Quick Maths review: edge cases', () => {
  it('makeProblem terminates and avoids the previous problem when every level-1 × is seen', () => {
    const seen = new Set<string>()
    for (let a = 2; a <= 6; a++) for (let b = 2; b <= 6; b++) seen.add(problemKey({ a, b, op: '×', answer: a * b }))
    const prev: Problem = { a: 3, b: 4, op: '×', answer: 12 }
    const t0 = performance.now()
    for (let i = 0; i < 200; i++) expect(problemKey(makeProblem(0, '×', seen, prev))).not.toBe(problemKey(prev))
    console.log('[exhausted fallback]', `${r2((performance.now() - t0) / 200)} ms per problem`)
  })

  it('distinct problems per operation and level (how soon a spammer exhausts a level)', () => {
    const out: string[] = []
    for (let level = 0; level <= MAX_LEVEL; level++)
      for (const op of OPS) {
        const keys = new Set<string>()
        for (let i = 0; i < 40000; i++) keys.add(problemKey(makeProblem(level, op, undefined, undefined, seeded(i * 31 + level * 7 + OPS.indexOf(op)))))
        out.push(`L${level + 1}${op} ${keys.size}`)
      }
    console.log('[distinct problems]', out.join(' · '))
  })

  it('levels and blocks stay aligned: every level gets exactly one correct of each operation, even with many wrong', () => {
    for (let run = 0; run < 300; run++) {
      const rand = seeded(run + 5)
      const q = makeOpQueue(rand)
      let correct = 0
      const perLevel: Op[][] = [[], [], [], [], [], [], []]
      for (let i = 0; correct < 28 && i < 10000; i++) {
        const op = q.next()
        if (rand() < 0.4) { q.retry(op); continue }
        perLevel[Math.floor(correct / 4)].push(op)
        correct++
      }
      for (const ops of perLevel) expect([...ops].sort()).toEqual([...OPS].sort())
    }
  })
})
