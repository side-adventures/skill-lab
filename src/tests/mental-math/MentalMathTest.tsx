import { useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { PromptLayout } from '../../components/game/layouts'
import { NumberPad } from '../../components/NumberPad'
import { flashRing, useAnswerFlash } from '../../lib/game'
import { useCountdown } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { DURATION_MS, levelFor, makeProblem } from './scoring'

export default function MentalMathTest({ onFinish }: TestComponentProps) {
  const [problem, setProblem] = useState(() => makeProblem(0))
  const [input, setInput] = useState('')
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [flash, signal] = useAnswerFlash()

  const remaining = useCountdown(DURATION_MS, true, () => {
    const total = correct + wrong
    onFinish({
      score: correct,
      details: {
        Wrong: String(wrong),
        Accuracy: total ? `${Math.round((correct / total) * 100)} %` : '–',
        'Avg per answer': correct ? `${(DURATION_MS / 1000 / correct).toFixed(1)} s` : '–',
      },
    })
  })

  const submit = (value: string) => {
    if (remaining <= 0) return
    const ok = Number(value) === problem.answer
    const nextCorrect = ok ? correct + 1 : correct
    if (ok) setCorrect(nextCorrect)
    else setWrong((w) => w + 1)
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
        displayClassName={flashRing(flash)}
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
