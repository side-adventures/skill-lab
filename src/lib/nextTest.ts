import { TESTS } from '../tests/registry'
import { storageId } from '../tests/types'
import { getRecord, type TestRecord } from './storage'

const sameDay = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString()

/**
 * Which test "Next test" on the result screen suggests: one you have never played first, then one you
 * haven't played today, then any other. Within each group in A–Z order, starting after the current
 * test, so pressing Next again and again walks through all of them.
 */
export function pickNextTest<T extends { id: string; name: string }>(
  currentId: string,
  tests: T[],
  recordOf: (test: T) => TestRecord,
  now = Date.now(),
): T | undefined {
  const sorted = [...tests].sort((a, b) => a.name.localeCompare(b.name))
  const at = sorted.findIndex((t) => t.id === currentId)
  const after = [...sorted.slice(at + 1), ...sorted.slice(0, Math.max(at, 0))].filter((t) => t.id !== currentId)
  const group = (t: T) => {
    const r = recordOf(t)
    if (r.attempts === 0) return 0
    const last = r.history.at(-1)
    return last && sameDay(last.at, now) ? 2 : 1
  }
  for (const g of [0, 1, 2]) {
    const found = after.find((t) => group(t) === g)
    if (found) return found
  }
  return undefined
}

/** The suggested next test for `testId` among all playable tests, from the saved records. */
export const nextTestAfter = (testId: string) =>
  pickNextTest(testId, TESTS.filter((t) => t.Component), (t) => getRecord(storageId(t), t.higherIsBetter))
