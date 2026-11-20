import { useEffect, useRef, useState, type ReactNode } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { useAnswerFlash, useContinue, useLater } from '../../lib/game'
import { useCountdown, useLatest } from '../../lib/hooks'
import { PasswordForm, type FormPhase } from '../password-memory/PasswordForm'
import type { TestComponentProps } from '../types'
import { LAB_SHOW_MS, hitRate, labPassword, loadLab, markLast, nextParts, saveLab, toRecord, type LabData } from './lab'

/** Saves the lab data as a JSON file. */
function download(data: LabData) {
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `password-lab-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const SMALL = 'relative h-9 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-300 hover:bg-zinc-800 active:bg-zinc-700'

/** A small button at the bottom left; its click doesn't also count as "click anywhere to continue". */
function SmallButton({ onPress, hint, children }: { onPress: () => void; hint?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      className={`${SMALL} ${hint ? 'pr-7' : ''}`}
      onPointerDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onPress()
      }}
    >
      {children}
      {hint && <span className="absolute top-0.5 right-1.5 text-[10px] text-zinc-500">{hint}</span>}
    </button>
  )
}

export default function PasswordLabTest({ onFinish }: TestComponentProps) {
  // Saved progress: every answer so far and the current number of parts, kept in this browser.
  const [data, setData] = useState<LabData>(() => loadLab())
  const [current, setCurrent] = useState(() => labPassword(data.parts))
  const [phase, setPhase] = useState<FormPhase>('show')
  const [input, setInput] = useState('')
  const [saved, setSaved] = useState(true)
  // Answers in this visit (the score shown at the end).
  const [session, setSession] = useState(0)
  const [flash, signal] = useAnswerFlash()
  const { later } = useLater()
  const inputStart = useRef(0)

  const showLeft = useCountdown(LAB_SHOW_MS, phase === 'show', () => {
    inputStart.current = performance.now()
    setPhase('input')
  })

  const next = (parts: number) => {
    setCurrent(labPassword(parts))
    setInput('')
    setPhase('show')
  }

  const submit = () => {
    if (phase !== 'input' || input === '') return
    const record = toRecord(current, input, performance.now() - inputStart.current)
    const updated: LabData = { ...data, parts: nextParts(data.parts, record.ok), records: [...data.records, record] }
    setData(updated)
    setSaved(saveLab(updated))
    setSession(session + 1)
    signal(record.ok)
    if (record.ok) {
      setPhase('correct')
      later(700, () => next(updated.parts))
    } else {
      setPhase('wrong')
    }
  }

  useContinue(() => next(data.parts), { enabled: phase === 'wrong' })

  // After a wrong answer: "Was a typo" (T) counts it as right, "Skip" (S) leaves it out. Then the next password.
  const mark = (kind: 'typo' | 'skip') => {
    if (phase !== 'wrong') return
    const updated = markLast(data, kind)
    setData(updated)
    setSaved(saveLab(updated))
    next(updated.parts)
  }
  const markRef = useLatest(mark)
  useEffect(() => {
    if (phase !== 'wrong') return
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 't' || e.key === 'T') markRef.current('typo')
      else if (e.key === 's' || e.key === 'S') markRef.current('skip')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, markRef])

  const finish = () =>
    onFinish({
      score: session,
      details: {
        stats: [
          { label: 'Saved in total', value: `${data.records.length} passwords` },
          { label: 'Right', value: `${hitRate(data.records)} %` },
          { label: 'Typos', value: String(data.records.filter((r) => r.typo).length) },
          { label: 'Skipped', value: String(data.records.filter((r) => r.skipped).length) },
          { label: 'Parts now', value: String(data.parts) },
        ],
      },
    })

  const total = data.records.length
  return (
    <>
      <GameInfo
        left={<InfoValue label="Parts" value={current.parts} />}
        middle={
          <span className={!saved ? 'text-amber-300' : phase === 'wrong' ? 'text-rose-300' : ''}>
            {!saved ? 'Not saved in this browser · use Download'
              : phase === 'show' ? 'Memorize'
              : phase === 'input' ? 'Type it, then Enter'
              : phase === 'correct' ? 'Saved'
              : 'No match'}
          </span>
        }
        right={<InfoValue label="Saved" value={total} unit={`· ${hitRate(data.records)} % right`} />}
        timer={phase === 'show' ? showLeft / LAB_SHOW_MS : undefined}
      />
      <PasswordForm
        phase={phase}
        target={current.password.text}
        input={input}
        onInput={setInput}
        onSubmit={submit}
        flash={flash}
        wrongHint="Click anywhere for the next password"
        footer={
          phase === 'wrong' ? (
            <>
              <SmallButton hint="T" onPress={() => mark('typo')}>Was a typo</SmallButton>
              <SmallButton hint="S" onPress={() => mark('skip')}>Skip</SmallButton>
            </>
          ) : (
            <>
              <SmallButton onPress={() => download(data)}>Download data</SmallButton>
              <SmallButton onPress={finish}>Finish</SmallButton>
            </>
          )
        }
      />
    </>
  )
}
