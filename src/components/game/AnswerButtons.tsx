import { useEffect } from 'react'
import { useLatest } from '../../lib/hooks'

export interface AnswerOption {
  label: string
  /** Keyboard key that also triggers it (shown in the button), e.g. '1', 's'. */
  key: string
  onPress: () => void
  primary?: boolean
}

/** Large answer buttons with their key shown inside; reacts on pointerdown and on the key. */
export function AnswerButtons({ options, columns, disabled }: { options: AnswerOption[]; columns?: number; disabled?: boolean }) {
  const latest = useLatest({ options, disabled })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || latest.current.disabled || e.ctrlKey || e.metaKey || e.altKey) return
      const opt = latest.current.options.find((o) => o.key.toLowerCase() === e.key.toLowerCase())
      if (!opt) return
      e.preventDefault()
      opt.onPress()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [latest])

  return (
    <div className="mx-auto grid max-w-xl gap-3" style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.label}
          type="button"
          disabled={disabled}
          onPointerDown={(e) => {
            if (e.button !== 0) return
            e.preventDefault()
            o.onPress()
          }}
          className={`flex h-14 items-center justify-between rounded-xl px-5 text-lg font-bold tracking-wider transition-colors active:scale-[0.98] disabled:opacity-40 ${
            o.primary ? 'bg-violet-600 text-white hover:bg-violet-500' : 'border border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-zinc-600'
          }`}
        >
          <span>{o.label}</span>
          <kbd className={`rounded-md border px-1.5 text-xs font-medium ${o.primary ? 'border-white/30 text-white/80' : 'border-zinc-700 text-zinc-500'}`}>
            {o.key.toUpperCase()}
          </kbd>
        </button>
      ))}
    </div>
  )
}
