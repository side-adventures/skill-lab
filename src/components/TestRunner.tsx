import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { scoreParts } from '../lib/scoreParts'
import { getRecord, saveResult, type ResultEntry, type TestRecord } from '../lib/storage'
import { CATEGORY_COLORS, storageId, type TestDefinition, type TestResult } from '../tests/types'
import { Button } from './Button'
import { RulesContent } from './RulesContent'
import { ResultScreen } from './ResultScreen'
import { RulesOverlay } from './RulesOverlay'
import { GameFrame } from './game/GameFrame'
import { TestIcon } from './TestIcon'

type Phase =
  | { name: 'intro' }
  | { name: 'playing' }
  | { name: 'result'; result: TestResult; isBest: boolean; previousBest?: ResultEntry; attemptNo?: number }

/** Shared intro → play → result flow used by every test. */
export function TestRunner({ test }: { test: TestDefinition }) {
  const [phase, setPhase] = useState<Phase>({ name: 'intro' })
  const [attempt, setAttempt] = useState(0)
  const [rulesOpen, setRulesOpen] = useState(false)
  const Component = test.Component
  const record = getRecord(storageId(test), test.higherIsBetter)

  // Fetch the test's code while the rules are read, so Start never shows a loading state.
  useEffect(() => Component?.preload(), [Component])

  const start = () => {
    setRulesOpen(false)
    setAttempt((a) => a + 1)
    setPhase({ name: 'playing' })
  }

  const finish = (result: TestResult) => {
    setRulesOpen(false)
    if (result.failed) {
      return setPhase({ name: 'result', result, isBest: false, previousBest: record.best })
    }
    const { isBest, previousBest } = saveResult(storageId(test), result.score, test.higherIsBetter, result.details)
    const attemptNo = getRecord(storageId(test), test.higherIsBetter).attempts
    setPhase({ name: 'result', result, isBest, previousBest, attemptNo })
  }

  // Top bar, right side: "All tests" on the rules and result screens; best + rules button while playing.
  let actions: React.ReactNode = <AllTestsLink />
  let body: React.ReactNode

  if (!Component) {
    body = (
      <Card>
        <p className="mb-2 text-zinc-400">{test.tagline}</p>
        <p className="text-zinc-500">This test is coming soon.</p>
      </Card>
    )
  } else if (phase.name === 'playing') {
    actions = (
      <>
        {record.best && (
          <span className="text-sm text-zinc-500">
            Best <span className="font-medium text-zinc-300">{test.formatScore(record.best.score)}</span>
          </span>
        )}
        <button
          type="button"
          onClick={() => setRulesOpen(true)}
          aria-label="Rules, restart or back to start"
          title="Rules"
          className={`grid size-9 place-items-center rounded-lg border transition-colors ${
            rulesOpen ? 'border-zinc-600 bg-zinc-800 text-zinc-100' : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-100'
          }`}
        >
          <QuestionIcon />
        </button>
      </>
    )
    body = (
      <>
        <GameFrame key={attempt} start={test.start} layout={test.layout} boardAspect={test.boardAspect}>
          <Component onFinish={finish} />
        </GameFrame>
        {rulesOpen && (
          <RulesOverlay
            test={test}
            onClose={() => setRulesOpen(false)}
            onRestart={start}
            onBackToStart={() => {
              setRulesOpen(false)
              setPhase({ name: 'intro' })
            }}
          />
        )}
      </>
    )
  } else if (phase.name === 'result') {
    body = (
      <ResultScreen
        test={test}
        result={phase.result}
        isBest={phase.isBest}
        previousBest={phase.previousBest}
        onRetry={start}
        onRules={() => setPhase({ name: 'intro' })}
      />
    )
  } else {
    body = <RulesScreen test={test} record={record} onStart={start} />
  }

  return (
    <>
      <TestBar test={test}>{actions}</TestBar>
      {/* Info row on the rules and result screens; while playing, GameFrame draws its own at the same height. */}
      {phase.name !== 'playing' && <div className="mb-2 flex h-10 items-end gap-2 text-sm text-zinc-400">
        {phase.name === 'intro' && (
          <>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full" style={{ background: CATEGORY_COLORS[test.category] }} />
              {test.category}
            </span>
            <span className="text-zinc-600">·</span>
            <span>{test.durationHint}</span>
          </>
        )}
        {phase.name === 'result' && <span>{phase.attemptNo ? `Attempt ${phase.attemptNo}` : 'Not counted'}</span>}
      </div>}
      {body}
    </>
  )
}

/** The rules screen: a 3:2 stage with the rules, and a footer with Start and your best. */
function RulesScreen({ test, record, onStart }: { test: TestDefinition; record: TestRecord; onStart: () => void }) {
  const best = record.best && scoreParts(test.formatScore(record.best.score))
  return (
    <div className="flex aspect-[3/2] w-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/85">
      <div className="min-h-0 flex-1 overflow-y-auto px-7 pt-6 pb-4">
        <RulesContent test={test} />
      </div>
      <div className="flex min-h-[4.5rem] items-center justify-between gap-4 border-t border-zinc-800 bg-zinc-950/40 px-5 py-3">
        <Button onClick={onStart} autoFocus className="w-48">Start</Button>
        {best && (
          <div className="text-right">
            <p className="text-xs text-zinc-500">
              Your best · {record.attempts} {record.attempts === 1 ? 'attempt' : 'attempts'}
            </p>
            <p className="flex items-baseline justify-end gap-3">
              <span className="tabular-nums">
                <span className="text-xl font-semibold text-zinc-50">{best.value}</span>
                {best.unit && <span className="ml-1 text-sm text-zinc-400">{best.unit}</span>}
              </span>
              <Link to={`/stats?open=${test.id}`} className="text-sm text-violet-300 hover:text-violet-200">
                Stats ›
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

const AllTestsLink = () => (
  <Link
    to="/"
    className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-100"
  >
    <GridIcon />
    All tests
  </Link>
)

/** "Which test am I on" bar, shown on every screen of a test. Fixed height so nothing below moves. */
function TestBar({ test, children }: { test: TestDefinition; children?: React.ReactNode }) {
  return (
    <div className="mb-1 flex h-10 items-center justify-between gap-3">
      <h1 className="flex items-center gap-2.5 text-2xl font-bold">
        <TestIcon id={test.id} emoji={test.icon} className="size-8" style={{ color: CATEGORY_COLORS[test.category] }} />
        {test.name}
      </h1>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  )
}

const iconProps = {
  width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true,
}
const GridIcon = () => (
  <svg {...iconProps} width={14} height={14}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
  </svg>
)
const QuestionIcon = () => (
  <svg {...iconProps}>
    <path d="M9.2 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5" />
    <circle cx="12" cy="18" r="0.6" fill="currentColor" />
  </svg>
)

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
      {children}
    </div>
  )
}
