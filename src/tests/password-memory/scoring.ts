import { randInt, shuffle, type Rand } from '../../lib/random'
import { LONG_WORDS, MEDIUM_WORDS, SHORT_WORDS, TINY_WORDS, XLONG_WORDS } from './words'

// ---------- words, changes, separators, extras ----------

/**
 * Word pools. The main groups have 256 words each (8 bits per word). Combined words come from the 3-letter and 4–5
 * letter words together (384, ~8.6 bits each), so about 1 in 3 combined words has 3 letters.
 * The 10–12 letter group is small (64 words, 6 bits) and only used in a few recipes.
 */
export const POOLS = {
  short: SHORT_WORDS,
  medium: MEDIUM_WORDS,
  long: LONG_WORDS,
  xlong: XLONG_WORDS,
  combo: [...TINY_WORDS, ...SHORT_WORDS],
}
export type Group = keyof typeof POOLS

/**
 * What a changed letter can become: uppercase, or a digit / symbol that looks like it (leet).
 * I and O are never uppercased (they look like l / 1 and 0).
 */
export const CHANGES: Record<string, string[]> = {
  a: ['A', '4', '@'],
  b: ['B', '8'],
  e: ['E', '3'],
  g: ['G', '9'],
  i: ['1'],
  l: ['L', '1'],
  o: ['0'],
  s: ['S', '5', '$'],
  t: ['T', '7'],
  z: ['Z', '2'],
}
export const changeOptions = (letter: string) => CHANGES[letter] ?? [letter.toUpperCase()]
/** How a letter was changed, for the calibration data. */
export const changeKind = (to: string): 'upper' | 'digit' | 'symbol' =>
  /[0-9]/.test(to) ? 'digit' : /[A-Z]/.test(to) ? 'upper' : 'symbol'

/**
 * Separators between combined words, with how often each is picked. "No separator" is much harder to read back, so
 * it is rarer, and only between two words (three words always get a visible one).
 */
export const SEPARATORS: { sep: string; weight: number }[] = [
  { sep: '-', weight: 7 }, { sep: '_', weight: 7 }, { sep: '.', weight: 7 }, { sep: ' ', weight: 7 }, { sep: '', weight: 4 },
]
export const separatorsFor = (words: number) => SEPARATORS.filter((s) => s.sep !== '' || words === 2)

/** Symbols that are easy to type on common keyboard layouts (no dead keys). */
export const SYMBOLS = ['!', '?', '@', '#', '$', '%', '&', '*']
export const EXTRA_CHARS = [...'0123456789', ...SYMBOLS]
/** Every non-letter, non-digit character a password can have except space: the symbol buttons under the form. */
export const SYMBOL_KEYS = [...SYMBOLS, ...SEPARATORS.map((s) => s.sep).filter((s) => s.trim() !== '')]

export const pick = <T>(items: T[], rand: Rand) => items[randInt(0, items.length - 1, rand)]
const log2 = Math.log2
const choose = (n: number, k: number) => {
  let r = 1
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1)
  return r
}

/** Picks one item by weight; returns it and its chance. */
export function pickWeighted<T extends { weight: number }>(items: T[], rand: Rand): { item: T; p: number } {
  const total = items.reduce((a, i) => a + i.weight, 0)
  let r = rand() * total
  for (const item of items) {
    r -= item.weight
    if (r < 0) return { item, p: item.weight / total }
  }
  const item = items[items.length - 1]
  return { item, p: item.weight / total }
}

/** Extra characters for the end: no character twice, no run of 3 digits up or down (123, 987). */
export function makeExtras(count: number, rand: Rand = Math.random): string {
  for (;;) {
    const chars: string[] = []
    while (chars.length < count) {
      const c = pick(EXTRA_CHARS, rand)
      if (!chars.includes(c)) chars.push(c)
    }
    if (!hasDigitRun(chars.join(''))) return chars.join('')
  }
}

export function hasDigitRun(s: string) {
  for (let i = 0; i + 2 < s.length; i++) {
    const t = s.slice(i, i + 3)
    if (!/^[0-9]{3}$/.test(t)) continue
    const [a, b, c] = [...t].map(Number)
    if ((b - a === 1 && c - b === 1) || (a - b === 1 && b - c === 1)) return true
  }
  return false
}

/**
 * A capital O or I never appears in a password (o can only become 0, i only 1), so typing O for 0 or I for 1 loses
 * nothing: you remembered that the letter was changed, and that was its only change. l and 1 stay different, since
 * a lowercase l does appear in words.
 */
export const sameChar = (typed: string, shown: string) =>
  typed === shown || (shown === '0' && typed === 'O') || (shown === '1' && typed === 'I')

/** Whether what you typed matches the password (exact, except O for 0 and I for 1). */
export const matches = (typed: string, text: string) =>
  typed.length === text.length && [...typed].every((c, i) => sameChar(c, text[i]))

// ---------- building a password ----------

/** What to build: the words (and their bits), how many letters to change, how many extra characters. */
export interface Spec {
  words: string[]
  wordBits: number
  changes: number
  extras: number
  /** Separators to pick from (default: the game's). */
  separators?: { sep: string; weight: number }[]
}

/** One changed letter: which word, which letter in it, from what to what. */
export interface Change { word: number; index: number; from: string; to: string }

export interface Password {
  text: string
  /** Strength in bits: how many yes / no guesses it takes to pin it down, knowing how passwords here are made. */
  bits: number
  words: string[]
  sep: string
  changes: Change[]
  extras: string
}

/**
 * Builds a password and works out its strength in bits, from the choices made: the words out of their pool, the
 * separator (by its chance: a rarer one counts more), which letters were changed (each change counts the same 1 bit
 * for "how", whatever the letter's options), and the extra characters.
 */
export function buildPassword(spec: Spec, rand: Rand = Math.random): Password {
  const { words } = spec
  let bits = spec.wordBits
  let sep = ''
  if (words.length > 1) {
    const { item, p } = pickWeighted(spec.separators ?? separatorsFor(words.length), rand)
    sep = item.sep
    bits += -log2(p)
  }

  // Letters of all words in one row; pick which ones change, then how.
  const letters = [...words.join('')]
  const count = Math.min(spec.changes, letters.length)
  const chosen = shuffle(letters.map((_, i) => i), rand).slice(0, count).sort((a, b) => a - b)
  bits += log2(choose(letters.length, count)) + count
  const starts = words.map((_, w) => words.slice(0, w).join('').length)
  const changes: Change[] = chosen.map((i) => {
    const from = letters[i]
    const to = pick(changeOptions(from), rand)
    letters[i] = to
    let word = 0
    while (word + 1 < starts.length && starts[word + 1] <= i) word++
    return { word, index: i - starts[word], from, to }
  })

  const extras = makeExtras(spec.extras, rand)
  bits += spec.extras * log2(EXTRA_CHARS.length)

  const parts = starts.map((s, w) => letters.slice(s, s + words[w].length).join(''))
  return { text: parts.join(sep) + extras, bits, words, sep, changes, extras }
}

/** Different words from one pool, with their bits. */
export function pickWords(pool: string[], count: number, rand: Rand = Math.random) {
  const words: string[] = []
  while (words.length < count) {
    const w = pick(pool, rand)
    if (!words.includes(w)) words.push(w)
  }
  return { words, wordBits: count * log2(pool.length) }
}

// ---------- how hard a password is to remember (load) ----------

/**
 * How much each part adds to the load of remembering a password, in "extra digits" (one extra digit after the word
 * counts 1). Measured in the Password Lab (224 answers by one player, 2026-11-21; a logistic model of right / wrong
 * from the parts), so rough: a word is easy to hold (its letters are one chunk), a changed letter is hard (a digit or
 * symbol twice as hard as a capital), an extra symbol harder than a digit, and words run together harder than apart.
 */
export const LOAD = {
  word: 1.3,
  per4Letters: 1.26,
  upper: 1.09,
  digit: 2.23,
  symbol: 2.17,
  extraDigit: 1,
  extraSymbol: 1.56,
  noSeparator: 1.79,
  /** One second less to look counts this much more (measured between 3 and 4 s). */
  perSecond: 0.4,
}
/** The show time the weights were measured at. */
const LAB_MS = 4000

type Parts = Pick<Password, 'words' | 'sep' | 'changes' | 'extras'>

/** The load of a password's parts, at the lab's 4 s. */
export function partsLoad(p: Parts) {
  let load = 0
  for (const w of p.words) load += LOAD.word + (LOAD.per4Letters * w.length) / 4
  for (const c of p.changes) load += LOAD[changeKind(c.to)]
  for (const c of p.extras) load += /[0-9]/.test(c) ? LOAD.extraDigit : LOAD.extraSymbol
  if (p.words.length > 1 && p.sep === '') load += LOAD.noSeparator
  return load
}

/** The load of a password shown for `showMs`: more time to look makes it lighter, less time heavier. */
export const loadOf = (p: Parts, showMs: number) => partsLoad(p) + (LOAD.perSecond * (LAB_MS - showMs)) / 1000

/** How many words a password has, and from which group a single word comes. */
const WORD_COUNTS = [{ n: 1, weight: 50 }, { n: 2, weight: 35 }, { n: 3, weight: 15 }]
const SINGLE_GROUPS: { group: Group; weight: number }[] = [
  { group: 'short', weight: 30 }, { group: 'medium', weight: 30 }, { group: 'long', weight: 25 }, { group: 'xlong', weight: 15 },
]
/** How close a password's load must be to its level's (levels are 0.5 apart). */
export const LOAD_TOLERANCE = 0.25
const MAX_EXTRAS = 12

/**
 * A password whose load (at `showMs`) is within LOAD_TOLERANCE of `target`. Its parts are mixed at random, as in the
 * lab: one to three words, which letters change and how, extra digits / symbols, the separator. Many random mixes
 * are tried and the first close enough is taken (the closest one if none is, which doesn't happen in practice).
 */
export function passwordForLoad(target: number, showMs: number, rand: Rand = Math.random): Password {
  const timeLoad = (LOAD.perSecond * (LAB_MS - showMs)) / 1000
  let best: Password | null = null
  let bestOff = Infinity
  for (let tries = 0; tries < 5000; tries++) {
    const n = pickWeighted(WORD_COUNTS, rand).item.n
    const pool = n > 1 ? POOLS.combo : POOLS[pickWeighted(SINGLE_GROUPS, rand).item.group]
    const picked = pickWords(pool, n, rand)
    const wordsLoad = partsLoad({ words: picked.words, sep: '-', changes: [], extras: '' })
    const rest = target - timeLoad - wordsLoad
    if (rest < -LOAD_TOLERANCE) continue
    // Split what is left between changed letters (~1.6 each) and extra characters (~1.25 each), at random.
    const letters = picked.words.join('').length
    const changes = randInt(0, Math.max(0, Math.min(letters, Math.floor(rest / LOAD.upper))), rand)
    const extras = Math.max(0, Math.min(MAX_EXTRAS, Math.round((rest - changes * 1.6) / 1.25)))
    const p = buildPassword({ ...picked, changes, extras }, rand)
    const off = Math.abs(loadOf(p, showMs) - target)
    if (off <= LOAD_TOLERANCE) return p
    if (off < bestOff) [best, bestOff] = [p, off]
  }
  return best!
}

// ---------- the climb ----------

/** Lives for the whole run: a miss costs one. */
export const LIVES = 3
export const START_LOAD = 4

/** Levels are numbered in half-load steps: level 1 is load 4, level 2 is 4.5, … */
export const levelOf = (load: number) => Math.round(2 * (load - START_LOAD)) + 1
export const loadOfLevel = (level: number) => START_LOAD + (level - 1) / 2

/** Show time grows with the load, 0.5 s per load, from 3 s at the start to 5 s from load 8 on. */
export const showMsFor = (load: number) => Math.round(1000 * Math.min(5, 3 + 0.5 * (load - START_LOAD)))

/**
 * Where the run is: the load of the current password, the last load confirmed (none yet: null), and the biggest
 * step allowed (starts at 2; every miss halves it, down to 0.5).
 */
export interface Climb { load: number; cleared: number | null; cap: number }
export const startClimb = (): Climb => ({ load: START_LOAD, cleared: null, cap: 2 })

/** Steps of 2 until load 8 (a quick start), then 1, never more than the cap. */
const stepFrom = (load: number, cap: number) => Math.min(load < 8 ? 2 : 1, cap)

export const afterRight = (c: Climb): Climb => ({ load: c.load + stepFrom(c.load, c.cap), cleared: c.load, cap: c.cap })

/**
 * After a miss the step halves (never below 0.5), and the next password is the last confirmed load plus that step:
 * a miss at 12 after 11 goes on at 11.5; a miss at 6 after 4 at 5. With the step already at 0.5, that is the same
 * load again (a new password). A miss before anything was confirmed repeats the start.
 */
export function afterMiss(c: Climb): Climb {
  const lastStep = c.cleared === null ? c.cap : c.load - c.cleared
  const cap = Math.max(0.5, lastStep / 2)
  return { load: c.cleared === null ? c.load : c.cleared + cap, cleared: c.cleared, cap }
}
