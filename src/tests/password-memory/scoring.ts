import { randInt, shuffle, type Rand } from '../../lib/random'
import { LONG_WORDS, MEDIUM_WORDS, SHORT_WORDS, TINY_WORDS, XLONG_WORDS } from './words'

/** Lives for the whole run: a wrong answer costs one, and you get a new password of the same level. */
export const LIVES = 2

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

// ---------- the game's levels ----------

/**
 * A recipe: one word from a group (4–5 letters, 6, 7–9, 10–12), or two / three combined words (3–5 letters each);
 * how many letters change; how many extra characters.
 */
export type Shape = Exclude<Group, 'combo'> | 'two' | 'three'
export interface Recipe { shape: Shape; changes: number; extras: number }
const rec = (shape: Shape, changes: number, extras: number): Recipe => ({ shape, changes, extras })

/**
 * The level ladder. Each level lists recipes of about the same strength, and one is picked at random. Words get
 * longer as the levels go up (4–5 letters first, then 6, then 7–9; 10–12 and three words later), and each level is
 * ~3–4 bits stronger than the one before. Past the last level, each further level adds one extra character.
 */
export const LEVELS: Recipe[][] = [
  [rec('short', 0, 1)],
  [rec('short', 1, 1), rec('medium', 1, 1)],
  [rec('short', 1, 2), rec('medium', 1, 2), rec('two', 0, 0)],
  [rec('medium', 1, 3), rec('long', 2, 2), rec('two', 1, 0)],
  [rec('medium', 2, 3), rec('long', 2, 3), rec('xlong', 3, 3), rec('two', 1, 1)],
  [rec('long', 2, 4), rec('xlong', 2, 4), rec('two', 2, 1), rec('two', 1, 2)],
  [rec('two', 2, 2), rec('two', 1, 3), rec('two', 3, 1)],
  [rec('two', 3, 2), rec('three', 1, 1), rec('two', 2, 3)],
  [rec('three', 1, 2), rec('three', 2, 1), rec('two', 3, 3)],
  [rec('three', 2, 2), rec('three', 1, 3), rec('two', 3, 4)],
]

/** The recipes for a level (1-based); past the ladder, one more extra character per level. */
export function recipesFor(level: number): Recipe[] {
  const last = LEVELS.length
  if (level <= last) return LEVELS[level - 1]
  return LEVELS[last - 1].map((r) => ({ ...r, extras: r.extras + level - last }))
}

export const wordCount = (shape: Shape) => (shape === 'two' ? 2 : shape === 'three' ? 3 : 1)

export function makePassword(recipe: Recipe, rand: Rand = Math.random): Password {
  const count = wordCount(recipe.shape)
  const pool = count > 1 ? POOLS.combo : POOLS[recipe.shape as Group]
  return buildPassword({ ...pickWords(pool, count, rand), changes: recipe.changes, extras: recipe.extras }, rand)
}

/** A password for a level (1-based): a random recipe of that level. */
export const passwordFor = (level: number, rand: Rand = Math.random) => makePassword(pick(recipesFor(level), rand), rand)

/**
 * How long a password stays visible: by the things to remember, not the characters (a long word is one chunk).
 * 1.5 s + 1 s per word + 0.5 s per separator + 0.75 s per changed letter + 0.75 s per extra character.
 */
export const showMs = (p: Pick<Password, 'words' | 'changes' | 'extras'>) =>
  1500 + 1000 * p.words.length + 500 * (p.words.length - 1) + 750 * p.changes.length + 750 * p.extras.length

// ---------- score and result ----------

/** The score: whole bits. */
export const scoreBits = (bits: number) => Math.round(bits)

export function strengthLabel(bits: number) {
  if (bits < 20) return 'Weak'
  if (bits < 28) return 'Fair'
  if (bits < 36) return 'Strong'
  return 'Very strong'
}

/** Guesses per second assumed for "time to crack" (an online attack). */
export const GUESSES_PER_SECOND = 1000

/** Average time to guess it: half of all 2^bits options, at GUESSES_PER_SECOND. */
export function crackTime(bits: number): string {
  const s = 2 ** (bits - 1) / GUESSES_PER_SECOND
  if (s < 1) return 'instantly'
  const units: [number, string][] = [
    [60, 'second'], [60, 'minute'], [24, 'hour'], [365.25, 'day'], [1000, 'year'],
  ]
  let v = s
  for (const [size, name] of units) {
    if (v < size) return about(v, name)
    v /= size
  }
  if (v < 1000) return about(v, 'thousand years', false)
  return about(v / 1000, 'million years', false)
}

function about(v: number, unit: string, plural = true) {
  const n = v < 10 ? Math.round(v * 10) / 10 : Math.round(v)
  const word = plural && n !== 1 ? `${unit}s` : unit
  return `~${n} ${word}`
}
