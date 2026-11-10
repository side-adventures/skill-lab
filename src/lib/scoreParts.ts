/**
 * Splits a formatted score into a big number and a small unit for display:
 * "245 ms" → { value: "245", unit: "ms" }, "Level 9" → { value: "9", unit: "level" }.
 * Anything else ("3-back", "Not passed") is shown whole as the value.
 */
export function scoreParts(formatted: string): { value: string; unit: string } {
  const level = formatted.match(/^Level (\d+)$/)
  if (level) return { value: level[1], unit: 'level' }
  const m = formatted.match(/^(-?\d+(?:\.\d+)?)\s+(.+)$/)
  return m ? { value: m[1], unit: m[2] } : { value: formatted, unit: '' }
}
