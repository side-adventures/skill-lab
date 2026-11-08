import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { NumberPad } from '../../components/NumberPad'
import type { TestComponentProps } from '../types'
import { DOT_RADIUS, FLASH_MS, ROUNDS, accuracy, placeDots, randomCount, scoreRounds, type Dot } from './scoring'

type Phase = 'ready' | 'flash' | 'answer' | 'feedback'
interface Round { actual: number; guess: number }

const newDots = () => placeDots(randomCount())

export default function QuickCountTest({ onFinish }: TestComponentProps) {
  const [dots, setDots] = useState<Dot[]>(newDots)
  const [phase, setPhase] = useState<Phase>('ready')
  const [guess, setGuess] = useState('')
  const [rounds, setRounds] = useState<Round[]>([])

  useEffect(() => {
    if (phase !== 'ready' && phase !== 'flash') return
    const t = window.setTimeout(() => setPhase(phase === 'ready' ? 'flash' : 'answer'), phase === 'ready' ? 900 : FLASH_MS)
    return () => window.clearTimeout(t)
  }, [phase])

  const submit = (value: string) => {
    setRounds([...rounds, { actual: dots.length, guess: Number(value) }])
    setPhase('feedback')
  }

  const next = () => {
    if (rounds.length >= ROUNDS) {
      return onFinish({
        score: scoreRounds(rounds),
        details: {
          Exact: `${rounds.filter((r) => r.actual === r.guess).length} / ${ROUNDS}`,
          'Avg off by': `${(rounds.reduce((s, r) => s + Math.abs(r.actual - r.guess), 0) / ROUNDS).toFixed(1)} dots`,
        },
      })
    }
    setDots(newDots())
    setGuess('')
    setPhase('ready')
  }

  // Enter advances from the feedback screen (NumberPad handles Enter while answering).
  useEffect(() => {
    if (phase !== 'feedback') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const last = rounds[rounds.length - 1]
  const roundNo = phase === 'feedback' ? rounds.length : rounds.length + 1
  const showDots = phase === 'flash' || phase === 'feedback'

  return (
    <div>
      <div className="mb-3 flex justify-between text-sm text-zinc-500">
        <span>Round {roundNo} / {ROUNDS}</span>
        {rounds.length > 0 && <span>Accuracy so far: {scoreRounds(rounds).toFixed(1)} %</span>}
      </div>
      <div className="relative mx-auto aspect-square w-full max-w-[min(420px,48vh)] rounded-2xl bg-white dark:bg-zinc-900">
        {showDots && (
          <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
            {dots.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={DOT_RADIUS} className={phase === 'feedback' ? 'fill-violet-400/60' : 'fill-violet-500'} />
            ))}
          </svg>
        )}
        {phase === 'ready' && <p className="absolute inset-0 grid place-items-center text-zinc-500">Get ready…</p>}
        {phase === 'answer' && <p className="absolute inset-0 grid place-items-center text-lg font-medium">How many dots?</p>}
        {phase === 'feedback' && last && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="rounded-xl bg-white/90 px-5 py-3 text-center shadow dark:bg-zinc-900/90">
              <p className="text-3xl font-bold tabular-nums">{last.actual} dots</p>
              <p className="text-zinc-500">
                You said {last.guess} · {accuracy(last.actual, last.guess).toFixed(0)} %
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        {phase === 'feedback' ? (
          <div className="text-center">
            <Button onClick={next} className="w-full max-w-xs">
              {rounds.length >= ROUNDS ? 'See result' : 'Next round'}
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-2 h-10 text-center text-3xl font-bold tabular-nums">{guess || <span className="text-zinc-400">–</span>}</p>
            <NumberPad value={guess} onChange={setGuess} onSubmit={submit} maxLength={2} disabled={phase !== 'answer'} />
          </>
        )}
      </div>
    </div>
  )
}
