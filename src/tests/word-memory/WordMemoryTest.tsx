import { useEffect, useRef, useState } from 'react'
import { AnswerButtons } from '../../components/game/AnswerButtons'
import { GameInfo, InfoValue, Lives } from '../../components/game/GameInfo'
import { PromptLayout } from '../../components/game/layouts'
import { END_MOMENT_MS, feedbackRing, useAnswerFlash, useLater } from '../../lib/game'
import { fmtMs } from '../../lib/resultFormat'
import type { TestComponentProps } from '../types'
import { LIVES, nextWord } from './scoring'
import { WORDS } from './words'

export default function WordMemoryTest({ onFinish }: TestComponentProps) {
  const seen = useRef<string[]>([])
  const [current, setCurrent] = useState(() => nextWord(WORDS, [], undefined))
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(LIVES)
  const [flash, signal] = useAnswerFlash()
  const { later } = useLater()
  // For the result stats: when the current word appeared, answer times, mistakes per word kind.
  const shownAt = useRef(0)
  useEffect(() => {
    shownAt.current = performance.now()
  }, [])
  const answerMs = useRef<number[]>([])
  const wrongOn = useRef({ seen: 0, fresh: 0 })

  const answer = (saysSeen: boolean) => {
    if (lives <= 0) return
    const ok = saysSeen === current.isSeen
    const now = performance.now()
    answerMs.current.push(now - shownAt.current)
    shownAt.current = now
    if (!ok) wrongOn.current[current.isSeen ? 'seen' : 'fresh']++
    if (!current.isSeen) seen.current.push(current.word)
    const nextScore = ok ? score + 1 : score
    const nextLives = ok ? lives : lives - 1
    setScore(nextScore)
    setLives(nextLives)
    signal(ok)
    if (nextLives <= 0) {
      const ms = answerMs.current
      later(END_MOMENT_MS, () =>
        onFinish({
          score: nextScore,
          details: {
            stats: [
              { label: 'Different words', value: String(seen.current.length) },
              { label: 'Avg per answer', value: fmtMs(ms.reduce((a, b) => a + b, 0) / ms.length) },
              { label: 'Mistakes on seen words', value: String(wrongOn.current.seen) },
              { label: 'Mistakes on new words', value: String(wrongOn.current.fresh) },
            ],
          },
        }),
      )
      return
    }
    setCurrent(nextWord(WORDS, seen.current, current.word))
  }

  return (
    <>
      <GameInfo
        left={<Lives left={lives} total={LIVES} />}
        middle={lives <= 0 ? <span className="text-rose-300">Out of lives</span> : 'Seen it before in this test?'}
        right={<InfoValue label="Score" value={score} />}
      />
      <PromptLayout
        displayClassName={feedbackRing(flash)}
        display={<span className="text-6xl font-bold tracking-wide">{current.word}</span>}
        answers={
          <AnswerButtons
            disabled={lives <= 0}
            options={[
              { label: 'SEEN', key: 'ArrowLeft', onPress: () => answer(true) },
              { label: 'NEW', key: 'ArrowRight', onPress: () => answer(false) },
            ]}
          />
        }
      />
    </>
  )
}
