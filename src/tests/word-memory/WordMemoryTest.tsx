import { useRef, useState } from 'react'
import { AnswerButtons } from '../../components/game/AnswerButtons'
import { GameInfo, InfoValue, Lives } from '../../components/game/GameInfo'
import { PromptLayout } from '../../components/game/layouts'
import { END_MOMENT_MS, flashRing, useAnswerFlash, useLater } from '../../lib/game'
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

  const answer = (saysSeen: boolean) => {
    if (lives <= 0) return
    const ok = saysSeen === current.isSeen
    if (!current.isSeen) seen.current.push(current.word)
    const nextScore = ok ? score + 1 : score
    const nextLives = ok ? lives : lives - 1
    setScore(nextScore)
    setLives(nextLives)
    signal(ok)
    if (nextLives <= 0) {
      later(END_MOMENT_MS, () => onFinish({ score: nextScore, details: { 'Different words shown': String(seen.current.length) } }))
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
        displayClassName={flashRing(flash)}
        display={<span className="text-6xl font-bold tracking-wide">{current.word}</span>}
        answers={
          <AnswerButtons
            disabled={lives <= 0}
            options={[
              { label: 'SEEN', key: 's', onPress: () => answer(true), primary: true },
              { label: 'NEW', key: 'n', onPress: () => answer(false) },
            ]}
          />
        }
      />
    </>
  )
}
