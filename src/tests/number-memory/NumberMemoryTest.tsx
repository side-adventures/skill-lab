import { useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { PromptLayout } from '../../components/game/layouts'
import { NumberPad } from '../../components/NumberPad'
import { END_MOMENT_MS, flashRing, useAnswerFlash, useLater } from '../../lib/game'
import { useCountdown } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { START_DIGITS, makeNumber, showMs } from './scoring'

type Phase = 'show' | 'input' | 'correct' | 'wrong'

const PHASE_TEXT: Record<Phase, string> = {
  show: 'Memorize',
  input: 'Type it, then Enter',
  correct: 'Correct',
  wrong: 'Not quite',
}

export default function NumberMemoryTest({ onFinish }: TestComponentProps) {
  const [digits, setDigits] = useState(START_DIGITS)
  const [number, setNumber] = useState(() => makeNumber(START_DIGITS))
  const [phase, setPhase] = useState<Phase>('show')
  const [input, setInput] = useState('')
  const [answer, setAnswer] = useState('')
  const [flash, signal] = useAnswerFlash()
  const { later } = useLater()

  // Memorize time, shown as the timer line in the info row.
  const showLeft = useCountdown(showMs(digits), phase === 'show', () => setPhase('input'))

  const submit = (value: string) => {
    if (phase !== 'input') return
    setAnswer(value)
    const ok = value === number
    signal(ok)
    if (ok) {
      setPhase('correct')
      later(900, () => {
        setDigits(digits + 1)
        setNumber(makeNumber(digits + 1))
        setInput('')
        setPhase('show')
      })
    } else {
      setPhase('wrong')
      // End moment: the number and your input side by side, then the result.
      later(END_MOMENT_MS, () =>
        onFinish({
          score: digits - 1 >= START_DIGITS ? digits - 1 : 0,
          details: { 'Last number': number, 'You typed': value },
        }),
      )
    }
  }

  const big = 'font-mono text-5xl font-bold tracking-[0.18em] break-all'
  return (
    <>
      <GameInfo
        left={<InfoValue value={digits} unit="digits" />}
        middle={<span className={phase === 'wrong' ? 'text-rose-300' : ''}>{PHASE_TEXT[phase]}</span>}
        right={<InfoValue label="Score" value={digits - 1 >= START_DIGITS ? digits - 1 : 0} />}
        timer={phase === 'show' ? showLeft / showMs(digits) : undefined}
      />
      <PromptLayout
        displayClassName={flashRing(flash)}
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
