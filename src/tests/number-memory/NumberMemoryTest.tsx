import { useState } from 'react'
import { GameInfo, InfoValue, Lives } from '../../components/game/GameInfo'
import { PromptLayout } from '../../components/game/layouts'
import { NumberPad } from '../../components/NumberPad'
import { END_MOMENT_MS, feedbackRing, useAnswerFlash, useLater } from '../../lib/game'
import { useCountdown } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { LIVES, START_DIGITS, makeNumber, showMs } from './scoring'

type Phase = 'show' | 'input' | 'correct' | 'wrong'

const PHASE_TEXT: Record<Phase, string> = {
  show: 'Memorize',
  input: 'Type it, then Enter',
  correct: 'Correct',
  wrong: 'Not quite', // with or without a life left: see the info row
}

export default function NumberMemoryTest({ onFinish }: TestComponentProps) {
  const [digits, setDigits] = useState(START_DIGITS)
  const [number, setNumber] = useState(() => makeNumber(START_DIGITS))
  const [phase, setPhase] = useState<Phase>('show')
  const [input, setInput] = useState('')
  const [answer, setAnswer] = useState('')
  const [lives, setLives] = useState(LIVES)
  const [flash, signal] = useAnswerFlash()
  const { later } = useLater()

  // Memorize time, shown as the timer line in the info row.
  const showLeft = useCountdown(showMs(digits), phase === 'show', () => setPhase('input'))

  const score = digits - 1 >= START_DIGITS ? digits - 1 : 0

  /** Next number with this many digits. */
  const play = (length: number) => {
    setDigits(length)
    setNumber(makeNumber(length))
    setInput('')
    setPhase('show')
  }

  const submit = (value: string) => {
    if (phase !== 'input') return
    setAnswer(value)
    const ok = value === number
    signal(ok)
    if (ok) {
      setPhase('correct')
      later(900, () => play(digits + 1))
    } else {
      setPhase('wrong')
      setLives(lives - 1)
      // The number and your input side by side, then a new number of the same length, or the result.
      if (lives - 1 > 0) return later(END_MOMENT_MS, () => play(digits))
      later(END_MOMENT_MS, () =>
        onFinish({
          score,
          details: { extra: { kind: 'digits', target: number, typed: value } },
        }),
      )
    }
  }

  const big = 'font-mono text-5xl font-bold tracking-[0.18em] break-all'
  return (
    <>
      <GameInfo
        left={<><InfoValue value={digits} unit="digits" /><Lives left={lives} total={LIVES} /></>}
        middle={
          <span className={phase === 'wrong' ? 'text-rose-300' : ''}>
            {phase === 'wrong' ? (lives > 0 ? 'Not quite · new number, same length' : 'Out of lives') : PHASE_TEXT[phase]}
          </span>
        }
        right={<InfoValue label="Score" value={score} />}
        timer={phase === 'show' ? showLeft / showMs(digits) : undefined}
      />
      <PromptLayout
        displayClassName={feedbackRing(flash)}
        display={
          <div className="w-full px-8 text-center">
            {phase === 'show' && <p className={big}>{number}</p>}
            {(phase === 'input' || phase === 'correct') && (
              <>
                <p className="mb-3 text-zinc-500">What was the number?</p>
                <p className={`${big} min-h-14 text-violet-300`}>{input || <span className="text-zinc-700">_</span>}</p>
              </>
            )}
            {phase === 'wrong' && (
              <div className="space-y-3 font-mono text-4xl font-bold break-all">
                <p><span className="mr-3 font-sans text-sm font-normal text-zinc-500">Number</span>{number}</p>
                <p>
                  <span className="mr-3 font-sans text-sm font-normal text-zinc-500">You</span>
                  {[...answer].map((d, i) => (
                    <span key={i} className={d === number[i] ? '' : 'text-rose-400 line-through'}>{d}</span>
                  ))}
                </p>
              </div>
            )}
          </div>
        }
        answers={
          <div className={phase === 'show' ? 'opacity-30' : ''}>
            <NumberPad value={input} onChange={setInput} onSubmit={submit} maxLength={digits} disabled={phase !== 'input'} layout="row" />
          </div>
        }
      />
    </>
  )
}
