import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { useActionKey } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { GRID, ITEM_MS, LIT_MS, PASS_ACCURACY, START_N, blockAccuracy, isMatch, makeBlock } from './scoring'

type Phase = 'brief' | 'running' | 'passed'

export default function NBackTest({ onFinish }: TestComponentProps) {
  const [n, setN] = useState(START_N)
  const [phase, setPhase] = useState<Phase>('brief')
  const [seq, setSeq] = useState<number[]>([])
  const [index, setIndex] = useState(-1)
  const [lit, setLit] = useState(false)
  const [feedback, setFeedback] = useState<'hit' | 'false' | 'miss' | null>(null)
  const tapped = useRef<boolean[]>([])
  const results = useRef<{ n: number; acc: number }[]>([])

  // Run a block: one item every ITEM_MS, lit for LIT_MS.
  useEffect(() => {
    if (phase !== 'running') return
    const timers: number[] = []
    seq.forEach((_, i) => {
      timers.push(window.setTimeout(() => {
        // a match the player didn't tap on the previous item → show "missed"
        if (i > 0 && isMatch(seq, i - 1, n) && !tapped.current[i - 1]) setFeedback('miss')
        else setFeedback(null)
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
    setFeedback(isMatch(seq, index, n) ? 'hit' : 'false')
  }
  useActionKey(tapMatch, phase === 'running')

  if (phase !== 'running') {
    const last = results.current.at(-1)
    return (
      <div className="rounded-2xl bg-white p-6 text-center dark:bg-zinc-900">
        {phase === 'passed' && last && (
          <p className="mb-2 font-semibold text-emerald-500">{last.n}-back passed with {Math.round(last.acc * 100)} %!</p>
        )}
        <p className="text-5xl font-bold">{phase === 'passed' ? n + 1 : n}-back</p>
        <p className="mx-auto mt-3 max-w-sm text-zinc-500">
          Tap MATCH when the lit square is in the same place as {phase === 'passed' ? n + 1 : n} steps before.
          Reach {PASS_ACCURACY * 100} % to go up a level.
        </p>
        <Button className="mt-5" autoFocus onClick={() => startBlock(phase === 'passed' ? n + 1 : n)}>
          Start {phase === 'passed' ? n + 1 : n}-back
        </Button>
      </div>
    )
  }

  const fb = {
    hit: { text: 'Match ✓', cls: 'text-emerald-500' },
    false: { text: 'No match ✗', cls: 'text-rose-500' },
    miss: { text: 'Missed a match', cls: 'text-amber-500' },
  }
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex justify-between text-sm text-zinc-500">
        <span>{n}-back</span>
        <span>{Math.max(0, index + 1)} / {seq.length}</span>
      </div>
      {/* Grid on the left at full height, MATCH on the right. */}
      <div className="flex min-h-0 flex-1 items-center justify-center gap-10">
        <div
          className="grid aspect-square h-full gap-2 rounded-2xl bg-zinc-200 p-2 dark:bg-zinc-800"
          style={{ gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: GRID * GRID }, (_, i) => (
            <div key={i} className={`rounded-xl transition-colors duration-75 ${lit && seq[index] === i ? 'bg-violet-500' : 'bg-white dark:bg-zinc-700'}`} />
          ))}
        </div>
        <div className="play-area flex w-56 flex-col items-center gap-3">
          <button
            type="button"
            onPointerDown={tapMatch}
            className="h-28 w-full rounded-2xl bg-violet-600 text-xl font-bold tracking-wider text-white active:bg-violet-700"
          >
            MATCH
          </button>
          <p className={`h-6 text-center font-semibold ${feedback ? fb[feedback].cls : ''}`}>{feedback && fb[feedback].text}</p>
        </div>
      </div>
    </div>
  )

}
