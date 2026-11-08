import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { buildAllScoresText, homeUrl, shareResult } from '../lib/share'
import { getBest } from '../lib/storage'
import { TESTS } from '../tests/registry'
import { CATEGORIES } from '../tests/types'

export function Home() {
  const [shareState, setShareState] = useState<string>()
  const tests = TESTS.map((t) => ({ test: t, best: getBest(t.id, t.higherIsBetter) }))
  const played = tests.filter((t) => t.best)

  const shareAll = async () => {
    const text = buildAllScoresText(
      played.map(({ test, best }) => ({ icon: test.icon, name: test.name, score: test.formatScore(best!.score) })),
    )
    const outcome = await shareResult(text, homeUrl())
    setShareState(outcome === 'copied' ? 'Copied to clipboard!' : outcome === 'failed' ? 'Could not share' : undefined)
  }

  return (
    <>
      <section className="py-6 sm:py-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Test your skills in minutes.</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Quick challenges for reaction, memory, focus and more. Get a score, share it, beat your friends.
        </p>
      </section>
      {CATEGORIES.filter((c) => tests.some(({ test }) => test.category === c)).map((category) => (
        <section key={category} className="mb-6">
          <h2 className="mb-2 text-sm font-semibold tracking-wide text-zinc-500 uppercase">{category}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {tests.filter(({ test }) => test.category === category).map(({ test: t, best }) => {
              const available = Boolean(t.Component)
              return (
                <li key={t.id}>
                  <Link
                    to={`/test/${t.id}`}
                    className={`flex h-full gap-4 rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-violet-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-500 ${available ? '' : 'opacity-60'}`}
                  >
                    <span className="text-3xl" aria-hidden>{t.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold">{t.name}</h3>
                        <span className="shrink-0 text-xs text-zinc-500">{available ? t.durationHint : 'Soon'}</span>
                      </div>
                      <p className="text-sm text-zinc-500">{t.tagline}</p>
                      {best && (
                        <p className="mt-1 text-xs font-medium text-violet-600 dark:text-violet-400">
                          Best: {t.formatScore(best.score)}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      <section className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
        {played.length ? (
          <>
            <p className="text-zinc-600 dark:text-zinc-400">
              You've played {played.length} of {TESTS.length} tests. Send all your best scores at once.
            </p>
            <Button onClick={shareAll} className="mt-1">Share all my scores</Button>
            {shareState && <p className="text-sm text-zinc-500" role="status">{shareState}</p>}
          </>
        ) : (
          <p className="text-zinc-500">Play a test to start collecting scores you can share.</p>
        )}
      </section>
    </>
  )
}
