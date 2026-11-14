import { useEffect, useRef, useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { PromptLayout } from '../../components/game/layouts'
import { NumberPad } from '../../components/NumberPad'
import { feedbackRing, useAnswerFlash } from '../../lib/game'
import { useCountdown } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { answerStats, fmtMs, type TimedAnswer } from '../../lib/resultFormat'
import { DURATION_MS, levelFor, makeProblem, operationTable, type Op } from './scoring'

export default function MentalMathTest({ onFinish }: TestComponentProps) {
  const [problem, setProblem] = useState(() => makeProblem(0))
  const [input, setInput] = useState('')
  const [correct, setCorrect] = useState(0)
  const [flash, signal] = useAnswerFlash()
  // When the current problem appeared, and every answer's time (for the result stats).
  const shownAt = useRef(0)
  useEffect(() => {
    shownAt.current = performance.now()
  }, [])
  const answers = useRef<(TimedAnswer & { task: string; op: Op })[]>([])

  const remaining = useCountdown(DURATION_MS, true, () => {
    // Fastest (correct) and longest answer, with their problem: "7 × 8 = 56 · 1.2 s".
    const all = answers.current
    const ok = all.filter((a) => a.correct)
    const show = (a: { task: string; ms: number }) => `${a.task} · ${fmtMs(a.ms)}`
    const fastest = ok.length ? ok.reduce((m, a) => (a.ms < m.ms ? a : m)) : undefined
    const longest = all.length ? all.reduce((m, a) => (a.ms > m.ms ? a : m)) : undefined
    onFinish({
      score: correct,
      ...(all.length === 0 && { failed: 'No answers — try again!' }), // idle run: shown, not saved
      details: {
        stats: [
          // Correct is the score itself, Fastest gets the problem below.
          ...answerStats(all).filter((s) => s.label !== 'Fastest answer' && s.label !== 'Correct'),
          ...(fastest ? [{ label: 'Fastest answer', value: show(fastest) }] : []),
          ...(longest ? [{ label: 'Longest answer', value: show(longest) }] : []),
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
    signal(ok)
    setProblem(makeProblem(levelFor(nextCorrect)))
    setInput('')
  }

  return (
    <>
      <GameInfo
        left={<InfoValue value={(remaining / 1000).toFixed(1)} unit="s left" />}
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
