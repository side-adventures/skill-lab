import { useRef, useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { useAnswerFlash, useContinue, useLater } from '../../lib/game'
import { useCountdown } from '../../lib/hooks'
import { PasswordForm, type FormPhase } from '../password-memory/PasswordForm'
import type { TestComponentProps } from '../types'
import { LAB_SHOW_MS, hitRate, labPassword, loadLab, nextParts, saveLab, toRecord, type LabData } from './lab'

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

const SMALL = 'h-9 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-300 hover:bg-zinc-800 active:bg-zinc-700'

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

  const finish = () =>
    onFinish({
      score: session,
      details: {
        stats: [
          { label: 'Saved in total', value: `${data.records.length} passwords` },
          { label: 'Right', value: `${hitRate(data.records)} %` },
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
          <>
            <button
              type="button"
              className={SMALL}
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                download(data)
              }}
            >
              Download data
            </button>
            <button
              type="button"
              className={SMALL}
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                finish()
              }}
            >
              Finish
            </button>
          </>
        }
      />
    </>
  )
}
