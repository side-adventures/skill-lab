import type { ResultDetails } from '../tests/types'

/**
 * Saved results, per test (localStorage, always wrapped in try/catch).
 *
 * One record per test: the personal best (kept forever), the total number of attempts, and the
 * last MAX_HISTORY results (oldest dropped first). Records from the old format (v1: a plain list of
 * the last 50 results) are converted on first read; the old data is left in place as a backup.
 */
export interface ResultEntry {
  score: number
  /** ms since epoch */
  at: number
  /**
   * Optional breakdown from the result screen. Current results save `ResultDetails`; attempts from
   * before the result screen redesign have a plain label → value map. Not shown anywhere yet.
   */
  details?: ResultDetails | Record<string, string>
}

export interface TestRecord {
  best?: ResultEntry
  attempts: number
  /** Oldest first, at most MAX_HISTORY entries. */
  history: ResultEntry[]
}

export const MAX_HISTORY = 100
const key = (id: string) => `skill-lab:v2:test:${id}`
const legacyKey = (id: string) => `skill-lab:v1:results:${id}`
const EMPTY: TestRecord = { attempts: 0, history: [] }

const isBetter = (a: number, b: number, higherIsBetter: boolean) => (higherIsBetter ? a > b : a < b)

export function pickBest(entries: ResultEntry[], higherIsBetter: boolean): ResultEntry | undefined {
  return entries.reduce<ResultEntry | undefined>(
    (best, e) => (!best || isBetter(e.score, best.score, higherIsBetter) ? e : best),
    undefined,
  )
}

/** Builds a record from an old-format list of results. */
export function fromLegacy(entries: ResultEntry[], higherIsBetter: boolean): TestRecord {
  return { best: pickBest(entries, higherIsBetter), attempts: entries.length, history: entries.slice(-MAX_HISTORY) }
}

/** Pure: the record after adding one result. */
export function addResult(record: TestRecord, entry: ResultEntry, higherIsBetter: boolean) {
  const previousBest = record.best
  const isBest = !previousBest || isBetter(entry.score, previousBest.score, higherIsBetter)
  const next: TestRecord = {
    best: isBest ? entry : previousBest,
    attempts: record.attempts + 1,
    history: [...record.history, entry].slice(-MAX_HISTORY),
  }
  return { next, isBest, previousBest }
}

const isEntry = (e: unknown): e is ResultEntry =>
  typeof e === 'object' && e !== null && typeof (e as ResultEntry).score === 'number' && typeof (e as ResultEntry).at === 'number'

function parseRecord(raw: string | null): TestRecord | undefined {
  if (!raw) return undefined
  const v: unknown = JSON.parse(raw)
  if (typeof v !== 'object' || v === null) return undefined
  const r = v as Partial<TestRecord>
  const history = Array.isArray(r.history) ? r.history.filter(isEntry) : []
  return {
    best: isEntry(r.best) ? r.best : undefined,
    attempts: typeof r.attempts === 'number' ? Math.max(r.attempts, history.length) : history.length,
    history,
  }
}

/** localStorage can throw (private mode, blocked storage) — never let that break a test. */
export function getRecord(testId: string, higherIsBetter: boolean): TestRecord {
  try {
    const current = parseRecord(localStorage.getItem(key(testId)))
    if (current) return current
    const legacy: unknown = JSON.parse(localStorage.getItem(legacyKey(testId)) ?? 'null')
    if (Array.isArray(legacy) && legacy.length) {
      const migrated = fromLegacy(legacy.filter(isEntry), higherIsBetter)
      localStorage.setItem(key(testId), JSON.stringify(migrated))
      return migrated
    }
  } catch {
    /* unreadable or unavailable storage: behave as if nothing was saved */
  }
  return EMPTY
}

export const getBest = (testId: string, higherIsBetter: boolean) => getRecord(testId, higherIsBetter).best

/** Saves a result and reports whether it beat the previous best. */
export function saveResult(testId: string, score: number, higherIsBetter: boolean, details?: ResultDetails) {
  const entry: ResultEntry = { score, at: Date.now(), ...(details && { details }) }
  const { next, isBest, previousBest } = addResult(getRecord(testId, higherIsBetter), entry, higherIsBetter)
  try {
    localStorage.setItem(key(testId), JSON.stringify(next))
  } catch {
    /* storage unavailable — result just isn't persisted */
  }
  return { isBest, previousBest }
}
