import { randInt, shuffle, type Rand } from '../../lib/random'
import { LONG_WORDS, MEDIUM_WORDS, SHORT_WORDS } from './words'

/** Lives for the whole run: a wrong answer costs one, and you get a new password of the same level. */
export const LIVES = 2

/** How long the password stays visible: 1 s + 0.5 s per character. */
export const showMs = (password: string) => 1000 + 500 * password.length

/**
 * A password is built from a recipe:
 * - shape: one word (short 4–5 letters, medium 6, long 7–9) or two short words with a separator;
 * - changes: letters turned into uppercase or leet (a→4, e→3, i→1, o→0, s→5, t→7);
 * - extras: digits / symbols added at the end.
 */
export type Shape = 'short' | 'medium' | 'long' | 'two'
export interface Recipe { shape: Shape; changes: number; extras: number }

const rec = (shape: Shape, changes: number, extras: number): Recipe => ({ shape, changes, extras })

/**
 * The level ladder. Each level lists recipes of about the same strength (within ~1.5 bits), and one is picked at
 * random, so a long word gets more changes than a short one. Each level is ~3–4 bits stronger than the one before.
 * Past the last level, each further level adds one extra character to the last level's recipes.
 */
export const LEVELS: Recipe[][] = [
  [rec('short', 0, 1)], // ~12 bits: ball1
  [rec('short', 1, 1), rec('medium', 1, 1)], // ~15: ch4ir9
  [rec('short', 1, 2), rec('medium', 1, 2)], // ~19: stonE@4
  [rec('short', 1, 3), rec('medium', 1, 3), rec('long', 1, 3), rec('two', 0, 1)], // ~22.5
  [rec('medium', 2, 3), rec('medium', 3, 3), rec('long', 2, 3), rec('two', 1, 1)], // ~26
  [rec('two', 2, 1), rec('two', 3, 1), rec('two', 1, 2)], // ~30
  [rec('two', 2, 2), rec('two', 3, 2), rec('two', 1, 3)], // ~34
  [rec('two', 2, 3), rec('two', 3, 3), rec('two', 1, 4)], // ~38
  [rec('two', 2, 4), rec('two', 3, 4)], // ~42
]

/** The recipes for a level (1-based); past the ladder, one more extra character per level. */
export function recipesFor(level: number): Recipe[] {
  const last = LEVELS.length
  if (level <= last) return LEVELS[level - 1]
  return LEVELS[last - 1].map((r) => ({ ...r, extras: r.extras + level - last }))
}

// ---------- building blocks ----------

/** 256 words per group, so every word is worth 8 bits whatever its length. */
export const POOLS: Record<Exclude<Shape, 'two'>, string[]> = {
  short: SHORT_WORDS,
  medium: MEDIUM_WORDS,
  long: LONG_WORDS,
}

export const LEET: Record<string, string> = { a: '4', e: '3', i: '1', o: '0', s: '5', t: '7' }
/** Letters that are never uppercased: I looks like l / 1, O like 0. */
const NO_UPPER = new Set(['i', 'o'])
/** Ways a letter can be changed (uppercase and / or leet). */
export const changeOptions = (letter: string) => {
  const opts: string[] = []
  if (!NO_UPPER.has(letter)) opts.push(letter.toUpperCase())
  if (LEET[letter]) opts.push(LEET[letter])
  return opts
}

export const SEPARATORS = ['', '-', '_', '.', ' ']
/** Symbols that are easy to type on common keyboard layouts (no dead keys). */
export const SYMBOLS = ['!', '?', '@', '#', '$', '%', '&', '*']
export const EXTRA_CHARS = [...'0123456789', ...SYMBOLS]

const pick = <T>(items: T[], rand: Rand) => items[randInt(0, items.length - 1, rand)]
const log2 = Math.log2
const choose = (n: number, k: number) => {
  let r = 1
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1)
  return r
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
    const [a, b, c] = [s[i], s[i + 1], s[i + 2]].map(Number)
    if ([s[i], s[i + 1], s[i + 2]].some((ch) => !/[0-9]/.test(ch))) continue
    if ((b - a === 1 && c - b === 1) || (a - b === 1 && b - c === 1)) return true
  }
  return false
}

export interface Password {
  text: string
  /** Strength in bits: how many yes / no guesses it takes to pin it down, knowing how passwords here are made. */
  bits: number
  recipe: Recipe
}

/**
 * Builds a password for a recipe and works out its strength in bits, from the choices the generator made:
 * the word(s) out of their pool, the separator, which letters were changed and how, and the extra characters.
 */
export function makePassword(recipe: Recipe, rand: Rand = Math.random): Password {
  const words = recipe.shape === 'two'
    ? twoWords(rand)
    : [pick(POOLS[recipe.shape], rand)]
  let bits = recipe.shape === 'two'
    ? 2 * log2(POOLS.short.length) + log2(SEPARATORS.length)
    : log2(POOLS[recipe.shape].length)
  const sep = recipe.shape === 'two' ? pick(SEPARATORS, rand) : ''

  // Letters of all words in one row; pick which ones change, then how.
  const letters = [...words.join('')]
  const changeable = letters.flatMap((l, i) => (changeOptions(l).length ? [i] : []))
  const changes = Math.min(recipe.changes, changeable.length)
  const chosen = shuffle(changeable, rand).slice(0, changes)
  bits += log2(choose(changeable.length, changes))
  for (const i of chosen) {
    const opts = changeOptions(letters[i])
    letters[i] = pick(opts, rand)
    bits += log2(opts.length)
  }

  const extras = makeExtras(recipe.extras, rand)
  bits += recipe.extras * log2(EXTRA_CHARS.length)

  const first = letters.slice(0, words[0].length).join('')
  const second = letters.slice(words[0].length).join('')
  return { text: (words.length === 2 ? first + sep + second : first) + extras, bits, recipe }
}

function twoWords(rand: Rand): string[] {
  const a = pick(POOLS.short, rand)
  let b = pick(POOLS.short, rand)
  while (b === a) b = pick(POOLS.short, rand)
  return [a, b]
}

/** A password for a level (1-based): a random recipe of that level. */
export const passwordFor = (level: number, rand: Rand = Math.random) => makePassword(pick(recipesFor(level), rand), rand)

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
