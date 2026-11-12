import { useEffect, useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { SquarePanelLayout } from '../../components/game/layouts'
import { RoundResult } from '../../components/game/RoundResult'
import { NumberPad } from '../../components/NumberPad'
import type { TestComponentProps } from '../types'
import { DOT_RADIUS, FLASH_MS, ROUNDS, accuracy, makeCounts, placeDots, resultDetails, scoreRounds, type Dot } from './scoring'

type Phase = 'ready' | 'flash' | 'answer' | 'feedback'
interface Round { actual: number; guess: number }

const MIDDLE: Record<Phase, string> = { ready: 'Look', flash: 'Look', answer: 'How many dots?', feedback: '' }

export default function QuickCountTest({ onFinish }: TestComponentProps) {
  const [counts] = useState(makeCounts)
  const [dots, setDots] = useState<Dot[]>(() => placeDots(counts[0]))
  const [phase, setPhase] = useState<Phase>('ready')
  const [guess, setGuess] = useState('')
  const [rounds, setRounds] = useState<Round[]>([])

  useEffect(() => {
    if (phase !== 'ready' && phase !== 'flash') return
    const t = window.setTimeout(() => setPhase(phase === 'ready' ? 'flash' : 'answer'), phase === 'ready' ? 700 : FLASH_MS)
    return () => window.clearTimeout(t)
  }, [phase])

  const submit = (value: string) => {
    if (phase !== 'answer') return
    setRounds([...rounds, { actual: dots.length, guess: Number(value) }])
    setPhase('feedback')
  }

  const next = () => {
    if (rounds.length >= ROUNDS) {
      return onFinish({
        score: scoreRounds(rounds),
        details: resultDetails(rounds),
      })
    }
    setDots(placeDots(counts[rounds.length]))
    setGuess('')
    setPhase('ready')
  }

  const last = rounds[rounds.length - 1]
  const roundNo = phase === 'feedback' ? rounds.length : rounds.length + 1
  const showDots = phase === 'flash' || phase === 'feedback'
  return (
    <>
      <GameInfo
        left={<InfoValue value={`Round ${roundNo}`} of={ROUNDS} />}
        middle={MIDDLE[phase]}
        right={rounds.length > 0 && <InfoValue label="Accuracy" value={scoreRounds(rounds).toFixed(1)} unit="%" />}
      />
      <SquarePanelLayout
        board={
          <>
            {showDots && (
              <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
                {dots.map((d, i) => (
                  <circle key={i} cx={d.x} cy={d.y} r={DOT_RADIUS} className={phase === 'feedback' ? 'fill-violet-400/40' : 'fill-violet-500'} />
                ))}
              </svg>
            )}
            {phase === 'feedback' && last && (
              <p className="absolute inset-x-0 bottom-3 text-center text-sm text-zinc-300">{last.actual} dots</p>
            )}
          </>
        }
        panel={
          phase === 'feedback' && last ? (
            <div className="grid flex-1 place-items-center">
              <RoundResult
                value={accuracy(last.actual, last.guess).toFixed(0)}
                unit="%"
                line={`You said ${last.guess} · it was ${last.actual}`}
                onContinue={next}
              />
            </div>
          ) : (
            <>
              <p className="text-sm text-zinc-500">Your guess</p>
              <p className="h-16 text-6xl font-bold tabular-nums">{guess || <span className="text-zinc-700">–</span>}</p>
              <div className={`mt-auto ${phase === 'answer' ? '' : 'opacity-30'}`}>
                <NumberPad value={guess} onChange={setGuess} onSubmit={submit} maxLength={2} disabled={phase !== 'answer'} />
              </div>
            </>
          )
        }
      />
    </>
  )
}
