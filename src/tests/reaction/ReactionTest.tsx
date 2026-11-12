import { useRef, useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { FullLayout } from '../../components/game/layouts'
import { RoundResult } from '../../components/game/RoundResult'
import { useLater } from '../../lib/game'
import { useActionKey } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { ROUNDS, randomDelay, summarize } from './scoring'

type State =
  | { name: 'ready' }   // waiting for the player to start the round
  | { name: 'waiting' } // red, timer running
  | { name: 'go' }      // green, measuring
  | { name: 'early' }   // clicked too soon
  | { name: 'shown'; ms: number }

const VIEW: Record<Exclude<State['name'], 'shown'>, { bg: string; title: string; phase: string }> = {
  ready: { bg: 'bg-zinc-900', title: 'Click to start', phase: 'Click to start' },
  waiting: { bg: 'bg-rose-900', title: 'Wait for green…', phase: 'Wait for green' },
  go: { bg: 'bg-emerald-700', title: 'Click!', phase: 'Click!' },
  early: { bg: 'bg-amber-800', title: 'Too soon!', phase: 'Too soon · click to retry' },
}

export default function ReactionTest({ onFinish }: TestComponentProps) {
  const [state, setState] = useState<State>({ name: 'ready' })
  const [times, setTimes] = useState<number[]>([])
  const goAt = useRef(0)
  const { later, cancel } = useLater()
  const timer = useRef<number | undefined>(undefined)

  const startRound = () => {
    setState({ name: 'waiting' })
    timer.current = later(randomDelay(), () => {
      goAt.current = performance.now()
      setState({ name: 'go' })
    })
  }

  const press = () => {
    if (state.name === 'ready' || state.name === 'early') return startRound()
    if (state.name === 'waiting') {
      cancel(timer.current)
      return setState({ name: 'early' })
    }
    if (state.name === 'go') {
      const ms = performance.now() - goAt.current
      setTimes([...times, ms])
      setState({ name: 'shown', ms })
    }
    // 'shown': the round result handles "click anywhere"
  }
  useActionKey(press)

  const next = () => {
    if (times.length < ROUNDS) return startRound()
    const { score, best, worst } = summarize(times)
    onFinish({
      score,
      details: { Fastest: `${best} ms`, Slowest: `${worst} ms`, Rounds: times.map((t) => Math.round(t)).join(' · ') },
    })
  }

  const round = Math.min(times.length + (state.name === 'shown' ? 0 : 1), ROUNDS)
  return (
    <>
      <GameInfo
        left={<InfoValue value={`Round ${round}`} of={ROUNDS} />}
        middle={state.name === 'shown' ? '' : VIEW[state.name].phase}
        right={times.length > 0 && <InfoValue label="Average" value={summarize(times).score} unit="ms" />}
      />
      <FullLayout
        // pointerdown fires earlier than click → more accurate timing
        onPointerDown={(e) => e.button === 0 && press()}
        className={`grid cursor-pointer place-items-center text-center transition-colors duration-75 ${
          state.name === 'shown' ? 'bg-zinc-900' : `${VIEW[state.name].bg} text-white`
        }`}
      >
        {state.name === 'shown' ? (
          <RoundResult
            value={Math.round(state.ms)}
            unit="ms"
            line={`Round ${times.length} of ${ROUNDS}`}
            chips={{ done: times.map((t) => `${Math.round(t)} ms`), total: ROUNDS }}
            onContinue={next}
          />
        ) : (
          <span className="text-5xl font-bold">{VIEW[state.name].title}</span>
        )}
      </FullLayout>
    </>
  )
}
