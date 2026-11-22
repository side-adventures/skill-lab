import { randInt, shuffle, type Rand } from '../../lib/random'
import { LONG_WORDS, MEDIUM_WORDS, SHORT_WORDS, TINY_WORDS, XLONG_WORDS } from './words'

// ---------- words, changes, separators, extras ----------

/**
 * Word pools. The main groups have 256 words each (8 bits per word). Combined words come from the 3-letter and 4–5
 * letter words together (384, ~8.6 bits each), so about 1 in 3 combined words has 3 letters.
 * The 10–12 letter group is small (64 words, 6 bits) and only used in a few recipes.
 */
export const POOLS = {
  tiny: TINY_WORDS,
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
 * Separators between combined words, all equally likely. Always a visible one: words run together (no separator) were
 * hard to read apart, which made them hard to recognize (the Password Lab still tests them).
 */
export const SEPARATORS: { sep: string; weight: number }[] = [
  { sep: '-', weight: 1 }, { sep: '_', weight: 1 }, { sep: '.', weight: 1 }, { sep: ' ', weight: 1 },
]

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
    const { item, p } = pickWeighted(spec.separators ?? SEPARATORS, rand)
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
 * counts 1). From the Password Lab (224 answers by one player, 2026-11-21; a logistic model of right / wrong from the
 * parts):
 * - Changes count per word, by how much of the word they cover: the first change is the hard one (1.7), each further
 *   one costs 1.4 up to half the word's letters, and past half nothing more (a word was hardest with about half its
 *   letters changed, 43 % wrong, and easiest fully changed, 18 %: then it reads as one pattern, LETTER).
 * - A look-alike (digit / symbol) adds 1.2, counted up to half the word's letters too.
 * - With changes counted this way, a word's length matters little (long words were hard mostly because they had room
 *   for more changes).
 */
export const LOAD = {
  word: 1.45,
  per4Letters: 0.38,
  firstChange: 1.7,
  furtherChange: 1.4,
  leet: 1.2,
  extraDigit: 1,
  extraSymbol: 1.53,
  /** One second less to look counts this much more (measured between 3 and 4 s). */
  perSecond: 0.4,
}
/** The show time the weights were measured at. */
const LAB_MS = 4000

type Parts = Pick<Password, 'words' | 'sep' | 'changes' | 'extras'>

/** The load of a password's parts, at the lab's 4 s. */
export function partsLoad(p: Parts) {
  let load = 0
  p.words.forEach((w, i) => {
    load += LOAD.word + (LOAD.per4Letters * w.length) / 4
    const changes = p.changes.filter((c) => c.word === i)
    if (changes.length === 0) return
    const half = w.length / 2
    load += LOAD.firstChange + LOAD.furtherChange * Math.max(0, Math.min(changes.length, half) - 1)
    load += LOAD.leet * Math.min(changes.filter((c) => changeKind(c.to) !== 'upper').length, half)
  })
  for (const c of p.extras) load += /[0-9]/.test(c) ? LOAD.extraDigit : LOAD.extraSymbol
  return load
}

/** The load of a password shown for `showMs`: more time to look makes it lighter, less time heavier. */
export const loadOf = (p: Parts, showMs: number) => partsLoad(p) + (LOAD.perSecond * (LAB_MS - showMs)) / 1000

/**
 * A bare word is not a password: one word needs an extra character, or a change other than a capital first letter
 * (Word, word: too easy, and they don't look like the passwords the game is about).
 */
export function isBareWord(p: Parts) {
  if (p.words.length > 1 || p.extras.length > 0) return false
  return p.changes.every((c) => c.index === 0 && changeKind(c.to) === 'upper')
}

type Groups = { group: Group; weight: number }[]
const g = (tiny: number, short: number, medium: number, long: number, xlong = 0): Groups =>
  (['tiny', 'short', 'medium', 'long', 'xlong'] as const).map((group, i) => ({ group, weight: [tiny, short, medium, long, xlong][i] }))
    .filter((x) => x.weight > 0)

/** How close a password's load must be to its level's. */
export const LOAD_TOLERANCE = 0.15
const MAX_EXTRAS = 12
/** The longest a password gets: it fits the field at full size (a longer one would need smaller, harder to read text). */
export const MAX_LENGTH = 26

/**
 * What a load allows, so passwords look like ordinary ones early and stay mixed later:
 * - `words`: chances of 1 / 2 / 3 words;
 * - `single` / `multi`: word lengths for one word, and for each word of several: longer words at higher levels (more of
 *   a high load in words, not in a long string of extras), and no 3-letter words from level 14 (load 11.5) on: they
 *   are there so early levels can combine words without getting long;
 * - `changes`: the most changed letters (up to load 6: one);
 * - `minChanges` / `minExtras`: at least this many changed letters (counted up to half of each word, as in the load)
 *   and extra characters, growing with the level, so a level is never filled by extras or by changes alone.
 */
export function limitsFor(load: number) {
  const at = (minChanges: number, minExtras: number) => ({ minChanges, minExtras })
  // Word lengths: 3 / 4–5 / 6 / 7–9 / 10–12 letters, for a single word and for each word of several.
  const early = { single: g(0, 30, 30, 25, 15), multi: g(1, 2, 0, 0) }
  if (load <= 6) return { words: [1], changes: 1, ...early, ...at(0, 0) }
  if (load <= 8) return { words: [50, 35], changes: Infinity, ...early, ...at(0, 0) }
  const mins = load <= 10 ? at(1, 1) : load <= 13 ? at(2, 2) : load <= 16 ? at(3, 2) : at(3, 3)
  if (load <= 11) return { words: [45, 40, 15], changes: Infinity, single: g(0, 25, 30, 30, 15), multi: g(20, 50, 20, 10), ...mins }
  if (load <= 14) return { words: [35, 40, 25], changes: Infinity, single: g(0, 15, 30, 35, 20), multi: g(0, 45, 35, 20), ...mins }
  return { words: [25, 45, 30], changes: Infinity, single: g(0, 10, 25, 40, 25), multi: g(0, 35, 35, 30), ...mins }
}

/** Changed letters counted up to half of each word (past half, more changes don't make a word harder). */
export function countedChanges(p: Pick<Password, 'words' | 'changes'>) {
  return p.words.reduce((n, w, i) => n + Math.min(p.changes.filter((c) => c.word === i).length, w.length / 2), 0)
}

/** Different words for a password, each from a group picked by its weight. */
function wordsFor(n: number, groups: Groups, rand: Rand) {
  const words: string[] = []
  let wordBits = 0
  while (words.length < n) {
    const pool = POOLS[pickWeighted(groups, rand).item.group]
    const w = pick(pool, rand)
    if (words.includes(w)) continue
    words.push(w)
    wordBits += log2(pool.length)
  }
  return { words, wordBits }
}

/**
 * A password whose load (at `showMs`) is within LOAD_TOLERANCE of `target`. Its parts are mixed at random, as in the
 * lab: the number of words (picked first and kept, so the mix by level holds: more words fit a load less often),
 * which letters change and how, extra digits / symbols, the separator. Many random mixes are tried and the first
 * close enough is taken (with any word count if the picked one fails; the closest one if none is: only at levels far
 * beyond play). Throws when no mix can reach the target at all (a load below the lightest password; never asked).
 */
export function passwordForLoad(target: number, showMs: number, rand: Rand = Math.random): Password {
  const timeLoad = (LOAD.perSecond * (LAB_MS - showMs)) / 1000
  const limits = limitsFor(target)
  const counts = limits.words.map((weight, i) => ({ n: i + 1, weight }))
  const firstN = pickWeighted(counts, rand).item.n
  let best: Password | null = null
  let bestOff = Infinity
  for (let tries = 0; tries < 20000; tries++) {
    const n = tries < 4000 ? firstN : pickWeighted(counts, rand).item.n
    const picked = wordsFor(n, n === 1 ? limits.single : limits.multi, rand)
    const wordsLoad = partsLoad({ words: picked.words, sep: '-', changes: [], extras: '' })
    const rest = target - timeLoad - wordsLoad
    if (rest < -LOAD_TOLERANCE) continue
    // Split what is left between changed letters (~1.3 each) and extra characters (~1.25 each), at random.
    const letters = picked.words.join('').length
    const most = Math.min(letters, limits.changes, Math.floor(rest / LOAD.furtherChange))
    if (most < limits.minChanges) continue
    const changes = randInt(limits.minChanges, most, rand)
    const extras = Math.max(limits.minExtras, Math.min(MAX_EXTRAS, Math.round((rest - changes * 1.3) / 1.25)))
    const p = buildPassword({ ...picked, changes, extras }, rand)
    if (isBareWord(p) || countedChanges(p) < limits.minChanges || p.text.length > MAX_LENGTH) continue
    const off = Math.abs(loadOf(p, showMs) - target)
    if (off <= LOAD_TOLERANCE) return p
    if (off < bestOff) [best, bestOff] = [p, off]
  }
  if (!best) throw new Error(`No password can reach load ${target}`)
  return best
}

// ---------- levels and the climb ----------

/** Lives for the whole run: a miss costs one. */
export const LIVES = 3

/**
 * Each level's load and show time. Level 1 is a fixed recipe (a 6-letter word and one extra digit or symbol, ~3.5);
 * levels 2–4 add 1 load each with the show time growing to 5 s; from level 4 on, 0.5 load per level at 5 s.
 * From level 25 the show time shrinks by 0.5 s a level, to 2 s at level 30 (the shorter time is part of the level's
 * load, so the password itself grows a little slower; with passwords capped at MAX_LENGTH, time carries the climb).
 * TOP_LEVEL ends the run: far beyond what people remember (a player 5 load above the lab player gets ~1 % there).
 */
const FIRST_LEVELS = [
  { load: 3.5, showMs: 3500 },
  { load: 4.5, showMs: 4000 },
  { load: 5.5, showMs: 4500 },
  { load: 6.5, showMs: 5000 },
]
export const loadOfLevel = (level: number) =>
  level <= FIRST_LEVELS.length ? FIRST_LEVELS[level - 1].load : FIRST_LEVELS[FIRST_LEVELS.length - 1].load + (level - FIRST_LEVELS.length) / 2
export const showMsOfLevel = (level: number) =>
  level <= FIRST_LEVELS.length ? FIRST_LEVELS[level - 1].showMs : Math.max(2000, 5000 - 500 * Math.max(0, level - 24))
export const TOP_LEVEL = 40

/** A password for a level: level 1 is a 6-letter word and one extra character; the others are made by load. */
export function passwordForLevel(level: number, rand: Rand = Math.random): Password {
  if (level === 1) return buildPassword({ ...pickWords(POOLS.medium, 1, rand), changes: 0, extras: 1 }, rand)
  return passwordForLoad(loadOfLevel(level), showMsOfLevel(level), rand)
}

/**
 * Where the run is: the current level, the last level confirmed (none yet: null), and whether a life was lost yet.
 * Until the first miss each right answer skips a level (+2); after it, +1. The first miss goes on one level above the
 * last confirmed one (a smaller step); any later miss replays the same level with a new password. A skip never
 * passes TOP_LEVEL.
 */
export interface Climb { level: number; cleared: number | null; missed: boolean }
export const startClimb = (): Climb => ({ level: 1, cleared: null, missed: false })
export const afterRight = (c: Climb): Climb => ({ level: Math.min(TOP_LEVEL, c.level + (c.missed ? 1 : 2)), cleared: c.level, missed: c.missed })
export const afterMiss = (c: Climb): Climb => ({ level: c.cleared === null ? c.level : c.cleared + 1, cleared: c.cleared, missed: true })
