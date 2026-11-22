import { randInt, type Rand } from '../../lib/random'
import {
  buildPassword, changeKind, matches, pickWeighted, pickWords, type Group, type Password,
} from '../password-memory/scoring'
import { LONG_WORDS, MEDIUM_WORDS, SHORT_WORDS, TINY_WORDS, XLONG_WORDS } from './labWords'

/**
 * Password Lab: a practice tool to measure how hard each part of a password is to remember, so Password Memory's
 * strength and show time can be weighted by data. Every part is picked at random on its own, so their effects can be
 * told apart: number of words, word length, separator, changed letters (where, which kind), extra characters.
 * How many parts a password has follows your answers (one more after a right answer, one fewer after a wrong one),
 * which keeps you at around half right, where each answer tells the most.
 */

/**
 * Saved with every answer, so the analysis can tell setups apart. Answers without it are version 1.
 * 1: first lab (a space shown as ␣ while memorizing).
 * 2 (2026-11-20): a space shown as a plain gap; some passwords shown 1 s shorter, which counts as one of their parts.
 */
export const LAB_VERSION = 2

/** Same show time for every password, so the timing doesn't hide how hard a part is. */
export const LAB_SHOW_MS = 4000
/** Sometimes a password is shown this much shorter; that counts as one of its parts, so its weight can be measured. */
export const SHORTER_MS = 1000
/** Chance that a password with a part to spare uses it for the shorter time. */
const SHORTER_CHANCE = 0.25
export const START_PARTS = 4
export const MIN_PARTS = 2

/** How many words: mostly one, often two, sometimes three. */
const WORD_COUNTS = [{ n: 1, weight: 50 }, { n: 2, weight: 35 }, { n: 3, weight: 15 }]
/** For one word: which length group. */
const GROUPS: { group: Group; weight: number }[] = [
  { group: 'short', weight: 30 }, { group: 'medium', weight: 30 }, { group: 'long', weight: 25 }, { group: 'xlong', weight: 15 },
]
/** Every separator equally often here (no separator too, between two words), to get enough data on each. */
const LAB_SEPARATORS = (words: number) =>
  ['-', '_', '.', ' ', ...(words === 2 ? [''] : [])].map((sep) => ({ sep, weight: 1 }))

/** The lab's frozen word lists (see labWords.ts), grouped like Password Memory's. */
const LAB_POOLS: Record<Group, string[]> = {
  tiny: TINY_WORDS, short: SHORT_WORDS, medium: MEDIUM_WORDS, long: LONG_WORDS, xlong: XLONG_WORDS, combo: [...TINY_WORDS, ...SHORT_WORDS],
}

export interface LabPassword { password: Password; group: Group; parts: number; showMs: number }

/** A password with `parts` parts: its words plus its changed letters plus its extra characters. */
export function labPassword(parts: number, rand: Rand = Math.random): LabPassword {
  const words = Math.min(pickWeighted(WORD_COUNTS, rand).item.n, parts)
  const group: Group = words > 1 ? 'combo' : pickWeighted(GROUPS, rand).item.group
  const picked = pickWords(LAB_POOLS[group], words, rand)
  // One of the remaining parts may be "1 s less to look at".
  const shorter = parts - words >= 1 && rand() < SHORTER_CHANCE
  const rest = parts - words - (shorter ? 1 : 0)
  const changes = Math.min(randInt(0, rest, rand), picked.words.join('').length)
  const extras = rest - changes
  const password = buildPassword({ ...picked, changes, extras, separators: LAB_SEPARATORS(words) }, rand)
  return { password, group, parts, showMs: LAB_SHOW_MS - (shorter ? SHORTER_MS : 0) }
}

/** One answer, with everything needed to work out the weight of each part later. */
export interface LabRecord {
  /** When (ms since 1970). */
  at: number
  /** Which lab setup it was played with (LAB_VERSION; missing = 1). */
  labVersion?: number
  parts: number
  text: string
  typed: string
  ok: boolean
  /** How long the password was shown, in ms (missing = 4000). */
  showMs?: number
  /** Time from the field opening to saving, in ms. */
  typeMs: number
  bits: number
  group: Group
  words: { word: string; length: number }[]
  /** '' = no separator, null = one word. */
  sep: string | null
  changes: { word: number; index: number; from: string; to: string; kind: 'upper' | 'digit' | 'symbol'; first: boolean; last: boolean }[]
  extras: { char: string; kind: 'digit' | 'symbol' }[]
  /** Wrong, but you said it was a typo: counts as right (for the difficulty too). */
  typo?: boolean
  /** Wrong, and you chose Skip: left out of the results; the difficulty stays. */
  skipped?: boolean
}

export function toRecord(lab: LabPassword, typed: string, typeMs: number, at = Date.now()): LabRecord {
  const p = lab.password
  return {
    at,
    labVersion: LAB_VERSION,
    parts: lab.parts,
    showMs: lab.showMs,
    text: p.text,
    typed,
    // What you typed is kept as it was; O for 0 and I for 1 count as right (see `matches`).
    ok: matches(typed, p.text),
    typeMs: Math.round(typeMs),
    bits: Math.round(p.bits * 100) / 100,
    group: lab.group,
    words: p.words.map((word) => ({ word, length: word.length })),
    sep: p.words.length > 1 ? p.sep : null,
    changes: p.changes.map((c) => ({
      ...c,
      kind: changeKind(c.to),
      first: c.index === 0,
      last: c.index === p.words[c.word].length - 1,
    })),
    extras: [...p.extras].map((char) => ({ char, kind: /[0-9]/.test(char) ? 'digit' : 'symbol' })),
  }
}

/** Parts for the next password: one more after a right answer, one fewer after a wrong one. */
export const nextParts = (parts: number, ok: boolean) => Math.max(MIN_PARTS, parts + (ok ? 1 : -1))

// ---------- saved progress ----------

/** Everything the lab keeps between visits (in this browser, on this address). */
export interface LabData { version: 1; parts: number; records: LabRecord[] }

export const LAB_KEY = 'skill-lab:password-lab'

export const emptyLab = (): LabData => ({ version: 1, parts: START_PARTS, records: [] })

export function loadLab(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): LabData {
  try {
    const raw = storage?.getItem(LAB_KEY)
    if (!raw) return emptyLab()
    const data = JSON.parse(raw) as LabData
    if (data?.version !== 1 || !Array.isArray(data.records) || typeof data.parts !== 'number') return emptyLab()
    return data
  } catch {
    return emptyLab()
  }
}

/** Saves; returns false when the browser refused (then the Download button is the only copy). */
export function saveLab(data: LabData, storage: Pick<Storage, 'setItem'> | undefined = globalThis.localStorage): boolean {
  try {
    storage?.setItem(LAB_KEY, JSON.stringify(data))
    return !!storage
  } catch {
    return false
  }
}

/** Right for the results: typed correctly, or wrong only by a typo. */
export const countsRight = (r: LabRecord) => r.ok || !!r.typo

/** Share of right answers, in percent (0 with none); skipped ones left out. */
export function hitRate(records: LabRecord[]) {
  const used = records.filter((r) => !r.skipped)
  return used.length ? Math.round((100 * used.filter(countsRight).length) / used.length) : 0
}

/**
 * After a wrong answer: mark it as a typo (counts as right, so the difficulty goes up instead of down) or skip it
 * (left out; the difficulty stays where it was). Only the last answer, and only a wrong one, can be marked.
 */
export function markLast(data: LabData, mark: 'typo' | 'skip'): LabData {
  const last = data.records[data.records.length - 1]
  if (!last || last.ok || last.typo || last.skipped) return data
  const marked: LabRecord = mark === 'typo' ? { ...last, typo: true } : { ...last, skipped: true }
  return {
    ...data,
    parts: mark === 'typo' ? nextParts(last.parts, true) : last.parts,
    records: [...data.records.slice(0, -1), marked],
  }
}
