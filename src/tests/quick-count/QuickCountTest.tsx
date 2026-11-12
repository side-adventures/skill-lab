import { useEffect, useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { SquarePanelLayout } from '../../components/game/layouts'
import { RoundResult } from '../../components/game/RoundResult'
import { NumberPad } from '../../components/NumberPad'
import type { TestComponentProps } from '../types'
import { DOT_RADIUS, FLASH_MS, ROUNDS, accuracy, makeCounts, placeDots, resultDetails, scoreRounds, type Dot } from './scoring'

type Phase = 'ready' | 'flash' | 'answer' | 'feedback'
interface Round { actual: number; guess: number }

const MIDDLE: Record<Phase, string> = { ready: 'Look at the board', flash: 'Look at the board', answer: 'How many dots?', feedback: '' }
/** How long the board is marked before the dots flash, so your eyes are back on it in time. */
const READY_MS = 1000

export default function QuickCountTest({ onFinish }: TestComponentProps) {
  const [counts] = useState(makeCounts)
  const [dots, setDots] = useState<Dot[]>(() => placeDots(counts[0]))
  const [phase, setPhase] = useState<Phase>('ready')
  const [guess, setGuess] = useState('')
  const [rounds, setRounds] = useState<Round[]>([])

  useEffect(() => {
    if (phase !== 'ready' && phase !== 'flash') return
    const t = window.setTimeout(() => setPhase(phase === 'ready' ? 'flash' : 'answer'), phase === 'ready' ? READY_MS : FLASH_MS)
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
        // Before each flash the board lights its frame and shows a fixation cross: look here now.
        boardClassName={`ring-2 transition-shadow duration-200 ${phase === 'ready' ? 'ring-violet-400/70' : 'ring-transparent'}`}
        board={
          <>
            {phase === 'ready' && (
              <span className="absolute inset-0 grid place-items-center text-5xl font-light text-violet-300">+</span>
            )}
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
              <p className="text-sm text-zinc-500">{phase === 'answer' ? 'Your guess' : '← Look at the board'}</p>
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
