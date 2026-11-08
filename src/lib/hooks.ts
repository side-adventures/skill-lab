import { useEffect, useRef, useState } from 'react'

/** Always-current reference to a callback, safe to call from timers/listeners. */
export function useLatest<T>(value: T) {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  })
  return ref
}

/** Calls handler on Space/Enter (no auto-repeat). */
export function useActionKey(handler: () => void, enabled = true) {
  const latest = useLatest(handler)
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter') && !e.repeat) {
        e.preventDefault()
        latest.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, latest])
}

/**
 * Counts down durationMs while `running`; returns remaining ms (rounded to 0.1 s)
 * and calls onEnd once when it reaches zero.
 */
export function useCountdown(durationMs: number, running: boolean, onEnd: () => void) {
  const [remaining, setRemaining] = useState(durationMs)
  const onEndRef = useLatest(onEnd)
  useEffect(() => {
    if (!running) return
    const end = performance.now() + durationMs
    let raf = 0
    const tick = () => {
      const left = Math.max(0, end - performance.now())
      setRemaining(Math.ceil(left / 100) * 100)
      if (left <= 0) return onEndRef.current()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running, durationMs, onEndRef])
  return remaining
}
