import { useEffect, useRef, useState } from 'react'
import { AnswerButtons } from '../../components/game/AnswerButtons'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { SquarePanelLayout } from '../../components/game/layouts'
import { feedbackRing, useAnswerFlash, useLater } from '../../lib/game'
import { fmtPct } from '../../lib/resultFormat'
import type { TestComponentProps } from '../types'
import {
  BLANK_MS, FIX_MS, GRID, ITEM, KINDS, SAMPLE_MS, START_STAIR, TRIALS, capacityScore, makeChangePlan, makeTrial, nextStair, rates,
  type Answer,
} from './scoring'

type Stage = 'fix' | 'sample' | 'blank' | 'test' | 'feedback'

const PHASE: Record<Stage, string> = {
  fix: '',
  sample: 'Remember them',
  blank: 'Remember them',
  test: 'Did one of them change?',
  feedback: '',
}

export default function ChangeDetectionTest({ onFinish }: TestComponentProps) {
  const [plan] = useState(makeChangePlan)
  const [stair, setStair] = useState(START_STAIR)
  const [t, setT] = useState(0)
  const [trial, setTrial] = useState(() => makeTrial(START_STAIR.size, plan[0]))
  const [stage, setStage] = useState<Stage>('fix')
  const answers = useRef<Answer[]>([])
  const [flash, signal] = useAnswerFlash()
  const { later } = useLater()

  // fix → sample → blank → test, for every trial.
  useEffect(() => {
    later(FIX_MS, () => setStage('sample'))
    later(FIX_MS + SAMPLE_MS, () => setStage('blank'))
    later(FIX_MS + SAMPLE_MS + BLANK_MS, () => setStage('test'))
  }, [t, later])

  const answer = (saidChange: boolean) => {
    if (stage !== 'test') return
    const change = trial.changed !== null
    const correct = change === saidChange
    answers.current.push({ size: trial.size, change, saidChange })
    signal(correct)
    setStage('feedback')
    if (t + 1 < TRIALS) {
      const next = nextStair(stair, correct)
      return later(400, () => {
        setStair(next)
        setTrial(makeTrial(next.size, plan[t + 1]))
        setStage('fix')
        setT(t + 1)
      })
    }
    // Last trial: let its flash show, then the result.
    later(400, () => {
      const a = answers.current
      const { hit, fa } = rates(a)
      onFinish({
        score: capacityScore(a),
        details: {
          stats: [
            { label: 'Changed boards right', value: fmtPct(hit) },
            { label: 'Same boards right', value: fmtPct(1 - fa) },
            { label: 'Most shapes', value: String(Math.max(...a.map((x) => x.size))) },
            { label: 'Shapes at the end', value: String(a[a.length - 1].size) },
          ],
        },
      })
    })
  }

  const visible = stage === 'sample' || stage === 'test' || stage === 'feedback'
  const size = `${(ITEM / GRID) * 100}%`
  return (
    <>
      <GameInfo
        left={<InfoValue value={`Trial ${t + 1}`} of={TRIALS} />}
        middle={PHASE[stage]}
      />
      <SquarePanelLayout
        boardClassName={feedbackRing(flash)}
        board={
          <>
            {visible &&
              trial.items.map((it, i) => {
                const kind = KINDS[stage !== 'sample' && i === trial.changed ? trial.newKind : it.kind]
                return (
                  <svg
                    key={i}
                    viewBox="0 0 24 24"
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${it.x * 100}%`, top: `${it.y * 100}%`, width: size, height: size }}
                    aria-label={kind.name}
                  >
                    <path d={kind.path} fill={kind.color} fillRule="evenodd" />
                  </svg>
                )
              })}
          </>
        }
        panel={
          <div className="flex h-full flex-col justify-between">
            <p className="text-sm text-zinc-400">Same shapes in the same places, or did one turn into a different shape?</p>
            {/* Wrapped in a block so the buttons stretch to the panel's full width. */}
            <div>
              <AnswerButtons
                columns={1}
                disabled={stage !== 'test'}
                options={[
                  { label: 'Same', key: 'ArrowUp', onPress: () => answer(false) },
                  { label: 'Changed', key: 'ArrowDown', onPress: () => answer(true) },
                ]}
              />
            </div>
          </div>
        }
      />
    </>
  )
}
