import { useEffect, useRef, useState } from 'react'
import { AnswerButtons } from '../../components/game/AnswerButtons'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { PromptLayout } from '../../components/game/layouts'
import { feedbackRing, useAnswerFlash } from '../../lib/game'
import { useCountdown } from '../../lib/hooks'
import { answerStats, slowdown } from '../../lib/resultFormat'
import type { TestComponentProps } from '../types'
import { DURATION_MS, arrowsOf, averageTimes, flankerScore, makeTrialSource, type Answer, type Dir } from './scoring'

function Arrow({ dir }: { dir: Dir }) {
  return (
    <svg viewBox="0 0 40 40" className="size-20 text-zinc-100" aria-hidden>
      <path
        d={dir === 'left' ? 'M34 20H8M18 9L7 20l11 11' : 'M6 20h26M22 9l11 11-11 11'}
        fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

export default function FlankerTest({ onFinish }: TestComponentProps) {
  const [next] = useState(() => makeTrialSource())
  const [trial, setTrial] = useState(() => next())
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [flash, signal] = useAnswerFlash()
  const shownAt = useRef(0)
  useEffect(() => {
    shownAt.current = performance.now()
  }, [])
  const answers = useRef<Answer[]>([])

  const remaining = useCountdown(DURATION_MS, true, () => {
    const { sameMs, mixedMs } = averageTimes(answers.current)
    const fmt = (ms: number | undefined) => (ms === undefined ? '–' : `${Math.round(ms)} ms`)
    onFinish({
      score: flankerScore(correct, wrong),
      ...(correct + wrong === 0 && { failed: 'No answers — try again!' }),
      details: {
        stats: answerStats(answers.current),
        extra: {
          kind: 'pair',
          a: { label: 'All the same way', value: fmt(sameMs) },
          b: { label: 'Middle one different', value: fmt(mixedMs) },
          ...(sameMs !== undefined && mixedMs !== undefined && { diff: { label: 'Difference', value: slowdown(mixedMs - sameMs) } }),
        },
      },
    })
  })

  const answer = (dir: Dir) => {
    if (remaining <= 0) return
    const now = performance.now()
    const ok = dir === trial.target
    answers.current.push({ ms: now - shownAt.current, congruent: trial.congruent, correct: ok })
    shownAt.current = now
    if (ok) setCorrect((c) => c + 1)
    else setWrong((w) => w + 1)
    signal(ok)
    setTrial(next())
  }

  const row = arrowsOf(trial)
  return (
    <>
      <GameInfo
        left={<InfoValue value={(remaining / 1000).toFixed(1)} unit="s left" />}
        middle="Which way does the middle arrow point?"
        right={<InfoValue label="Score" value={flankerScore(correct, wrong)} />}
        timer={remaining / DURATION_MS}
      />
      <PromptLayout
        displayClassName={feedbackRing(flash)}
        display={
          <div className="flex gap-1" aria-label={`Middle arrow points ${trial.target}`}>
            {row.map((d, i) => <Arrow key={i} dir={d} />)}
          </div>
        }
        answers={
          <AnswerButtons
            disabled={remaining <= 0}
            options={[
              { label: 'Left', key: 'ArrowLeft', onPress: () => answer('left') },
              { label: 'Right', key: 'ArrowRight', onPress: () => answer('right') },
            ]}
          />
        }
      />
    </>
  )
}
