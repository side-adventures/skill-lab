import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { FullLayout } from '../../components/game/layouts'
import { RoundResult } from '../../components/game/RoundResult'
import { feedbackRing, useAnswerFlash, useLater } from '../../lib/game'
import { useLatest } from '../../lib/hooks'
import { median } from '../reaction/scoring'
import type { TestComponentProps } from '../types'
import {
  BLOCKS, MAX_TOO_SOON, MIN_REACTION_MS, TRIALS_PER_BLOCK, blockTargets, choiceScore, msPerDoubling, randomWait, retryLater,
  type BlockResult,
} from './scoring'

type Stage = 'wait' | 'go' | 'early' | 'wrong' | 'blockDone'

const PHASE: Record<Stage, string> = {
  wait: 'Wait for a square to light up',
  go: 'Click it!',
  early: 'Too soon',
  wrong: 'Wrong square · this one comes again later',
  blockDone: '',
}

export default function ChoiceReactionTest({ onFinish }: TestComponentProps) {
  const [block, setBlock] = useState(0)
  const [targets, setTargets] = useState(() => blockTargets(BLOCKS[0]))
  const [stage, setStage] = useState<Stage>('wait')
  const [wrongAt, setWrongAt] = useState<number | null>(null)
  // The block just finished, for the screen between blocks.
  const [lastBlock, setLastBlock] = useState<BlockResult | null>(null)
  const results = useRef<BlockResult[]>([])
  const [done, setDone] = useState(0) // correct trials in this block
  const goAt = useRef(0)
  const tooSoon = useRef(0)
  const [flash, signal] = useAnswerFlash()
  const { later, cancel } = useLater()
  const timer = useRef<number | undefined>(undefined)

  const choices = BLOCKS[block]
  const current = () => (results.current[block] ??= { choices, times: [], wrong: 0 })

  const startWait = () => {
    setStage('wait')
    setWrongAt(null)
    goAt.current = 0
    cancel(timer.current)
    timer.current = later(randomWait(), () => setStage('go'))
  }
  const startRef = useLatest(startWait)
  useEffect(() => startRef.current(), [startRef])

  // The clock starts on the frame that paints the lit square.
  useLayoutEffect(() => {
    if (stage !== 'go') return
    const id = requestAnimationFrame(() => (goAt.current = performance.now()))
    return () => cancelAnimationFrame(id)
  }, [stage])

  const finish = () => {
    const blocks = results.current
    const slope = msPerDoubling(blocks)
    const wrong = blocks.reduce((s, b) => s + b.wrong, 0)
    onFinish({
      score: choiceScore(blocks),
      details: {
        stats: [
          { label: 'Each doubling of choices', value: slope === undefined ? '–' : `${slope >= 0 ? '+' : '−'}${Math.abs(Math.round(slope))} ms` },
          { label: 'Wrong squares', value: String(wrong) },
          { label: 'Too soon', value: `${tooSoon.current}×` },
        ],
        extra: {
          kind: 'table',
          columns: ['Squares', 'Median', 'Fastest', 'Wrong'],
          rows: blocks.map((b) => ({
            cells: [String(b.choices), `${Math.round(median(b.times))} ms`, `${Math.round(Math.min(...b.times))} ms`, String(b.wrong)],
            dim: b.choices === 1, // not in the score
          })),
        },
      },
    })
  }

  const early = () => {
    cancel(timer.current)
    tooSoon.current++
    if (tooSoon.current > MAX_TOO_SOON) {
      return onFinish({ score: 0, failed: 'Too many early clicks', details: { stats: [{ label: 'Too soon', value: `${tooSoon.current}×` }] } })
    }
    setStage('early')
    signal(false)
    later(700, startWait)
  }

  const press = (square: number) => {
    if (stage === 'wait') return early()
    if (stage !== 'go') return
    if (!goAt.current) return early() // not painted yet
    const ms = performance.now() - goAt.current
    if (ms < MIN_REACTION_MS) return early()
    const target = targets[0]
    if (square !== target) {
      current().wrong++
      setTargets(retryLater(targets.slice(1), target))
      setWrongAt(square)
      setStage('wrong')
      signal(false)
      later(700, startWait)
      return
    }
    current().times.push(ms)
    signal(true)
    const rest = targets.slice(1)
    setTargets(rest)
    setDone(done + 1)
    if (rest.length) return startWait()
    if (block + 1 < BLOCKS.length) {
      setLastBlock({ ...current(), times: [...current().times] })
      return setStage('blockDone')
    }
    finish()
  }

  const nextBlock = () => {
    const b = block + 1
    setBlock(b)
    setTargets(blockTargets(BLOCKS[b]))
    setDone(0)
    startWait()
  }

  // Keys 1–4 press the squares (Space also works with one square).
  const pressRef = useLatest(press)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      const n = e.code === 'Space' && choices === 1 ? 0 : Number(e.key) - 1
      if (!(n >= 0 && n < choices)) return
      e.preventDefault()
      pressRef.current(n)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [choices, pressRef])

  const lit = stage === 'go' ? targets[0] : -1
  const b = lastBlock
  return (
    <>
      <GameInfo
        left={<InfoValue value={`${choices} ${choices === 1 ? 'square' : 'squares'}`} unit={`· ${Math.min(done + 1, TRIALS_PER_BLOCK)} / ${TRIALS_PER_BLOCK}`} />}
        middle={<span className={stage === 'early' || stage === 'wrong' ? 'text-rose-300' : ''}>{PHASE[stage]}</span>}
        right={<InfoValue label="Block" value={block + 1} of={BLOCKS.length} />}
      />
      <FullLayout className={`grid place-items-center bg-zinc-900 ${feedbackRing(flash)}`}>
        {stage === 'blockDone' && b ? (
          <RoundResult
            value={Math.round(median(b.times))}
            unit="ms"
            line={`Median with ${choices} ${choices === 1 ? 'square' : 'squares'} · next: ${BLOCKS[block + 1]} squares`}
            onContinue={nextBlock}
          />
        ) : (
          <div className="flex gap-8">
            {Array.from({ length: choices }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Square ${i + 1}${i === lit ? ', lit' : ''}`}
                onPointerDown={(e) => e.button === 0 && press(i)}
                className={`relative grid size-32 cursor-pointer place-items-center rounded-2xl ${
                  i === lit ? 'bg-violet-500' : i === wrongAt ? 'bg-rose-700' : 'bg-zinc-700'
                }`}
              >
                {i === lit && <span className="size-10 rounded-full bg-white" />}
                <kbd className="absolute bottom-2 rounded-md border border-white/20 px-1.5 text-xs text-white/50">{i + 1}</kbd>
              </button>
            ))}
          </div>
        )}
      </FullLayout>
    </>
  )
}
