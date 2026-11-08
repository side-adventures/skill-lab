import { useEffect, useRef, useState } from 'react'
import { useActionKey } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { ROUNDS, randomDelay, summarize } from './scoring'

type State =
  | { name: 'ready' }   // waiting for the player to start the round
  | { name: 'waiting' } // red, timer running
  | { name: 'go' }      // green, measuring
  | { name: 'early' }   // tapped too soon
  | { name: 'shown'; ms: number }

export default function ReactionTest({ onFinish }: TestComponentProps) {
  const [state, setState] = useState<State>({ name: 'ready' })
  const [times, setTimes] = useState<number[]>([])
  const goAt = useRef(0)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const startRound = () => {
    setState({ name: 'waiting' })
    timer.current = window.setTimeout(() => {
      goAt.current = performance.now()
      setState({ name: 'go' })
    }, randomDelay())
  }

  const handlePress = () => {
    switch (state.name) {
      case 'ready':
      case 'early':
        return startRound()
      case 'waiting':
        window.clearTimeout(timer.current)
        return setState({ name: 'early' })
      case 'go': {
        const ms = performance.now() - goAt.current
        const next = [...times, ms]
        setTimes(next)
        setState({ name: 'shown', ms })
        return
      }
      case 'shown': {
        if (times.length >= ROUNDS) {
          const { score, best, worst } = summarize(times)
          return onFinish({
            score,
            details: {
              Fastest: `${best} ms`,
              Slowest: `${worst} ms`,
              Rounds: times.map((t) => Math.round(t)).join(' · '),
            },
          })
        }
        return startRound()
      }
    }
  }

  // Space / Enter also work, for keyboard players.
  useActionKey(handlePress)

  const round = Math.min(times.length + (state.name === 'shown' ? 0 : 1), ROUNDS)
  const view = VIEWS[state.name]

  return (
    <div>
      <div className="mb-3 flex justify-between text-sm text-zinc-500">
        <span>Round {round} / {ROUNDS}</span>
        {times.length > 0 && <span>Avg so far: {summarize(times).score} ms</span>}
      </div>
      <button
        type="button"
        // pointerdown fires earlier than click => more accurate timing
        onPointerDown={(e) => {
          if (e.button === 0) handlePress()
        }}
        onClick={(e) => e.preventDefault()}
        onKeyDown={(e) => e.preventDefault()} // handled by window listener
        className={`play-area flex h-[60vh] max-h-[480px] min-h-[300px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl p-6 text-center text-white ${view.bg}`}
      >
        <span className="text-4xl font-bold sm:text-5xl">
          {state.name === 'shown' ? `${Math.round(state.ms)} ms` : view.title}
        </span>
        <span className="mt-3 text-lg opacity-90">
          {state.name === 'shown'
            ? times.length >= ROUNDS ? 'Tap to see your result' : 'Tap for the next round'
            : view.subtitle}
        </span>
      </button>
    </div>
  )
}

const VIEWS: Record<State['name'], { bg: string; title: string; subtitle: string }> = {
  ready: { bg: 'bg-sky-600', title: 'Tap to start', subtitle: 'Then wait for green' },
  waiting: { bg: 'bg-rose-600', title: 'Wait for green…', subtitle: '' },
  go: { bg: 'bg-emerald-500', title: 'TAP!', subtitle: '' },
  early: { bg: 'bg-amber-500', title: 'Too soon!', subtitle: 'Tap to retry this round' },
  shown: { bg: 'bg-sky-600', title: '', subtitle: '' },
}
