export interface ResultEntry {
  score: number
  at: number
}

const key = (testId: string) => `skill-lab:v1:results:${testId}`
const MAX_HISTORY = 50

/** localStorage can throw (private mode, blocked storage) — never let that break a test. */
export function getHistory(testId: string): ResultEntry[] {
  try {
    const raw = localStorage.getItem(key(testId))
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as ResultEntry[]) : []
  } catch {
    return []
  }
}

export function pickBest(entries: ResultEntry[], higherIsBetter: boolean): ResultEntry | undefined {
  return entries.reduce<ResultEntry | undefined>((best, e) => {
    if (!best) return e
    return (higherIsBetter ? e.score > best.score : e.score < best.score) ? e : best
  }, undefined)
}

export function getBest(testId: string, higherIsBetter: boolean) {
  return pickBest(getHistory(testId), higherIsBetter)
}

/** Saves a result and reports whether it beat the previous best. */
export function saveResult(testId: string, score: number, higherIsBetter: boolean) {
  const history = getHistory(testId)
  const previousBest = pickBest(history, higherIsBetter)
  const isBest =
    !previousBest || (higherIsBetter ? score > previousBest.score : score < previousBest.score)
  try {
    const next = [...history, { score, at: Date.now() }].slice(-MAX_HISTORY)
    localStorage.setItem(key(testId), JSON.stringify(next))
  } catch {
    /* storage unavailable — result just isn't persisted */
  }
  return { isBest, previousBest }
}
