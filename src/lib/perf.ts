/**
 * perf.ts: device tiering and a live frame-rate governor.
 *
 * Effects ask `getQuality()` before deciding particle counts and pixel ratio, and subscribe to
 * changes: if the average frame time stays bad for ~2 seconds, quality drops one level and stays
 * there for the session. Nothing ever upgrades mid-session (that would cause visible popping).
 */
import { onFrame } from './gsap'

export type Quality = 'high' | 'medium' | 'low'

type NavigatorWithHints = Navigator & {
  deviceMemory?: number
  connection?: { saveData?: boolean }
}

function initialQuality(): Quality {
  if (typeof window === 'undefined') return 'medium'
  const nav = navigator as NavigatorWithHints
  const cores = nav.hardwareConcurrency ?? 4
  const memory = nav.deviceMemory ?? 8
  const saveData = nav.connection?.saveData === true
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const small = window.innerWidth < 768
  if (saveData || cores <= 2 || memory <= 2) return 'low'
  if (coarse || small || cores <= 4 || memory <= 4) return 'medium'
  return 'high'
}

let quality: Quality = initialQuality()
const listeners = new Set<(q: Quality) => void>()

export const getQuality = () => quality

export function onQualityChange(cb: (q: Quality) => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** Pixel ratio cap per quality level. */
export const maxDpr = (q: Quality = quality) => (q === 'high' ? 2 : q === 'medium' ? 1.5 : 1)

let governorStarted = false

/** Start watching frame times. Called once from the app shell. */
export function startPerfGovernor() {
  if (governorStarted || typeof window === 'undefined') return
  governorStarted = true
  let avg = 16.7
  let badFor = 0
  onFrame((_t, delta) => {
    // Ignore tab-switch gaps.
    if (delta > 250 || document.hidden) return
    avg = avg * 0.94 + delta * 0.06
    if (avg > 24) badFor += delta
    else badFor = Math.max(0, badFor - delta * 0.5)
    if (badFor > 2000 && quality !== 'low') {
      quality = quality === 'high' ? 'medium' : 'low'
      badFor = 0
      listeners.forEach((l) => l(quality))
    }
  })
}
