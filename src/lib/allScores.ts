import { PROTOTYPES, TESTS } from '../tests/registry'
import { storageId } from '../tests/types'
import { buildAllScoresText, homeUrl } from './share'
import { getBest } from './storage'

/** Every test (or prototype) with its best saved result (undefined if never played). */
export const testsWithBest = (tests = TESTS) => tests.map((test) => ({ test, best: getBest(storageId(test), test.higherIsBetter) }))
export const prototypesWithBest = () => testsWithBest(PROTOTYPES)

/** Text + link for sharing all best scores, or null when nothing has been played yet. */
export function allScoresShare() {
  const played = testsWithBest().filter((t) => t.best)
  if (!played.length) return null
  return {
    text: buildAllScoresText(
      played.map(({ test, best }) => ({ icon: test.icon, name: test.name, score: test.formatScore(best!.score) })),
    ),
    url: homeUrl(),
  }
}
