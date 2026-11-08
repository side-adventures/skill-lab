import { useEffect, useRef, useState } from 'react'
import { GetReady } from '../../components/GetReady'
import { NumberPad } from '../../components/NumberPad'
import { TimerBar } from '../../components/TimerBar'
import { useCountdown } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { DURATION_MS, levelFor, makeProblem } from './scoring'

export default function MentalMathTest({ onFinish }: TestComponentProps) {
  const [started, setStarted] = useState(false)
  const [problem, setProblem] = useState(() => makeProblem(0))
  const [input, setInput] = useState('')
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null)
  const flashTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(flashTimer.current), [])

  const remaining = useCountdown(DURATION_MS, started, () => {
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
    setFlash(ok ? 'ok' : 'bad')
    window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(null), 250)
    setProblem(makeProblem(levelFor(nextCorrect)))
    setInput('')
  }

  if (!started) return <GetReady onDone={() => setStarted(true)} />

  const color = flash === 'ok' ? 'text-emerald-500' : flash === 'bad' ? 'text-rose-500' : ''
  return (
    <div>
      <TimerBar remaining={remaining} total={DURATION_MS}>
        ✓ {correct} · ✗ {wrong}
      </TimerBar>
      <div className="mb-4 rounded-2xl bg-white py-8 text-center dark:bg-zinc-900">
        <p className={`text-5xl font-bold tabular-nums transition-colors sm:text-6xl ${color}`}>
          {problem.a} {problem.op} {problem.b}
        </p>
        <p className="mt-4 h-10 text-4xl font-bold text-violet-600 tabular-nums dark:text-violet-400">
          {input || <span className="text-zinc-300 dark:text-zinc-700">?</span>}
        </p>
      </div>
      <NumberPad value={input} onChange={setInput} onSubmit={submit} maxLength={3} disabled={remaining <= 0} />
    </div>
  )
}
