import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLatest } from '../lib/hooks'
import { nextTestAfter } from '../lib/nextTest'
import { scoreParts } from '../lib/scoreParts'
import { buildShareText, testUrl } from '../lib/share'
import type { ResultEntry } from '../lib/storage'
import { CATEGORY_COLORS, type ResultChip, type ResultDetails, type ResultExtra, type TestDefinition, type TestResult } from '../tests/types'
import { Button } from './Button'
import { ShareButton } from './ShareButton'
import { TestIcon } from './TestIcon'

/** Input is ignored this long, so a last click in the test doesn't hit a button here by accident. */
const INPUT_DELAY_MS = 800
/** At most this many chips (two rows); longer lists show the last ones. */
const MAX_CHIPS = 10

/**
 * The result screen: a 3:2 stage like the rules screen. Score (or the reason there is none) with its
 * stats in the middle, Rules / Stats links at the top, and a footer with Share · Try again · Next test.
 * Enter / Space = Try again, N = next test.
 */
export function ResultScreen({ test, result, isBest, previousBest, onRetry, onRules }: {
  test: TestDefinition
  result: TestResult
  isBest: boolean
  previousBest?: ResultEntry
  onRetry: () => void
  onRules: () => void
}) {
  const navigate = useNavigate()
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setArmed(true), INPUT_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [])

  const next = useMemo(() => nextTestAfter(test.id), [test.id])

  const keys = useLatest({ armed, onRetry, next })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { armed, onRetry, next } = keys.current
      if (!armed || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      // A focused button or link handles Enter / Space itself.
      if ((e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') && !(e.target as Element).closest?.('button, a')) {
        e.preventDefault()
        onRetry()
      }
      if (e.key.toLowerCase() === 'n' && next) navigate(`/test/${next.id}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [keys, navigate])

  const formatted = test.formatScore(result.score)
  const score = scoreParts(formatted)
  const block = armed ? '' : 'pointer-events-none opacity-40'

  return (
    <div className="flex aspect-[3/2] w-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/85">
      <div className={`flex justify-between px-5 pt-3.5 text-sm text-zinc-500 transition-opacity duration-300 ${block}`}>
        <button type="button" onClick={onRules} className="hover:text-zinc-200">‹ Rules</button>
        <Link to={`/stats?open=${test.id}`} className="hover:text-zinc-200">Stats ›</Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-8 text-center">
        {result.failed ? (
          <>
            <p className="text-sm text-zinc-400">No score</p>
            <p className="mt-1 text-4xl font-bold">{result.failed}</p>
          </>
        ) : (
          <>
            <p className="text-sm text-zinc-400">{test.scoreLabel}</p>
            <p className="tabular-nums">
              <span className="text-7xl font-bold tracking-tight text-zinc-50">{score.value}</span>
              {score.unit && <span className="ml-2 text-2xl text-zinc-400">{score.unit}</span>}
            </p>
          </>
        )}
        <div className="mt-2 h-6">
          {isBest ? (
            <span className="rounded-full border border-violet-500/40 bg-violet-500/15 px-3 py-0.5 text-sm text-violet-200">
              {previousBest ? 'New personal best' : 'First score'}
            </span>
          ) : (
            previousBest && <span className="text-sm text-zinc-500">Your best: {test.formatScore(previousBest.score)}</span>
          )}
        </div>
        {result.details && <Details details={result.details} />}
      </div>

      <div className={`grid min-h-[4.5rem] grid-cols-[1fr_auto_1fr] items-center gap-4 border-t border-zinc-800 bg-zinc-950/40 px-5 py-3 transition-opacity duration-300 ${block}`}>
        <div>
          {!result.failed && (
            <ShareButton
              label="Share"
              icon={<ShareIcon />}
              className="border border-zinc-800 bg-transparent! text-zinc-400! hover:text-zinc-100!"
              getShare={() => ({ text: buildShareText(test.name, formatted), url: testUrl(test.id) })}
            />
          )}
        </div>
        <Button onClick={onRetry} className="w-48">Try again</Button>
        <div className="flex justify-end">{next && <NextTestLink test={next} />}</div>
      </div>
    </div>
  )
}

function NextTestLink({ test }: { test: TestDefinition }) {
  return (
    <Link
      to={`/test/${test.id}`}
      className="flex items-center gap-2.5 rounded-xl border border-zinc-700 bg-zinc-900 py-1.5 pr-3 pl-2.5 transition-colors hover:border-zinc-600"
    >
      <TestIcon id={test.id} emoji={test.icon} className="size-7" style={{ color: CATEGORY_COLORS[test.category] }} />
      <span className="flex flex-col text-left leading-tight">
        <span className="text-xs text-zinc-500">Next test</span>
        <span className="font-semibold text-zinc-100">{test.name}</span>
      </span>
      <span className="ml-1 text-zinc-500">›</span>
    </Link>
  )
}

/** Stats row, then the test's special block, then chips. */
function Details({ details }: { details: ResultDetails }) {
  return (
    <>
      {details.stats && details.stats.length > 0 && (
        <dl className="mt-5 flex max-w-2xl flex-wrap justify-center gap-x-8 gap-y-2.5">
          {details.stats.map((s) => (
            <div key={s.label}>
              <dt className="text-xs text-zinc-500">{s.label}</dt>
              <dd className="text-zinc-200 tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {details.extra && <Extra extra={details.extra} />}
      {details.chips && details.chips.items.length > 0 && <Chips {...details.chips} />}
    </>
  )
}

function Chips({ title, items }: { title: string; items: ResultChip[] }) {
  const shown = items.slice(-MAX_CHIPS)
  return (
    <div className="mt-4 max-w-xl">
      <p className="mb-1 text-xs text-zinc-500">{items.length > shown.length ? `${title} · last ${shown.length}` : title}</p>
      <div className="flex flex-wrap justify-center gap-1.5">
        {shown.map((c, i) => (
          <span key={i} className="flex min-w-14 flex-col items-center rounded-lg border border-zinc-800 bg-zinc-800/40 px-2.5 py-1">
            <span className="text-[11px] whitespace-nowrap text-zinc-500">{c.label}</span>
            <span className="text-sm whitespace-nowrap text-zinc-200 tabular-nums">{c.value}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function Extra({ extra }: { extra: ResultExtra }) {
  if (extra.kind === 'pair') {
    const cell = (s: { label: string; value: string }) => (
      <div>
        <p className="text-xs text-zinc-500">{s.label}</p>
        <p className="text-zinc-200 tabular-nums">{s.value}</p>
      </div>
    )
    return (
      <div className="mt-4 flex items-center gap-5 rounded-xl border border-zinc-800 bg-zinc-800/40 px-5 py-2">
        {cell(extra.a)}
        <span className="text-xs text-zinc-600">vs</span>
        {cell(extra.b)}
        {extra.diff && (
          <>
            <span className="text-zinc-600">→</span>
            {cell(extra.diff)}
          </>
        )}
      </div>
    )
  }
  if (extra.kind === 'table') {
    return (
      <table className="mt-4 text-sm tabular-nums">
        <thead>
          <tr>
            {extra.columns.map((c, i) => (
              <th key={c} className={`px-3 pb-1 text-xs font-normal text-zinc-500 ${i ? 'text-right' : 'text-left'}`}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {extra.rows.map((r, ri) => (
            <tr key={ri} className={r.dim ? 'text-zinc-500' : 'text-zinc-200'}>
              {r.cells.map((c, i) => (
                <td key={i} className={`px-3 py-0.5 ${i ? 'text-right' : 'text-left'}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }
  return (
    <div className="mt-5 grid grid-cols-[auto_auto] items-baseline gap-x-4 gap-y-1">
      <span className="text-right text-xs text-zinc-500">Number</span>
      <span className="text-left font-mono text-2xl tracking-[0.15em] break-all">{extra.target}</span>
      <span className="text-right text-xs text-zinc-500">You typed</span>
      <span className="text-left font-mono text-2xl tracking-[0.15em] break-all">
        {[...extra.typed].map((d, i) => (
          <span key={i} className={d === extra.target[i] ? '' : 'text-rose-400 line-through'}>{d}</span>
        ))}
        {extra.typed.length < extra.target.length && <span className="text-zinc-600">{'_'.repeat(extra.target.length - extra.typed.length)}</span>}
      </span>
    </div>
  )
}

const ShareIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
  </svg>
)
