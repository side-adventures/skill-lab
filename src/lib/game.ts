import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'

/** How long the "end moment" (what went wrong) stays before the result screen. */
export const END_MOMENT_MS = 1500
/** How long the light correct / wrong flash lasts. */
export const FLASH_MS = 220

/** Shared state between the game frame, its info row and the layouts. */
export interface GameFrameContext {
  infoSlot: HTMLElement | null
  setInfoWidth: (px: number | null) => void
}
export const GameContext = createContext<GameFrameContext>({ infoSlot: null, setInfoWidth: () => {} })
export const useGameFrame = () => useContext(GameContext)

/** Makes the info row as wide as `el` (single-square layout), back to full width on unmount. */
export function useInfoWidthOf(el: HTMLElement | null) {
  const { setInfoWidth } = useGameFrame()
  useLayoutEffect(() => {
    if (!el) return
    const update = () => setInfoWidth(el.offsetWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      ro.disconnect()
      setInfoWidth(null)
    }
  }, [el, setInfoWidth])
}

/**
 * setTimeout that is cleared automatically when the test unmounts (quit, restart).
 * `later(ms, fn)` returns the timer id; `cancel(id)` clears one.
 */
export function useLater() {
  const timers = useRef(new Set<number>())
  useEffect(() => {
    const set = timers.current
    return () => set.forEach((id) => window.clearTimeout(id))
  }, [])
  const later = useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id)
      fn()
    }, ms)
    timers.current.add(id)
    return id
  }, [])
  const cancel = useCallback((id: number | undefined) => {
    if (id === undefined) return
    window.clearTimeout(id)
    timers.current.delete(id)
  }, [])
  return { later, cancel }
}

export type Flash = 'ok' | 'bad' | null

/** Light correct / wrong feedback: `signal(true|false)` shows it for FLASH_MS. */
export function useAnswerFlash() {
  const [flash, setFlash] = useState<Flash>(null)
  const { later, cancel } = useLater()
  const timer = useRef<number | undefined>(undefined)
  const signal = useCallback(
    (ok: boolean) => {
      setFlash(ok ? 'ok' : 'bad')
      cancel(timer.current)
      timer.current = later(FLASH_MS, () => setFlash(null))
    },
    [later, cancel],
  )
  return [flash, signal] as const
}

/**
 * The one correct / wrong look for every test: a green / red ring around the display or board (never a
 * filled area, too bright in dark mode). Red is 5 % stronger because it reads weaker on dark backgrounds.
 */
export const FEEDBACK_RING = { ok: 'ring-emerald-400/60', bad: 'ring-rose-400/65' } as const

/** Ring classes for a feedback state: the answer flash (`useAnswerFlash`) or a board's success / fail. */
export const feedbackRing = (flash: Flash) =>
  `ring-2 transition-shadow duration-150 ${flash ? FEEDBACK_RING[flash] : 'ring-transparent'}`
