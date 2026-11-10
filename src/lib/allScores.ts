import { TESTS } from '../tests/registry'
import { storageId } from '../tests/types'
import { buildAllScoresText, homeUrl } from './share'
import { getBest } from './storage'

/** Every test with its best saved result (undefined if never played). */
export const testsWithBest = () => TESTS.map((test) => ({ test, best: getBest(storageId(test), test.higherIsBetter) }))

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
