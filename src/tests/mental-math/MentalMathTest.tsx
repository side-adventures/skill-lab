import { useEffect, useRef, useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { PromptLayout } from '../../components/game/layouts'
import { NumberPad } from '../../components/NumberPad'
import { feedbackRing, useAnswerFlash } from '../../lib/game'
import { useCountdown } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { answerStats, fmtMs, type TimedAnswer } from '../../lib/resultFormat'
import { DURATION_MS, levelFor, makeProblem } from './scoring'

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
  const answers = useRef<TimedAnswer[]>([])

  const remaining = useCountdown(DURATION_MS, true, () => {
    const times = answers.current.map((a) => a.ms)
    onFinish({
      score: correct,
      details: {
        stats: [
          ...answerStats(answers.current),
          ...(times.length ? [{ label: 'Longest answer', value: fmtMs(Math.max(...times)) }] : []),
        ],
      },
    })
  })

  const submit = (value: string) => {
    if (remaining <= 0) return
    const ok = Number(value) === problem.answer
    const now = performance.now()
    answers.current.push({ ms: now - shownAt.current, correct: ok })
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
