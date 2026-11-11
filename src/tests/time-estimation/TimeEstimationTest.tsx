import { useRef, useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { FullLayout } from '../../components/game/layouts'
import { RoundResult } from '../../components/game/RoundResult'
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
    }
    // 'shown': the round result handles "click anywhere"
  }
  useActionKey(press)

  const next = () => {
    if (rounds.length < ROUNDS) return setPhase('ready')
    onFinish({
      score: scoreRounds(rounds),
      details: Object.fromEntries(rounds.map((r, i) => [`Round ${i + 1} · ${r.target} s`, `${r.actual.toFixed(2)} s (${signedErrorLabel(r.target, r.actual)})`])),
    })
  }

  return (
    <>
      <GameInfo
        left={<InfoValue value={`Round ${roundIndex + 1}`} of={ROUNDS} />}
        middle={phase === 'ready' ? 'Click to start the hidden timer' : phase === 'timing' ? 'Click when the time is up' : ''}
        right={rounds.length > 0 && <InfoValue label="Avg error" value={scoreRounds(rounds).toFixed(1)} unit="%" />}
      />
      <FullLayout
        onPointerDown={(e) => e.button === 0 && press()}
        className={`grid cursor-pointer place-items-center text-center transition-colors ${phase === 'timing' ? 'bg-violet-600 text-white' : 'bg-zinc-900'}`}
      >
        {phase === 'ready' && (
          <div>
            <p className="text-zinc-400">Target</p>
            <p className="text-7xl font-bold tabular-nums">{target} s</p>
          </div>
        )}
        {phase === 'timing' && (
          <div>
            <p className="text-white/80">Counting to {target} s…</p>
            <p className="mt-2 text-4xl font-bold">Click to stop</p>
          </div>
        )}
        {phase === 'shown' && last && (
          <RoundResult
            value={last.actual.toFixed(2)}
            unit="s"
            line={`Target ${last.target} s · ${errorPct(last.target, last.actual).toFixed(1)} % ${last.actual < last.target ? 'too early' : 'too late'}`}
            chips={{ done: rounds.map((r) => signedErrorLabel(r.target, r.actual)), total: ROUNDS }}
            onContinue={next}
          />
        )}
      </FullLayout>
    </>
  )
}
