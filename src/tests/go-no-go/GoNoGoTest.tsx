import { useEffect, useRef, useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { FullLayout } from '../../components/game/layouts'
import { feedbackRing, useAnswerFlash } from '../../lib/game'
import { useActionKey } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { MAX_WAIT_MS, MIN_WAIT_MS, WINDOW_MS, makeTrials, totalMs, type Stats } from './scoring'

type Stage = 'blank' | 'stim' | 'feedback'
type Feedback = 'hit' | 'false' | 'early' | 'miss' | null

export default function GoNoGoTest({ onFinish }: TestComponentProps) {
  const [flash, signal] = useAnswerFlash()
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
          signal(false)
        }
        advance()
      }, WINDOW_MS)
    } else {
      t = window.setTimeout(advance, 250)
    }
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, stage])

  const tap = () => {
    if (stage === 'blank') {
      stats.current.falseTaps++
      setFeedback('early')
      signal(false)
    } else if (stage === 'stim') {
      if (trials[i]) {
        stats.current.rts.push(performance.now() - stimAt.current)
        setFeedback('hit')
        signal(true)
      } else {
        stats.current.falseTaps++
        setFeedback('false')
        signal(false)
      }
      setStage('feedback')
    }
  }
  useActionKey(tap)

  const fb: Record<Exclude<Feedback, null>, string> = {
    hit: '',
    false: 'Not on red!',
    early: 'Too early',
    miss: 'Missed',
  }
  const showStim = stage === 'stim' || (stage === 'feedback' && feedback === 'false')
  return (
    <>
      <GameInfo
        left={<InfoValue value={i + 1} of={trials.length} />}
        middle={feedback ? <span className={feedback === 'hit' ? '' : 'text-rose-300'}>{fb[feedback]}</span> : ''}
        right={<InfoValue label="Mistakes" value={stats.current.misses + stats.current.falseTaps} />}
      />
      <FullLayout
        onPointerDown={(e) => e.button === 0 && tap()}
        className={`grid cursor-pointer place-items-center bg-zinc-900 ${feedbackRing(flash)}`}
      >
        {/* No fade: the color must never change while the circle is still (partly) visible. */}
        <span className={`size-48 rounded-full ${showStim ? (trials[i] ? 'bg-emerald-600' : 'bg-rose-700') : 'bg-transparent'}`} />
      </FullLayout>
    </>
  )
}
