import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AttemptGraph } from '../components/AttemptGraph'
import { CategoryChips } from '../components/CategoryChips'
import { ShareIcon } from '../components/HeaderIcons'
import { TestIcon } from '../components/TestIcon'
import { buildShareText, shareResult, testUrl } from '../lib/share'
import { scoreParts } from '../lib/scoreParts'
import { bestToday, mean, median, relativeDay, shortDate } from '../lib/stats'
import { getRecord, type TestRecord } from '../lib/storage'
import { TESTS } from '../tests/registry'
import { CATEGORY_COLORS, categoryFromParam, storageId, type TestDefinition } from '../tests/types'

const COLS = 'grid-cols-[1.25rem_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_4.75rem]'

export function Stats() {
  const [params, setParams] = useSearchParams()
  const category = categoryFromParam(params.get('category'))
  // `?open=<test id>` (from a test's rules screen) unfolds that row and scrolls to it.
  const openParam = params.get('open')
  const [open, setOpen] = useState<Set<string>>(() => new Set(openParam ? [openParam] : []))
  useEffect(() => {
    if (openParam) document.getElementById(`stats-${openParam}`)?.scrollIntoView({ block: 'center' })
  }, [openParam])
  const toggle = (id: string) =>
    setOpen((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  // Played tests first, then the rest; both alphabetical.
  const rows = TESTS.filter((t) => !category || t.category === category)
    .map((test) => ({ test, record: getRecord(storageId(test), test.higherIsBetter) }))
    .sort((a, b) => Number(!a.record.best) - Number(!b.record.best) || a.test.name.localeCompare(b.test.name))

  return (
    <>
      <section className="pt-6 pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Your stats</h1>
        <p className="mt-2 text-zinc-400">Saved in this browser. Your best scores are kept forever.</p>
      </section>

      <div className="mb-5">
        <CategoryChips
          value={category}
          onChange={(c) => setParams(c ? { category: c } : {}, { replace: true })}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80">
        <div className={`grid ${COLS} items-center gap-4 border-b border-zinc-800 px-4 py-2.5 text-xs text-zinc-500`}>
          <span />
          <span>Test</span>
          <span>Best</span>
          <span>Today</span>
          <span>Last played</span>
          <span />
        </div>
        <ul>
          {rows.map(({ test, record }) => (
            <StatsRow key={test.id} test={test} record={record} open={open.has(test.id)} onToggle={() => toggle(test.id)} />
          ))}
        </ul>
      </div>
    </>
  )
}

function StatsRow({ test, record, open, onToggle }: {
  test: TestDefinition
  record: TestRecord
  open: boolean
  onToggle: () => void
}) {
  const color = CATEGORY_COLORS[test.category]
  const played = Boolean(record.best)
  const last = record.history.at(-1)
  const today = bestToday(record.history, test.higherIsBetter)

  const rowContent = (
    <>
      <span aria-hidden className={`text-zinc-500 transition-transform ${open ? 'rotate-90 text-zinc-100' : ''}`}>
        {played && <Chevron />}
      </span>
      <span className="flex min-w-0 items-center gap-3">
        <TestIcon id={test.id} emoji={test.icon} className="size-7" style={{ color }} />
        <span className="truncate text-sm font-semibold text-zinc-100">{test.name}</span>
      </span>
      <span>
        {record.best ? (
          <>
            <Score test={test} score={record.best.score} color={color} strong />
            <span className="block text-xs text-zinc-500">{shortDate(record.best.at)}</span>
          </>
        ) : <Empty />}
      </span>
      <span>{today !== undefined ? <Score test={test} score={today} /> : <Empty />}</span>
      <span className="text-sm text-zinc-400">{last ? relativeDay(last.at) : <Empty />}</span>
      <span className="flex justify-end gap-1.5">
        {played && <ShareBestButton test={test} score={record.best!.score} />}
        <Link
          to={`/test/${test.id}`}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Play ${test.name}`}
          title="Play"
          className="grid size-8 place-items-center rounded-lg bg-violet-600 text-white transition-colors hover:bg-violet-500"
        >
          <PlayIcon />
        </Link>
      </span>
    </>
  )

  const rowClass = `grid ${COLS} items-center gap-4 px-4 py-3`
  const tint = { backgroundImage: `linear-gradient(90deg, ${color}17, transparent 35%)` }

  return (
    <li id={`stats-${test.id}`} className={`scroll-mt-24 border-b border-zinc-800/70 last:border-b-0 ${open ? 'bg-zinc-800/30' : ''}`}>
      {played ? (
        <div
          role="button"
          tabIndex={0}
          aria-expanded={open}
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onToggle()
            }
          }}
          className={`${rowClass} cursor-pointer transition-colors hover:bg-zinc-800/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet-500`}
          style={tint}
        >
          {rowContent}
        </div>
      ) : (
        <div className={rowClass} style={tint}>{rowContent}</div>
      )}
      {open && played && <Details test={test} record={record} color={color} />}
    </li>
  )
}

function Details({ test, record, color }: { test: TestDefinition; record: TestRecord; color: string }) {
  const scores = record.history.map((e) => e.score)
  const last5 = scores.slice(-5)
  const fmt = (v: number) => test.formatScore(roundForDisplay(v, scores))
  const allLabel = record.attempts > scores.length ? `Last ${scores.length}` : 'All attempts'
  return (
    <div className="grid gap-5 px-4 pt-1 pb-5 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <div className="rounded-xl bg-zinc-950/60 p-3 pt-4">
        <AttemptGraph
          history={record.history}
          best={record.best!}
          firstNumber={record.attempts - scores.length + 1}
          color={color}
          higherIsBetter={test.higherIsBetter}
          format={test.formatScore}
        />
      </div>
      <dl className="grid grid-cols-[auto_1fr_1fr] content-start gap-x-4 gap-y-2 text-sm">
        <span />
        <dt className="text-xs text-zinc-500">{allLabel}</dt>
        <dt className="text-xs text-zinc-500">Last 5</dt>
        <dt className="text-zinc-400">Average</dt>
        <dd className="tabular-nums">{fmt(mean(scores))}</dd>
        <dd className="tabular-nums">{last5.length === 5 ? fmt(mean(last5)) : <Empty />}</dd>
        <dt className="text-zinc-400">Median</dt>
        <dd className="tabular-nums">{fmt(median(scores))}</dd>
        <dd className="tabular-nums">{last5.length === 5 ? fmt(median(last5)) : <Empty />}</dd>
        <span className="col-span-3 my-1 h-px bg-zinc-800" />
        <dt className="text-zinc-400">Best</dt>
        <dd className="col-span-2 font-semibold text-zinc-50 tabular-nums">{test.formatScore(record.best!.score)}</dd>
        <dt className="text-zinc-400">Attempts</dt>
        <dd className="col-span-2 tabular-nums">{record.attempts}</dd>
      </dl>
    </div>
  )
}

/** Averages of whole-number scores get one decimal, others two (formatScore may round further). */
function roundForDisplay(v: number, scores: number[]) {
  const whole = scores.every(Number.isInteger)
  return whole ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100
}

function Score({ test, score, color, strong }: { test: TestDefinition; score: number; color?: string; strong?: boolean }) {
  const { value, unit } = scoreParts(test.formatScore(score))
  return (
    <span className="whitespace-nowrap tabular-nums">
      <span className={strong ? 'text-base font-semibold text-zinc-50' : 'text-sm text-zinc-300'}>{value}</span>
      {unit && <span className="ml-1 text-xs" style={{ color: color ?? '#71717a' }}>{unit}</span>}
    </span>
  )
}

const Empty = () => <span className="text-zinc-700">—</span>

/** Icon-only share button; shows a check for a moment once the text was copied or shared. */
function ShareBestButton({ test, score }: { test: TestDefinition; score: number }) {
  const [state, setState] = useState<'done' | 'failed' | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const share = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const outcome = await shareResult(buildShareText(test.name, test.formatScore(score)), testUrl(test.id))
    if (outcome === 'cancelled') return
    setState(outcome === 'failed' ? 'failed' : 'done')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState(null), 2000)
  }
  const label = state === 'done' ? 'Copied' : state === 'failed' ? 'Could not share' : `Share your best ${test.name} score`
  return (
    <button
      type="button"
      onClick={share}
      aria-label={label}
      title={label}
      className={`grid size-8 place-items-center rounded-lg border transition-colors ${
        state === 'done' ? 'border-emerald-700 text-emerald-400' : state === 'failed' ? 'border-rose-800 text-rose-400' : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100'
      }`}
    >
      {state === 'done' ? <CheckIcon /> : <ShareIcon />}
    </button>
  )
}

const iconProps = {
  width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true,
}
const Chevron = () => <svg {...iconProps}><path d="M9 6l6 6-6 6" /></svg>
const CheckIcon = () => <svg {...iconProps}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
const PlayIcon = () => <svg {...iconProps} width={14} height={14}><path d="M7 4.5v15l12.5-7.5z" fill="currentColor" /></svg>
