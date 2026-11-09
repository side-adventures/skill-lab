import { Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buildShareText, testUrl } from '../lib/share'
import { getBest, saveResult, type ResultEntry } from '../lib/storage'
import { storageId, type TestDefinition, type TestResult } from '../tests/types'
import { Button } from './Button'
import { ShareButton } from './ShareButton'

type Phase =
  | { name: 'intro' }
  | { name: 'playing' }
  | { name: 'result'; result: TestResult; isBest: boolean; previousBest?: ResultEntry }

/** Shared intro → play → result flow used by every test. */
export function TestRunner({ test }: { test: TestDefinition }) {
  const [phase, setPhase] = useState<Phase>({ name: 'intro' })
  const [attempt, setAttempt] = useState(0)
  const Component = test.Component

  const start = () => {
    setAttempt((a) => a + 1)
    setPhase({ name: 'playing' })
  }

  const finish = (result: TestResult) => {
    if (result.failed) {
      return setPhase({ name: 'result', result, isBest: false, previousBest: getBest(storageId(test), test.higherIsBetter) })
    }
    const { isBest, previousBest } = saveResult(storageId(test), result.score, test.higherIsBetter)
    setPhase({ name: 'result', result, isBest, previousBest })
  }

  const barLink = (
    <Link to="/" className={barButton}>
      All tests
    </Link>
  )

  // The test's name bar stays on top in every phase: rules, play and result.
  let action: React.ReactNode = barLink
  let body: React.ReactNode

  if (!Component) {
    body = (
      <Card>
        <p className="mb-2 text-zinc-600 dark:text-zinc-400">{test.tagline}</p>
        <p className="text-zinc-500">This test is coming soon.</p>
      </Card>
    )
  } else if (phase.name === 'playing') {
    action = (
      <button onClick={() => setPhase({ name: 'intro' })} className={barButton}>
        Quit
      </button>
    )
    body = (
      <Suspense fallback={<p className="py-20 text-center text-zinc-500">Loading…</p>}>
        <Component key={attempt} onFinish={finish} />
      </Suspense>
    )
  } else if (phase.name === 'result') {
    body = <ResultScreen test={test} phase={phase} onRetry={start} />
  } else {
    const best = getBest(storageId(test), test.higherIsBetter)
    body = (
      <Card>
        <p className="mb-5 text-lg text-zinc-600 dark:text-zinc-400">{test.tagline}</p>
        <ul className="mb-6 space-y-2 text-zinc-700 dark:text-zinc-300">
          {test.instructions.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-violet-500">•</span>
              {line}
            </li>
          ))}
        </ul>
        <p className="mb-6 text-sm text-zinc-500">
          Score: {test.scoreLabel.toLowerCase()} ({test.higherIsBetter ? 'higher' : 'lower'} is better)
          {best && <> · Your best: <b>{test.formatScore(best.score)}</b></>}
        </p>
        <Button onClick={start} className="w-full sm:w-auto" autoFocus>
          Start
        </Button>
      </Card>
    )
  }

  return (
    <>
      <TestBar test={test}>{action}</TestBar>
      {body}
    </>
  )
}

const barButton =
  'rounded-lg px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'

const RESULT_INPUT_DELAY_MS = 800

function ResultScreen({
  test,
  phase,
  onRetry,
}: {
  test: TestDefinition
  phase: Extract<Phase, { name: 'result' }>
  onRetry: () => void
}) {
  // Ignore input for a moment so a last tap in the test doesn't hit "Try again" by accident.
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setArmed(true), RESULT_INPUT_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [])
  const block = (e: React.SyntheticEvent) => {
    if (armed) return
    e.preventDefault()
    e.stopPropagation()
  }
  const formatted = test.formatScore(phase.result.score)


  const failed = phase.result.failed
  return (
    <Card>
      {failed ? (
        <>
          <p className="text-center text-sm font-medium tracking-wide text-zinc-500 uppercase">No score</p>
          <p className="my-2 text-center text-3xl font-bold sm:text-4xl">{failed}</p>
        </>
      ) : (
        <>
          <p className="text-center text-sm font-medium tracking-wide text-zinc-500 uppercase">{test.scoreLabel}</p>
          <p className="my-2 text-center text-5xl font-bold tabular-nums sm:text-6xl">{formatted}</p>
        </>
      )}
      <p className="mb-6 text-center text-sm">
        {phase.isBest ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            {phase.previousBest ? '🏆 New personal best!' : '🏆 First score!'}
          </span>
        ) : (
          phase.previousBest && <span className="text-zinc-500">Your best: {test.formatScore(phase.previousBest.score)}</span>
        )}
      </p>

      {phase.result.details && (
        <dl className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(phase.result.details).map(([label, value]) => (
            <div key={label} className="rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-800/60">
              <dt className="text-xs text-zinc-500">{label}</dt>
              <dd className="font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div
        className={`flex flex-col gap-3 transition-opacity duration-300 sm:flex-row sm:justify-center ${armed ? '' : 'pointer-events-none opacity-40'}`}
        onClickCapture={block}
        onKeyDownCapture={block}
      >
        <Button onClick={onRetry} autoFocus>Try again</Button>
        {!failed && (
          <ShareButton label="Share score" getShare={() => ({ text: buildShareText(test.name, formatted), url: testUrl(test.id) })} />
        )}
        <Link to="/" className="self-center px-3 py-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
          All tests
        </Link>
      </div>
    </Card>
  )
}

/** "Which test am I on" bar, shown on every screen of a test. */
function TestBar({ test, children }: { test: TestDefinition; children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h1 className="flex items-center gap-2 text-xl font-bold">
        <span aria-hidden>{test.icon}</span>
        {test.name}
      </h1>
      {children}
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
      {children}
    </div>
  )
}
