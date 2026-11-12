import { useEffect, useRef, useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { FullLayout } from '../../components/game/layouts'
import { RoundResult } from '../../components/game/RoundResult'
import { useActionKey } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { ROUNDS, errorLabel, errorMs, makeRounds, scoreRounds, resultDetails, speedName } from './scoring'

type Phase = 'ready' | 'moving' | 'shown'

export default function StopTheBarTest({ onFinish }: TestComponentProps) {
  const [rounds] = useState(makeRounds)
  const [errors, setErrors] = useState<number[]>([])
  const [phase, setPhase] = useState<Phase>('ready')
  const [stopPos, setStopPos] = useState(0)
  const marker = useRef<HTMLDivElement>(null)
  const startAt = useRef(0)

  const roundIndex = phase === 'shown' ? errors.length - 1 : errors.length
  const round = rounds[roundIndex]

  const stop = (pos: number) => {
    const p = Math.min(1, pos)
    setStopPos(p)
    setErrors((e) => [...e, errorMs(p, round)])
    setPhase('shown')
  }

  // Animate the marker; position is computed from time, so the stop is frame-rate independent.
  useEffect(() => {
    if (phase !== 'moving') return
    let raf = 0
    const tick = () => {
      const pos = ((performance.now() - startAt.current) / 1000) * round.speed
      if (marker.current) marker.current.style.left = `${Math.max(0, Math.min(1, pos)) * 100}%`
      if (pos >= 1) return stop(1) // ran off the end: counts as late
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const press = () => {
    if (phase === 'ready') {
      startAt.current = performance.now() + 500 // short lead-in before it moves
      setPhase('moving')
    } else if (phase === 'moving') {
      const pos = ((performance.now() - startAt.current) / 1000) * round.speed
      if (pos > 0) stop(pos)
    }
    // 'shown': the round result handles "click anywhere"
  }
  useActionKey(press)

  const next = () => {
    if (errors.length < ROUNDS) return setPhase('ready')
    onFinish({
      score: scoreRounds(errors),
      details: resultDetails(rounds, errors),
    })
  }

  const last = errors.at(-1)
  return (
    <>
      <GameInfo
        left={<InfoValue value={`Round ${roundIndex + 1}`} of={ROUNDS} />}
        middle={phase === 'ready' ? 'Click to start' : phase === 'moving' ? 'Click to stop on the line' : ''}
        right={errors.length > 0 && <InfoValue label="Avg" value={scoreRounds(errors)} unit="ms off" />}
      />
      <FullLayout
        onPointerDown={(e) => e.button === 0 && press()}
        className="flex cursor-pointer flex-col justify-center gap-10 bg-zinc-900 px-10"
      >
        <div className="relative h-16 w-full rounded-xl bg-zinc-800">
          <div className="absolute -inset-y-2 w-1 -translate-x-1/2 rounded bg-emerald-500" style={{ left: `${round.target * 100}%` }} />
          <div
            ref={marker}
            className={`absolute inset-y-1 w-2 -translate-x-1/2 rounded ${phase === 'shown' ? 'bg-white' : 'bg-violet-500'}`}
            style={{ left: phase === 'shown' ? `${stopPos * 100}%` : phase === 'ready' ? '0%' : undefined }}
          />
        </div>
        <div className="grid h-44 place-items-center text-center">
          {phase === 'ready' && <p className="text-2xl font-semibold">Click to start, then click again to stop on the green line</p>}
          {phase === 'moving' && <p className="text-3xl font-semibold">Click to stop!</p>}
          {phase === 'shown' && last !== undefined && (
            <RoundResult
              value={errorLabel(last).replace(' ms', '')}
              unit="ms"
              line={`${last < 0 ? 'Too early' : 'Too late'} · ${speedName(round)} speed`}
              chips={{ done: errors.map((e) => errorLabel(e).replace(' ms', '')), total: ROUNDS }}
              onContinue={next}
            />
          )}
        </div>
      </FullLayout>
    </>
  )
}
