/**
 * bus.ts: a tiny typed event bus so features can open each other without shared state
 * (the palette opens the chat, an easter egg opens contact, the nav opens the palette).
 */
type Events = {
  'palette:open': void
  'palette:toggle': void
  'chat:open': { question?: string } | void
}

export function emit<K extends keyof Events>(name: K, detail?: Events[K]) {
  window.dispatchEvent(new CustomEvent(`ak:${name}`, { detail }))
}

export function on<K extends keyof Events>(name: K, cb: (detail: Events[K]) => void) {
  const h = (e: Event) => cb((e as CustomEvent).detail)
  window.addEventListener(`ak:${name}`, h)
  return () => window.removeEventListener(`ak:${name}`, h)
}

/** Platform-correct shortcut label for the palette. */
export const paletteShortcut = () =>
  typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent) ? '⌘ K' : 'Ctrl K'
