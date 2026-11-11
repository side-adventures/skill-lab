import { useEffect, useRef, useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { SquarePanelLayout } from '../../components/game/layouts'
import { RoundResult } from '../../components/game/RoundResult'
import { TileGrid } from '../../components/game/TileGrid'
import { flashRing, useAnswerFlash } from '../../lib/game'
import { useActionKey } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { GRID, ITEM_MS, LIT_MS, PASS_ACCURACY, START_N, blockAccuracy, isMatch, makeBlock } from './scoring'

type Phase = 'brief' | 'running' | 'passed'

export default function NBackTest({ onFinish }: TestComponentProps) {
  const [n, setN] = useState(START_N)
  const [phase, setPhase] = useState<Phase>('running')
  const [seq, setSeq] = useState<number[]>(() => makeBlock(START_N))
  const [index, setIndex] = useState(-1)
  const [lit, setLit] = useState(false)
  const [feedback, setFeedback] = useState<'hit' | 'false' | 'miss' | null>(null)
  const [flash, signal] = useAnswerFlash()
  const tapped = useRef<boolean[]>([])
  const results = useRef<{ n: number; acc: number }[]>([])

  // Run a block: one item every ITEM_MS, lit for LIT_MS.
  useEffect(() => {
    if (phase !== 'running') return
    const timers: number[] = []
    seq.forEach((_, i) => {
      timers.push(window.setTimeout(() => {
        // a match the player didn't tap on the previous item → show "missed"
        if (i > 0 && isMatch(seq, i - 1, n) && !tapped.current[i - 1]) {
          setFeedback('miss')
          signal(false)
        } else setFeedback(null)
        setIndex(i)
        setLit(true)
      }, i * ITEM_MS + 600))
      timers.push(window.setTimeout(() => setLit(false), i * ITEM_MS + 600 + LIT_MS))
    })
    timers.push(window.setTimeout(() => {
      const acc = blockAccuracy(seq, tapped.current, n)
      results.current.push({ n, acc })
      if (acc >= PASS_ACCURACY) return setPhase('passed')
      const passed = results.current.filter((r) => r.acc >= PASS_ACCURACY)
      onFinish({
        score: passed.length ? Math.max(...passed.map((r) => r.n)) : 0,
        details: Object.fromEntries(results.current.map((r) => [`${r.n}-back accuracy`, `${Math.round(r.acc * 100)} %`])),
      })
    }, seq.length * ITEM_MS + 600))
    return () => timers.forEach((t) => window.clearTimeout(t))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const startBlock = (level: number) => {
    setN(level)
    setSeq(makeBlock(level))
    tapped.current = []
    setIndex(-1)
    setFeedback(null)
    setPhase('running')
  }

  const tapMatch = () => {
    if (phase !== 'running' || index < 0 || tapped.current[index]) return
    tapped.current[index] = true
    const hit = isMatch(seq, index, n)
    setFeedback(hit ? 'hit' : 'false')
    signal(hit)
  }
  useActionKey(tapMatch, phase === 'running')

  const last = results.current.at(-1)
  const fb = { hit: 'Match', false: 'Not a match', miss: 'Missed a match' }
  return (
    <>
      <GameInfo
        left={<InfoValue value={`${n}-back`} />}
        middle={feedback ? <span className={feedback === 'hit' ? 'text-emerald-300' : 'text-rose-300'}>{fb[feedback]}</span> : ''}
        right={phase === 'running' && <InfoValue value={Math.max(0, index + 1)} of={seq.length} />}
      />
      <SquarePanelLayout
        boardClassName={flashRing(flash)}
        board={
          <TileGrid
            cols={GRID}
            tile={(i) => ({ tone: phase === 'running' && lit && seq[index] === i ? 'lit' : 'idle' })}
          />
        }
        panel={
          phase === 'passed' && last ? (
            <div className="grid flex-1 place-items-center">
              <RoundResult
                value={Math.round(last.acc * 100)}
                unit="%"
                line={`${last.n}-back passed · next: ${last.n + 1}-back`}
                onContinue={() => startBlock(n + 1)}
              />
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold">{n}-back</p>
              <p className="mt-2 text-zinc-400">Click MATCH when the lit square is in the same spot as {n} steps before.</p>
              <button
                type="button"
                onPointerDown={(e) => e.button === 0 && tapMatch()}
                className="mt-auto flex h-28 w-full items-center justify-between rounded-2xl bg-violet-600 px-6 text-2xl font-bold tracking-wider text-white transition-colors hover:bg-violet-500 active:bg-violet-700"
              >
                MATCH
                <kbd className="rounded-md border border-white/30 px-2 text-sm font-medium text-white/80">Space</kbd>
              </button>
            </>
          )
        }
      />
    </>
  )
}
