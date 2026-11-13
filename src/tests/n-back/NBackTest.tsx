import { useEffect, useRef, useState } from 'react'
import { AnswerButtons } from '../../components/game/AnswerButtons'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { SquarePanelLayout } from '../../components/game/layouts'
import { RoundResult } from '../../components/game/RoundResult'
import { TileGrid } from '../../components/game/TileGrid'
import { feedbackRing, useAnswerFlash } from '../../lib/game'
import { useActionKey } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { GRID, ITEM_MS, LIT_MS, PASS_ACCURACY, START_N, accuracyPct, blockAccuracy, blockCounts, isMatch, makeBlock, runResult, type BlockResult } from './scoring'

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
  const results = useRef<BlockResult[]>([])

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
      results.current.push({ n, acc, clicked: tapped.current.some(Boolean), ...blockCounts(seq, tapped.current, n) })
      if (acc >= PASS_ACCURACY) return setPhase('passed')
      onFinish(runResult(results.current))
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
        left={phase === 'running' && <InfoValue value={`Item ${Math.max(1, index + 1)}`} of={seq.length} />}
        middle={feedback ? <span className={feedback === 'hit' ? 'text-emerald-300' : 'text-rose-300'}>{fb[feedback]}</span> : ''}
      />
      <SquarePanelLayout
        boardClassName={feedbackRing(flash)}
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
                value={accuracyPct(last.acc)}
                unit="%"
                line={`${last.n}-back passed · next: ${last.n + 1}-back`}
                onContinue={() => startBlock(n + 1)}
              />
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold">{n}-back</p>
              <p className="mt-2 text-zinc-400">Click MATCH when the lit square is in the same spot as {n} steps before.</p>
              <div className="mt-auto">
                {/* Space via the button's key; Enter also works (useActionKey). A double press is ignored by tapMatch. */}
                <AnswerButtons columns={1} options={[{ label: 'MATCH', key: ' ', onPress: tapMatch }]} disabled={phase !== 'running'} />
              </div>
            </>
          )
        }
      />
    </>
  )
}
