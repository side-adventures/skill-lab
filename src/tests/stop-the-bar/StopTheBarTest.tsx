import { useEffect, useRef, useState } from 'react'
import { useActionKey } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { ROUNDS, errorLabel, errorMs, makeRounds, scoreRounds } from './scoring'

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
    } else if (errors.length >= ROUNDS) {
      onFinish({
        score: scoreRounds(errors),
        details: Object.fromEntries(errors.map((e, i) => [`Round ${i + 1} · ${rounds[i].speed >= 0.8 ? 'fast' : rounds[i].speed >= 0.6 ? 'medium' : 'slow'}`, errorLabel(e)])),
      })
    } else setPhase('ready')
  }
  useActionKey(press)

  const last = errors.at(-1)
  return (
    <div>
      <div className="mb-3 flex justify-between text-sm text-zinc-500">
        <span>Round {roundIndex + 1} / {ROUNDS}</span>
        {errors.length > 0 && <span>Avg so far: {scoreRounds(errors)} ms</span>}
      </div>
      <button
        type="button"
        onPointerDown={(e) => e.button === 0 && press()}
        onKeyDown={(e) => e.preventDefault()}
        className="play-area flex h-[50vh] max-h-[420px] min-h-[260px] w-full cursor-pointer flex-col justify-center gap-8 rounded-2xl bg-white px-6 dark:bg-zinc-900"
      >
        <div className="relative h-16 w-full rounded-xl bg-zinc-200 dark:bg-zinc-800">
          <div className="absolute inset-y-[-8px] w-1 -translate-x-1/2 rounded bg-emerald-500" style={{ left: `${round.target * 100}%` }} />
          <div
            ref={marker}
            className={`absolute inset-y-1 w-2 -translate-x-1/2 rounded ${phase === 'shown' ? 'bg-zinc-900 dark:bg-white' : 'bg-violet-500'}`}
            style={{ left: phase === 'shown' ? `${stopPos * 100}%` : phase === 'ready' ? '0%' : undefined }}
          />
        </div>
        <div className="text-center">
          {phase === 'ready' && <p className="text-xl font-semibold">Tap to start — then tap again to stop on the green line</p>}
          {phase === 'moving' && <p className="text-xl font-semibold">Tap to stop!</p>}
          {phase === 'shown' && last !== undefined && (
            <>
              <p className="text-4xl font-bold tabular-nums">{errorLabel(last)}</p>
              <p className="text-zinc-500">{last < 0 ? 'early' : 'late'} · {errors.length >= ROUNDS ? 'tap to see your result' : 'tap for the next round'}</p>
            </>
          )}
        </div>
      </button>
    </div>
  )
}
