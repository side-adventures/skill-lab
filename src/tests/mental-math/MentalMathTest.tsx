import { useEffect, useRef, useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { PromptLayout } from '../../components/game/layouts'
import { NumberPad } from '../../components/NumberPad'
import { feedbackRing, useAnswerFlash } from '../../lib/game'
import { useCountdown } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { answerStats, fmtMs, type TimedAnswer } from '../../lib/resultFormat'
import { DURATION_MS, MAX_LEVEL, levelFor, makeOpQueue, makeProblem, operationTable, problemKey, type Op } from './scoring'

export default function MentalMathTest({ onFinish }: TestComponentProps) {
  // Queue and first problem are made together, so a repeated initializer (StrictMode) can't skip an operation.
  // `seen` holds every problem shown this run, so none comes back.
  const [{ ops, seen, first }] = useState(() => {
    const ops = makeOpQueue()
    const first = makeProblem(0, ops.next())
    return { ops, seen: new Set([problemKey(first)]), first }
  })
  const [problem, setProblem] = useState(first)
  const [input, setInput] = useState('')
  const [correct, setCorrect] = useState(0)
  const level = levelFor(correct)
  const [flash, signal] = useAnswerFlash()
  // When the current problem appeared, and every answer's time (for the result stats).
  const shownAt = useRef(0)
  useEffect(() => {
    shownAt.current = performance.now()
  }, [])
  const answers = useRef<(TimedAnswer & { task: string; op: Op })[]>([])

  const remaining = useCountdown(DURATION_MS, true, () => {
    // Fastest (correct) and slowest answer, with their problem: "7 × 8 = 56 (1.2 s)".
    const all = answers.current
    const ok = all.filter((a) => a.correct)
    const show = (a: { task: string; ms: number }) => `${a.task} (${fmtMs(a.ms)})`
    const fastest = ok.length ? ok.reduce((m, a) => (a.ms < m.ms ? a : m)) : undefined
    const slowest = all.length ? all.reduce((m, a) => (a.ms > m.ms ? a : m)) : undefined
    onFinish({
      score: correct,
      ...(all.length === 0 && { failed: 'No answers — try again!' }), // idle run: shown, not saved
      details: {
        stats: [
          { label: 'Level reached', value: `${level + 1} / ${MAX_LEVEL + 1}` },
          // Correct is the score itself, Fastest gets the problem below.
          ...answerStats(all).filter((s) => s.label !== 'Fastest answer' && s.label !== 'Correct'),
          ...(fastest ? [{ label: 'Fastest answer', value: show(fastest) }] : []),
          ...(slowest ? [{ label: 'Slowest answer', value: show(slowest) }] : []),
        ],
        ...(all.length > 0 && { extra: operationTable(all) }),
      },
    })
  })

  const submit = (value: string) => {
    if (remaining <= 0) return
    const ok = Number(value) === problem.answer
    const now = performance.now()
    answers.current.push({ ms: now - shownAt.current, correct: ok, op: problem.op, task: `${problem.a} ${problem.op} ${problem.b} = ${problem.answer}` })
    shownAt.current = now
    const nextCorrect = ok ? correct + 1 : correct
    if (ok) setCorrect(nextCorrect)
    else ops.retry(problem.op)
    signal(ok)
    const next = makeProblem(levelFor(nextCorrect), ops.next(), seen, problem)
    seen.add(problemKey(next))
    setProblem(next)
    setInput('')
  }

  return (
    <>
      <GameInfo
        left={<><InfoValue value={(remaining / 1000).toFixed(1)} unit="s left" /><InfoValue value={`Level ${level + 1}`} of={MAX_LEVEL + 1} /></>}
        middle="Type the answer, then Enter"
        right={<InfoValue label="Correct" value={correct} />}
        timer={remaining / DURATION_MS}
      />
      <PromptLayout
        displayClassName={feedbackRing(flash)}
        display={
          <div className="text-center">
            <p className="text-7xl font-bold tabular-nums">{problem.a} {problem.op} {problem.b}</p>
            <p className="mt-5 h-12 text-5xl font-bold text-violet-300 tabular-nums">
              {input || <span className="text-zinc-700">?</span>}
            </p>
          </div>
        }
        answers={<NumberPad value={input} onChange={setInput} onSubmit={submit} maxLength={3} disabled={remaining <= 0} layout="row" />}
      />
    </>
  )
}
