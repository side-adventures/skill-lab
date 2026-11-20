import { useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { SquareLayout } from '../../components/game/layouts'
import { feedbackRing, useAnswerFlash, useLater } from '../../lib/game'
import { useCountdown } from '../../lib/hooks'
import { fmtMs, type TimedAnswer } from '../../lib/resultFormat'
import { correctMinusWrong } from '../../lib/scoring'
import type { TestComponentProps } from '../types'
import { DURATION_MS, levelOf, makePattern, quadrantBag, type Tile } from './scoring'

/** The three kinds at turn 0 (in a 100 × 100 tile): a diagonal half, a quarter circle, a half. */
const KIND_PATH = ['M0 0H100L0 100Z', 'M0 0H100A100 100 0 0 1 0 100Z', 'M0 0H100V50H0Z']
/** How long the found tile shows in green before the next pattern. */
const FOUND_MS = 300

function TileView({ tile }: { tile: Tile }) {
  return (
    <svg viewBox="0 0 100 100" className="size-full">
      <path d={KIND_PATH[tile.kind]} transform={`rotate(${tile.rot * 90} 50 50)`} className="fill-zinc-200" />
    </svg>
  )
}

export default function BrokenPatternTest({ onFinish }: TestComponentProps) {
  const [nextQuadrant] = useState(() => quadrantBag())
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [pattern, setPattern] = useState(() => makePattern(1, nextQuadrant()))
  const [shownAt, setShownAt] = useState(() => performance.now())
  const [wrongAt, setWrongAt] = useState<number | null>(null)
  const [found, setFound] = useState(false)
  const [answers, setAnswers] = useState<(TimedAnswer & { level: number })[]>([])
  const [flash, signal] = useAnswerFlash()
  const { later } = useLater()

  const remaining = useCountdown(DURATION_MS, true, () => {
    const found = answers.filter((a) => a.correct)
    onFinish({
      score: correctMinusWrong(correct, wrong),
      ...(answers.length === 0 && { failed: 'No clicks — try again!' }),
      details: {
        stats: [
          { label: 'Patterns', value: String(correct) },
          { label: 'Wrong clicks', value: String(wrong) },
          ...(found.length ? [{ label: 'Avg per pattern', value: fmtMs(found.reduce((t, a) => t + a.ms, 0) / found.length) }] : []),
          { label: 'Highest level', value: String(Math.max(1, ...answers.map((a) => a.level))) },
        ],
      },
    })
  })
  const over = remaining <= 0

  const click = (i: number) => {
    if (over || found) return
    const ms = performance.now() - shownAt
    if (i !== pattern.broken) {
      setWrong((w) => w + 1)
      setAnswers((xs) => [...xs, { ms, correct: false, level: pattern.level }])
      setWrongAt(i)
      signal(false)
      later(350, () => setWrongAt((w) => (w === i ? null : w)))
      return
    }
    const c = correct + 1
    setCorrect(c)
    setAnswers((xs) => [...xs, { ms, correct: true, level: pattern.level }])
    setFound(true)
    signal(true)
    later(FOUND_MS, () => {
      setFound(false)
      setWrongAt(null)
      setPattern(makePattern(levelOf(c), nextQuadrant()))
      setShownAt(performance.now())
    })
  }

  const n = pattern.size
  return (
    <>
      <GameInfo
        left={<><InfoValue value={(remaining / 1000).toFixed(1)} unit="s left" /><InfoValue label="Level" value={pattern.level} /></>}
        middle="Click the tile that breaks the pattern"
        right={<InfoValue label="Score" value={correctMinusWrong(correct, wrong)} />}
        timer={remaining / DURATION_MS}
      />
      <SquareLayout>
        <div className={`play-area size-full rounded-2xl bg-zinc-900 p-4 ${feedbackRing(flash)}`}>
          <div className="grid size-full gap-1.5" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
            {pattern.tiles.map((t, i) => (
              <button
                key={`${pattern.tiles.length}-${i}`}
                type="button"
                aria-label={`Tile ${i + 1}`}
                onPointerDown={(e) => e.button === 0 && click(i)}
                className={`cursor-pointer overflow-hidden rounded-[3px] bg-zinc-700/70 outline-2 -outline-offset-2 ${
                  i === wrongAt ? 'outline-rose-400' : found && i === pattern.broken ? 'outline-emerald-400' : 'outline-transparent'
                }`}
              >
                <TileView tile={t} />
              </button>
            ))}
          </div>
        </div>
      </SquareLayout>
    </>
  )
}
