/** Light / dark mode. "system" follows the device setting; the choice is remembered per browser. */
export type Theme = 'system' | 'light' | 'dark'

export const THEMES: Theme[] = ['system', 'light', 'dark']
// Keep in sync with the inline script in index.html (it applies the theme before React loads).
const KEY = 'skill-lab:theme'

const systemDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false

export function getTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

export const isDark = (t: Theme) => (t === 'system' ? systemDark() : t === 'dark')

export function applyTheme(t: Theme) {
  const dark = isDark(t)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

export function saveTheme(t: Theme) {
  try {
    if (t === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, t)
  } catch {
    /* storage unavailable: the choice just isn't remembered */
  }
  applyTheme(t)
}

export const nextTheme = (t: Theme): Theme => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length]

/** Re-applies the theme when the device switches while "system" is selected. Returns an unsubscribe. */
export function watchSystemTheme(getCurrent: () => Theme) {
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
  if (!mq) return () => {}
  const onChange = () => getCurrent() === 'system' && applyTheme('system')
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}
