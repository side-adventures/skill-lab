import { useEffect, useState } from 'react'
import { GameInfo, InfoValue, Lives } from '../../components/game/GameInfo'
import { PromptLayout } from '../../components/game/layouts'
import { NumberPad } from '../../components/NumberPad'
import { END_MOMENT_MS, feedbackRing, useAnswerFlash, useLater } from '../../lib/game'
import type { TestComponentProps } from '../types'
import { DIGIT_MS, GAP_MS, LIVES, START_DIGITS, makeSequence, reversed, spanScore } from './scoring'

type Phase = 'show' | 'input' | 'correct' | 'wrong'

export default function BackwardSpanTest({ onFinish }: TestComponentProps) {
  const [digits, setDigits] = useState(START_DIGITS)
  const [seq, setSeq] = useState(() => makeSequence(START_DIGITS))
  const [phase, setPhase] = useState<Phase>('show')
  // Which digit is on screen during 'show' (null = the gap between two digits).
  const [shown, setShown] = useState<number | null>(null)
  const [input, setInput] = useState('')
  const [answer, setAnswer] = useState('')
  const [lives, setLives] = useState(LIVES)
  const [flash, signal] = useAnswerFlash()
  const { later } = useLater()

  // Play the digits one by one, then ask for them.
  useEffect(() => {
    if (phase !== 'show') return
    const step = DIGIT_MS + GAP_MS
    for (let i = 0; i < seq.length; i++) {
      later(GAP_MS + i * step, () => setShown(i))
      later(GAP_MS + i * step + DIGIT_MS, () => setShown(null))
    }
    later(seq.length * step + GAP_MS, () => setPhase('input'))
  }, [phase, seq, later])

  const score = spanScore(digits)

  const play = (length: number) => {
    setDigits(length)
    setSeq(makeSequence(length))
    setInput('')
    setShown(null)
    setPhase('show')
  }

  const submit = (value: string) => {
    if (phase !== 'input') return
    setAnswer(value)
    const ok = value === reversed(seq)
    signal(ok)
    if (ok) {
      setPhase('correct')
      later(900, () => play(digits + 1))
      return
    }
    setPhase('wrong')
    setLives(lives - 1)
    if (lives - 1 > 0) return later(END_MOMENT_MS, () => play(digits))
    later(END_MOMENT_MS, () => onFinish({ score, details: { extra: { kind: 'digits', target: reversed(seq), typed: value } } }))
  }

  const big = 'font-mono text-5xl font-bold tracking-[0.18em] break-all'
  const target = reversed(seq)
  return (
    <>
      <GameInfo
        left={<><InfoValue value={digits} unit="digits" /><Lives left={lives} total={LIVES} /></>}
        middle={
          <span className={phase === 'wrong' ? 'text-rose-300' : ''}>
            {phase === 'show' ? 'Remember the digits'
              : phase === 'input' ? 'Type them in reverse order, then Enter'
              : phase === 'correct' ? 'Correct'
              : lives > 0 ? 'Not quite · new digits, same length' : 'Out of lives'}
          </span>
        }
        right={<InfoValue label="Score" value={score} />}
      />
      <PromptLayout
        displayClassName={feedbackRing(flash)}
        display={
          <div className="w-full px-8 text-center">
            {phase === 'show' && <p className="font-mono text-8xl font-bold text-zinc-50">{shown === null ? '' : seq[shown]}</p>}
            {(phase === 'input' || phase === 'correct') && (
              <>
                <p className="mb-3 text-zinc-500">Last digit first</p>
                <p className={`${big} min-h-14 text-violet-300`}>{input || <span className="text-zinc-700">_</span>}</p>
              </>
            )}
            {phase === 'wrong' && (
              <div className="space-y-3 font-mono text-4xl font-bold break-all">
                <p><span className="mr-3 font-sans text-sm font-normal text-zinc-500">Shown</span>{seq}</p>
                <p><span className="mr-3 font-sans text-sm font-normal text-zinc-500">Reversed</span>{target}</p>
                <p>
                  <span className="mr-3 font-sans text-sm font-normal text-zinc-500">You</span>
                  {[...answer].map((d, i) => <span key={i} className={d === target[i] ? '' : 'text-rose-400 line-through'}>{d}</span>)}
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
