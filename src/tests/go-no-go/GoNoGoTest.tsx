import { useEffect, useRef, useState } from 'react'
import { GetReady } from '../../components/GetReady'
import { useActionKey } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { MAX_WAIT_MS, MIN_WAIT_MS, WINDOW_MS, makeTrials, totalMs, type Stats } from './scoring'

type Stage = 'blank' | 'stim' | 'feedback'
type Feedback = 'hit' | 'false' | 'early' | 'miss' | null

export default function GoNoGoTest({ onFinish }: TestComponentProps) {
  const [started, setStarted] = useState(false)
  const [trials] = useState(makeTrials)
  const [i, setI] = useState(0)
  const [stage, setStage] = useState<Stage>('blank')
  const [feedback, setFeedback] = useState<Feedback>(null)
  const stats = useRef<Stats>({ rts: [], misses: 0, falseTaps: 0 })
  const stimAt = useRef(0)

  const advance = () => {
    if (i + 1 >= trials.length) {
      const s = stats.current
      const avg = s.rts.length ? Math.round(s.rts.reduce((a, b) => a + b, 0) / s.rts.length) : 0
      return onFinish({
        score: totalMs(s),
        details: { 'Avg reaction': `${avg} ms`, 'Tapped on red / too early': String(s.falseTaps), 'Missed greens': String(s.misses) },
      })
    }
    setI(i + 1)
    setStage('blank')
  }

  useEffect(() => {
    if (!started) return
    let t: number | undefined
    if (stage === 'blank') {
      t = window.setTimeout(() => {
        stimAt.current = performance.now()
        setFeedback(null)
        setStage('stim')
      }, MIN_WAIT_MS + Math.random() * (MAX_WAIT_MS - MIN_WAIT_MS))
    } else if (stage === 'stim') {
      t = window.setTimeout(() => {
        if (trials[i]) {
          stats.current.misses++
          setFeedback('miss')
        }
        advance()
      }, WINDOW_MS)
    } else {
      t = window.setTimeout(advance, 250)
    }
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, i, stage])

  const tap = () => {
    if (!started) return
    if (stage === 'blank') {
      stats.current.falseTaps++
      setFeedback('early')
    } else if (stage === 'stim') {
      if (trials[i]) {
        stats.current.rts.push(performance.now() - stimAt.current)
        setFeedback('hit')
      } else {
        stats.current.falseTaps++
        setFeedback('false')
      }
      setStage('feedback')
    }
  }
  useActionKey(tap, started)

  if (!started) return <GetReady onDone={() => setStarted(true)} />

  const fb: Record<Exclude<Feedback, null>, [string, string]> = {
    hit: ['✓', 'text-emerald-500'],
    false: ['✗ Not on red!', 'text-rose-500'],
    early: ['Too early', 'text-amber-500'],
    miss: ['Missed', 'text-amber-500'],
  }
  const showStim = stage === 'stim' || (stage === 'feedback' && feedback === 'false')
  return (
    <div>
      <div className="mb-3 flex justify-between text-sm text-zinc-500">
        <span>{i + 1} / {trials.length}</span>
        <span>Mistakes: {stats.current.misses + stats.current.falseTaps}</span>
      </div>
      <button
        type="button"
        onPointerDown={(e) => e.button === 0 && tap()}
        onKeyDown={(e) => e.preventDefault()}
        className="play-area flex h-[60vh] max-h-[480px] min-h-[300px] w-full flex-col items-center justify-center rounded-2xl bg-white dark:bg-zinc-900"
      >
        <span
          className={`size-40 rounded-full transition-opacity duration-75 sm:size-48 ${trials[i] ? 'bg-emerald-500' : 'bg-rose-600'} ${showStim ? 'opacity-100' : 'opacity-0'}`}
        />
        <span className={`mt-6 h-8 text-2xl font-bold ${feedback ? fb[feedback][1] : ''}`}>{feedback && fb[feedback][0]}</span>
      </button>
    </div>
  )
}
