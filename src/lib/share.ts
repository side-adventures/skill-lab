export function testUrl(testId: string, base = window.location.href.split('#')[0]) {
  return `${base}#/test/${testId}`
}

export function buildShareText(testName: string, formattedScore: string) {
  return `I scored ${formattedScore} on ${testName} at Skill Lab — can you beat it?`
}

/** Phones / tablets: share sheet. Desktop browsers may have one too, but there people want a copy. */
const hasShareSheet = () =>
  typeof navigator.share === 'function' && window.matchMedia?.('(pointer: coarse)').matches

/** Share sheet on touch devices, otherwise copy to the clipboard. Returns what happened. */
export async function shareResult(text: string, url: string): Promise<'shared' | 'cancelled' | 'copied' | 'failed'> {
  try {
    if (hasShareSheet()) {
      await navigator.share({ text, url })
      return 'shared'
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled' // closed the share sheet
  }
  return (await copyText(`${text} ${url}`)) ? 'copied' : 'failed'
}

/**
 * Copies text to the clipboard. The async Clipboard API only exists on https / localhost, so on plain
 * http (e.g. testing from a phone via the LAN address) fall back to the old select-and-copy trick.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through to the legacy copy */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    ta.setSelectionRange(0, text.length) // iOS needs an explicit range
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  } catch {
    return false
  }
}

export const homeUrl = (base = window.location.href.split('#')[0]) => base

/** One message listing the player's best score for every test they've played. */
export function buildAllScoresText(scores: { icon: string; name: string; score: string }[]) {
  return [
    'My Skill Lab best scores:',
    ...scores.map((s) => `${s.icon} ${s.name}: ${s.score}`),
    'Can you beat them?',
  ].join('\n')
}
