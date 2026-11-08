import { Link } from 'react-router-dom'
import { getBest } from '../lib/storage'
import { TESTS } from '../tests/registry'

export function Home() {
  return (
    <>
      <section className="py-6 sm:py-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Test your skills in minutes.</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Quick challenges for reaction, memory, focus and more. Get a score, share it, beat your friends.
        </p>
      </section>
      <ul className="grid gap-3 sm:grid-cols-2">
        {TESTS.map((t) => {
          const best = getBest(t.id, t.higherIsBetter)
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
                    <h2 className="font-semibold">{t.name}</h2>
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
    </>
  )
}
