import { randInt, shuffle, type Rand } from '../../lib/random'

export const DURATION_MS = 90_000
/** Correct answers per level: every 4 correct answers make the series harder. */
export const PER_LEVEL = 4
/** Figures shown before the one you pick. */
export const SHOWN = 4

/**
 * A figure: a shape (`shape`: 0 triangle, 1 square, 2 circle; `fill`) with a clock hand inside (`hand`, in 45° steps), a row of `dots` below it and
 * a small square in one corner of its box (`marker`, 0 = top left, clockwise).
 */
export interface Fig { shape: number; fill: number; hand: number; dots: number; marker: number }
export type Attr = keyof Fig
export const ATTRS: Attr[] = ['shape', 'fill', 'hand', 'dots', 'marker']

const RANGE: Record<Attr, [number, number]> = { shape: [0, 2], fill: [0, 2], hand: [0, 7], dots: [1, 7], marker: [0, 3] }
/** Cyclic attributes wrap around (a full turn, the corners, the shapes, the fills); the dots must stay in range. */
const CYCLE: Partial<Record<Attr, number>> = { hand: 8, marker: 4, fill: 3, shape: 3 }

/** Steps per figure: easy ones, and harder variants (smaller or odd turns, counting down, cycling backwards). */
const STEPS: Record<Attr, { easy: number[]; hard: number[] }> = {
  shape: { easy: [1], hard: [-1] },
  fill: { easy: [1], hard: [-1] },
  hand: { easy: [2, -2], hard: [1, -1, 3] },
  dots: { easy: [1], hard: [-1] },
  marker: { easy: [1], hard: [-1] },
}

export interface Rule { attr: Attr; step: number; hard: boolean }

/** How many attributes change, and how many of them use a hard step, per level. */
const LEVELS: { rules: number; hard: number }[] = [
  { rules: 1, hard: 0 },
  { rules: 2, hard: 0 },
  { rules: 2, hard: 1 },
  { rules: 3, hard: 1 },
  { rules: 3, hard: 2 },
  { rules: 4, hard: 2 },
  { rules: 4, hard: 3 },
]
export const levelOf = (correct: number) => 1 + Math.floor(correct / PER_LEVEL)
export const levelSpec = (level: number) => LEVELS[Math.min(level, LEVELS.length) - 1]

const wrap = (attr: Attr, v: number) => {
  const n = CYCLE[attr]
  return n ? ((v % n) + n) % n : v
}
const inRange = (attr: Attr, v: number) => v >= RANGE[attr][0] && v <= RANGE[attr][1]
const value = (attr: Attr, start: number, step: number, i: number) => wrap(attr, start + step * i)

export interface Series {
  level: number
  rules: Rule[]
  /** The SHOWN figures, then the answer. */
  figs: Fig[]
  options: Fig[]
  answer: number
}

/** A start value such that all SHOWN + 1 values stay in range (any value for cyclic attributes). */
function startFor(attr: Attr, step: number, rand: Rand) {
  const [lo, hi] = RANGE[attr]
  if (CYCLE[attr]) return randInt(lo, hi, rand)
  const span = step * SHOWN
  return span >= 0 ? randInt(lo, hi - span, rand) : randInt(lo - span, hi, rand)
}

/**
 * A wrong value for one attribute of the answer: for a changing attribute a plausible slip (no change, one step too
 * far, the wrong direction), for a fixed one a neighbouring value.
 */
function wrongValue(attr: Attr, answer: number, rule: Rule | undefined, rand: Rand) {
  const cands = rule
    ? [answer - rule.step, answer + rule.step, answer - 2 * rule.step].map((v) => wrap(attr, v))
    : [answer - 1, answer + 1].map((v) => wrap(attr, v))
  const ok = [...new Set(cands)].filter((v) => v !== answer && inRange(attr, v))
  return ok[randInt(0, ok.length - 1, rand)]
}

export function makeSeries(level: number, rand: Rand = Math.random): Series {
  const spec = levelSpec(level)
  const attrs = shuffle(ATTRS, rand).slice(0, spec.rules)
  const hardSet = new Set(shuffle(attrs, rand).slice(0, spec.hard))
  const rules: Rule[] = attrs.map((attr) => {
    const hard = hardSet.has(attr)
    const steps = STEPS[attr][hard ? 'hard' : 'easy']
    return { attr, hard, step: steps[randInt(0, steps.length - 1, rand)] }
  })
  const start = {} as Fig
  for (const attr of ATTRS) {
    const rule = rules.find((r) => r.attr === attr)
    start[attr] = rule ? startFor(attr, rule.step, rand) : randInt(RANGE[attr][0], RANGE[attr][1], rand)
  }
  const figs = Array.from({ length: SHOWN + 1 }, (_, i) => {
    const f = {} as Fig
    for (const attr of ATTRS) {
      const rule = rules.find((r) => r.attr === attr)
      f[attr] = rule ? value(attr, start[attr], rule.step, i) : start[attr]
    }
    return f
  })
  const answerFig = figs[SHOWN]

  // 4 options = 2 values × 2 values on two attributes (as in I-RAVEN): every value shows up in exactly two options,
  // so the answer can't be found by picking what most options share. The first attribute always changes; the second
  // changes too when there is a second rule.
  const ruleAttrs = shuffle(rules.map((r) => r.attr), rand)
  const x = ruleAttrs[0]
  const y = ruleAttrs[1] ?? shuffle(ATTRS.filter((a) => a !== x), rand)[0]
  const xs = [answerFig[x], wrongValue(x, answerFig[x], rules.find((r) => r.attr === x), rand)]
  const ys = [answerFig[y], wrongValue(y, answerFig[y], rules.find((r) => r.attr === y), rand)]
  const opts = xs.flatMap((xv) => ys.map((yv) => ({ ...answerFig, [x]: xv, [y]: yv })))
  const options = shuffle(opts, rand)
  return { level, rules, figs, options, answer: options.findIndex((o) => sameFig(o, answerFig)) }
}

export const sameFig = (a: Fig, b: Fig) => ATTRS.every((k) => a[k] === b[k])
