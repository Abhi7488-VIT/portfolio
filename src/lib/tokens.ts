/**
 * tokens.ts: read colour tokens from CSS for canvas drawing.
 * Canvas can't use var(); this resolves a token to a string the 2D context accepts, and re-resolves
 * whenever the theme attribute on <html> changes.
 */
let probe: CanvasRenderingContext2D | null = null

function normalise(color: string, fallback: string) {
  if (!probe) probe = document.createElement('canvas').getContext('2d')
  if (!probe) return fallback
  probe.fillStyle = fallback
  probe.fillStyle = color.trim()
  return probe.fillStyle as string
}

export function readColor(token: string, fallback = '#888888') {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token)
  return raw ? normalise(raw, fallback) : fallback
}

/** Call `cb` whenever the theme changes. Returns a disconnect function. */
export function onThemeChange(cb: () => void) {
  const mo = new MutationObserver((list) => {
    if (list.some((m) => m.attributeName === 'data-theme')) cb()
  })
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => mo.disconnect()
}
