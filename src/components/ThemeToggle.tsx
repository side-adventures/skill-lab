import { useEffect, useRef, useState } from 'react'
import { getTheme, nextTheme, saveTheme, watchSystemTheme, type Theme } from '../lib/theme'

const LABEL: Record<Theme, string> = { system: 'Auto', light: 'Light', dark: 'Dark' }

function ThemeIcon({ theme }: { theme: Theme }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (theme === 'light')
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    )
  if (theme === 'dark')
    return (
      <svg {...common}>
        <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
      </svg>
    )
  return ( // auto: half-filled circle
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
    </svg>
  )
}

/** Header button: Auto (device setting) → Light → Dark. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getTheme)
  const current = useRef(theme)
  useEffect(() => {
    current.current = theme
  }, [theme])
  useEffect(() => watchSystemTheme(() => current.current), [])

  const cycle = () => {
    const t = nextTheme(theme)
    saveTheme(t)
    setTheme(t)
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${LABEL[theme]}. Switch to ${LABEL[nextTheme(theme)]}`}
      title={`Theme: ${LABEL[theme]}`}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
    >
      <ThemeIcon theme={theme} />
      <span className="w-9 text-left">{LABEL[theme]}</span>
    </button>
  )
}
