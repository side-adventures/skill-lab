import { useRef, useState } from 'react'
import { useActionKey } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { ROUNDS, errorPct, makeTargets, scoreRounds, signedErrorLabel } from './scoring'

type Phase = 'ready' | 'timing' | 'shown'
interface Round { target: number; actual: number }

export default function TimeEstimationTest({ onFinish }: TestComponentProps) {
  const [targets] = useState(makeTargets)
  const [rounds, setRounds] = useState<Round[]>([])
  const [phase, setPhase] = useState<Phase>('ready')
  const startedAt = useRef(0)

  const roundIndex = phase === 'shown' ? rounds.length - 1 : rounds.length
  const target = targets[roundIndex]
  const last = rounds[rounds.length - 1]

  const press = () => {
    if (phase === 'ready') {
      startedAt.current = performance.now()
      setPhase('timing')
    } else if (phase === 'timing') {
      const actual = (performance.now() - startedAt.current) / 1000
      setRounds([...rounds, { target, actual }])
      setPhase('shown')
    } else if (rounds.length >= ROUNDS) {
      onFinish({
        score: scoreRounds(rounds),
        details: Object.fromEntries(rounds.map((r, i) => [`Round ${i + 1} · ${r.target} s`, `${r.actual.toFixed(2)} s (${signedErrorLabel(r.target, r.actual)})`])),
      })
    } else {
      setPhase('ready')
    }
  }
  useActionKey(press)

  const bg = phase === 'timing' ? 'bg-violet-600' : 'bg-sky-600'
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex justify-between text-sm text-zinc-500">
        <span>Round {roundIndex + 1} / {ROUNDS}</span>
        {rounds.length > 0 && <span>Avg error so far: {scoreRounds(rounds).toFixed(1)} %</span>}
      </div>
      <button
        type="button"
        onPointerDown={(e) => e.button === 0 && press()}
        onKeyDown={(e) => e.preventDefault()}
        className={`play-area flex min-h-0 flex-1 w-full cursor-pointer flex-col items-center justify-center rounded-2xl p-6 text-center text-white transition-colors ${bg}`}
      >
        {phase === 'ready' && (
          <>
            <span className="text-lg opacity-90">Target</span>
            <span className="text-6xl font-bold tabular-nums">{target} s</span>
            <span className="mt-4 text-lg opacity-90">Tap to start the hidden timer</span>
          </>
        )}
        {phase === 'timing' && (
          <>
            <span className="text-lg opacity-90">Counting to {target} s…</span>
            <span className="mt-2 text-4xl font-bold">Tap to stop</span>
          </>
        )}
        {phase === 'shown' && last && (
          <>
            <span className="text-lg opacity-90">Target {last.target} s — you stopped at</span>
            <span className="text-6xl font-bold tabular-nums">{last.actual.toFixed(2)} s</span>
            <span className="mt-2 text-xl">
              {last.actual < last.target ? 'Too early' : 'Too late'} by {errorPct(last.target, last.actual).toFixed(1)} %
            </span>
            <span className="mt-4 opacity-90">{rounds.length >= ROUNDS ? 'Tap to see your result' : 'Tap for the next round'}</span>
          </>
        )}
      </button>
    </div>
  )
}
