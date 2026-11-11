import { useEffect, useRef, useState } from 'react'
import { useLatest } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { LIVES, nextWord } from './scoring'
import { WORDS } from './words'

export default function WordMemoryTest({ onFinish }: TestComponentProps) {
  const seen = useRef<string[]>([])
  const [current, setCurrent] = useState(() => nextWord(WORDS, [], undefined))
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(LIVES)
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null)
  const flashTimer = useRef<number | undefined>(undefined)
  const endTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => {
    window.clearTimeout(flashTimer.current)
    window.clearTimeout(endTimer.current)
  }, [])

  const answer = (saysSeen: boolean) => {
    if (lives <= 0) return
    const ok = saysSeen === current.isSeen
    if (!current.isSeen) seen.current.push(current.word)
    const nextScore = ok ? score + 1 : score
    const nextLives = ok ? lives : lives - 1
    setScore(nextScore)
    setLives(nextLives)
    setFlash(ok ? 'ok' : 'bad')
    window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(null), 250)
    if (nextLives <= 0) {
      endTimer.current = window.setTimeout(
        () => onFinish({ score: nextScore, details: { 'Different words shown': String(seen.current.length) } }),
        600,
      )
      return
    }
    setCurrent(nextWord(WORDS, seen.current, current.word))
  }

  // Keyboard: S = seen, N = new.
  const answerRef = useLatest(answer)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.key.toLowerCase() === 's') answerRef.current(true)
      if (e.key.toLowerCase() === 'n') answerRef.current(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answerRef])

  const ring = flash === 'ok' ? 'ring-emerald-500' : flash === 'bad' ? 'ring-rose-500' : 'ring-transparent'
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex justify-between text-sm text-zinc-500">
        <span>Score {score}</span>
        <span aria-label={`${lives} lives left`}>
          {'♥'.repeat(Math.max(0, lives))}
          <span className="opacity-30">{'♥'.repeat(LIVES - Math.max(0, lives))}</span>
        </span>
      </div>
      <div className={`grid min-h-0 flex-1 place-items-center rounded-2xl bg-white ring-4 transition-shadow dark:bg-zinc-900 ${ring}`}>
        <span className="text-4xl font-bold tracking-wide sm:text-5xl">{current.word}</span>
      </div>
      <p className="my-3 text-center text-sm text-zinc-500">Have you seen this word before in this test?</p>
      <div className="play-area grid grid-cols-2 gap-3">
        <button type="button" onPointerDown={() => answer(true)} className="h-16 rounded-xl bg-violet-600 text-lg font-bold tracking-wider text-white active:bg-violet-700">
          SEEN <kbd className="ml-1 hidden text-xs opacity-60 sm:inline">S</kbd>
        </button>
        <button type="button" onPointerDown={() => answer(false)} className="h-16 rounded-xl bg-zinc-200 text-lg font-bold tracking-wider active:bg-zinc-300 dark:bg-zinc-800 dark:active:bg-zinc-700">
          NEW <kbd className="ml-1 hidden text-xs opacity-60 sm:inline">N</kbd>
        </button>
      </div>
    </div>
  )
}
