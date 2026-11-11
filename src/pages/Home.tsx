import { Link, useSearchParams } from 'react-router-dom'
import { CategoryChips } from '../components/CategoryChips'
import { TestIcon } from '../components/TestIcon'
import { testsWithBest } from '../lib/allScores'
import { scoreParts } from '../lib/scoreParts'
import type { ResultEntry } from '../lib/storage'
import { CATEGORY_COLORS, categoryFromParam, type Category, type TestDefinition } from '../tests/types'

type Show = 'all' | 'unplayed'

export function Home() {
  // Filters live in the URL, so they survive going into a test and back.
  const [params, setParams] = useSearchParams()
  const category = categoryFromParam(params.get('category'))
  const show: Show = params.get('show') === 'unplayed' ? 'unplayed' : 'all'
  const update = (key: string, value: string | null) =>
    setParams(
      (p) => {
        const next = new URLSearchParams(p)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )

  const tests = testsWithBest().sort((a, b) => a.test.name.localeCompare(b.test.name))
  const playedCount = tests.filter((t) => t.best).length
  const visible = tests.filter(
    ({ test, best }) => (!category || test.category === category) && (show === 'all' || !best),
  )

  return (
    <>
      <section className="flex flex-wrap items-end justify-between gap-4 pt-6 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Test your skills in minutes.</h1>
          <p className="mt-2 max-w-xl text-zinc-400">
            Quick challenges for reaction, memory, focus and more. Try them all, set your high scores and
            challenge your friends.
          </p>
        </div>
        <Progress played={playedCount} total={tests.length} />
      </section>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <CategoryChips value={category} onChange={(c) => update('category', c)} />
        <Switch value={show} onChange={(v) => update('show', v === 'all' ? null : v)} />
      </div>

      {visible.length ? (
        <ul className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(({ test, best }) => (
            <li key={test.id}>
              <TestCard test={test} best={best} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          category={category}
          onShowAll={() => update('show', null)}
        />
      )}
    </>
  )
}

function Progress({ played, total }: { played: number; total: number }) {
  return (
    <div className="text-right">
      <p className="text-sm text-zinc-400">
        <span className="font-semibold text-zinc-100">{played}</span> of {total} played
      </p>
      <div className="mt-1.5 h-1 w-36 overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full rounded-full bg-violet-500" style={{ width: `${(played / total) * 100}%` }} />
      </div>
    </div>
  )
}

function Switch({ value, onChange }: { value: Show; onChange: (v: Show) => void }) {
  const options: [Show, string][] = [['all', 'All'], ['unplayed', 'Not played']]
  return (
    <div className="flex rounded-full border border-zinc-800 bg-zinc-900/80 p-0.5" role="group" aria-label="Show">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={`rounded-full px-3.5 py-1 text-sm transition-colors ${
            value === v ? 'bg-zinc-700 text-zinc-50' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function TestCard({ test, best }: { test: TestDefinition; best?: ResultEntry }) {
  const color = CATEGORY_COLORS[test.category]
  const score = best && scoreParts(test.formatScore(best.score))
  return (
    <Link
      to={`/test/${test.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/85 p-4 transition hover:-translate-y-0.5 hover:border-zinc-700"
      style={{ backgroundImage: `linear-gradient(155deg, ${color}1f, transparent 50%)` }}
    >
      {/* Large faded icon as card texture, in a corner no text sits on */}
      <TestIcon
        id={test.id}
        emoji=""
        className="pointer-events-none absolute -right-6 -bottom-7 size-32 opacity-[0.16] transition-opacity group-hover:opacity-[0.22]"
        style={{ color }}
      />
      <div className="relative flex flex-1 flex-col">
        <div className="mb-3 flex items-start justify-between gap-3">
          <TestIcon id={test.id} emoji={test.icon} className="size-9" style={{ color }} />
          {score ? (
            <div className="text-right">
              <p className="leading-none">
                <span className="text-xl font-semibold tabular-nums text-zinc-50">{score.value}</span>
                {score.unit && <span className="ml-1 text-xs" style={{ color }}>{score.unit}</span>}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">your best</p>
            </div>
          ) : (
            <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs text-violet-300">Not played</span>
          )}
        </div>
        <h2 className="font-semibold text-zinc-50">{test.name}</h2>
        <p className="mt-0.5 line-clamp-2 max-w-[85%] text-sm text-zinc-400">{test.tagline}</p>
        <p className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-zinc-500">
          <span className="size-1.5 rounded-full" style={{ background: color }} />
          {test.category} · {test.durationHint}
        </p>
      </div>
    </Link>
  )
}

function EmptyState({ category, onShowAll }: { category: Category | null; onShowAll: () => void }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/85 p-8 text-center">
      <p className="font-semibold text-zinc-100">
        You've played every {category ? `${category} ` : ''}test.
      </p>
      <p className="mt-1 text-sm text-zinc-400">Go for a new best, or try another category.</p>
      <button type="button" onClick={onShowAll} className="mt-4 rounded-lg bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700">
        Show played tests
      </button>
    </div>
  )
}
