import { useEffect, useRef, useState } from 'react'
import { AnswerButtons } from '../../components/game/AnswerButtons'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { PromptLayout } from '../../components/game/layouts'
import { feedbackRing, useAnswerFlash } from '../../lib/game'
import { useCountdown } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { answerStats } from '../../lib/resultFormat'
import { COLORS, DURATION_MS, averageTimes, nextTrial, stroopScore, type Answer } from './scoring'

/** How much slower different-color words were: "92 ms slower", "5 ms faster", "No difference". */
const slowdown = (ms: number) => {
  const r = Math.round(ms)
  return r === 0 ? 'No difference' : `${Math.abs(r)} ms ${r > 0 ? 'slower' : 'faster'}`
}

export default function StroopTest({ onFinish }: TestComponentProps) {
  const [trial, setTrial] = useState(() => nextTrial(undefined))
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [flash, signal] = useAnswerFlash()
  // When the current word appeared, and every answer's timing (no re-render needed).
  const shownAt = useRef(0)
  useEffect(() => {
    shownAt.current = performance.now() // the first word is on screen from now on
  }, [])
  const answers = useRef<Answer[]>([])

  const remaining = useCountdown(DURATION_MS, true, () => {
    const { matchMs, mismatchMs } = averageTimes(answers.current)
    const fmt = (ms: number | undefined) => (ms === undefined ? '–' : `${Math.round(ms)} ms`)
    onFinish({
      score: stroopScore(correct, wrong),
      details: {
        stats: answerStats(answers.current),
        extra: {
          kind: 'pair',
          a: { label: 'Same color', value: fmt(matchMs) },
          b: { label: 'Different color', value: fmt(mismatchMs) },
          ...(matchMs !== undefined && mismatchMs !== undefined && {
            diff: { label: 'Difference', value: slowdown(mismatchMs - matchMs) },
          }),
        },
      },
    })
  })


  const answer = (color: number) => {
    if (remaining <= 0) return
    const now = performance.now()
    const ok = color === trial.ink
    answers.current.push({ ms: now - shownAt.current, congruent: trial.word === trial.ink, correct: ok })
    shownAt.current = now
    if (ok) setCorrect((c) => c + 1)
    else setWrong((w) => w + 1)
    signal(ok)
    setTrial((t) => nextTrial(t))
  }

  return (
    <>
      <GameInfo
        left={<InfoValue value={(remaining / 1000).toFixed(1)} unit="s left" />}
        middle="Click the color of the ink"
        right={<InfoValue label="Score" value={stroopScore(correct, wrong)} />}
        timer={remaining / DURATION_MS}
      />
      <PromptLayout
        displayClassName={feedbackRing(flash)}
        display={
          <span className="text-7xl font-black tracking-wider" style={{ color: COLORS[trial.ink].hex }}>
            {COLORS[trial.word].label}
          </span>
        }
        answers={
          <AnswerButtons
            columns={2}
            disabled={remaining <= 0}
            options={COLORS.map((c, i) => ({ label: c.label, key: String(i + 1), onPress: () => answer(i) }))}
          />
        }
      />
    </>
  )
}
