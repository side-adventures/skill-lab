export function testUrl(testId: string, base = window.location.href.split('#')[0]) {
  return `${base}#/test/${testId}`
}

export function buildShareText(testName: string, formattedScore: string) {
  return `I scored ${formattedScore} on ${testName} at Skill Lab — can you beat it?`
}

/** Web Share API where available (mostly mobile), else clipboard. Returns what happened. */
export async function shareResult(text: string, url: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (navigator.share) {
      await navigator.share({ text, url })
      return 'shared'
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return 'failed'
  }
  try {
    await navigator.clipboard.writeText(`${text} ${url}`)
    return 'copied'
  } catch {
    return 'failed'
  }
}
