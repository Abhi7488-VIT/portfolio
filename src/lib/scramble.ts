/**
 * scramble.ts: decode text from noise to its final characters, on the shared frame loop.
 * Only textContent changes, inside elements whose width is already fixed, so nothing reflows.
 */
import { onFrame } from './gsap'

const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+<>/=?'
const pick = () => GLYPHS[(Math.random() * GLYPHS.length) | 0]

interface ScrambleOptions {
  /** Seconds each character spends as noise before it locks. */
  hold?: number
  /** Seconds between one character locking and the next. */
  stagger?: number
  /** Seconds before the first character starts. */
  delay?: number
  /** Swap the noise glyph every N ms (lower = busier). */
  churnMs?: number
  /** Keep each final letter on screen until its turn (for text already painted, e.g. pre-rendered). */
  fromVisible?: boolean
  onDone?: () => void
}

/**
 * Decode a list of single-character elements in order.
 * Each element's final character is read from `data-char`.
 */
export function scrambleChars(els: HTMLElement[], opts: ScrambleOptions = {}) {
  const { hold = 0.22, stagger = 0.035, delay = 0, churnMs = 45, fromVisible = false, onDone } = opts
  let elapsed = 0
  let lastChurn = 0
  let done = false
  els.forEach((el) => {
    if (!fromVisible) el.textContent = ' '
    el.dataset.state = 'idle'
  })
  const off = onFrame((_t, delta) => {
    if (done) return
    elapsed += delta / 1000
    const churn = elapsed * 1000 - lastChurn > churnMs
    if (churn) lastChurn = elapsed * 1000
    let locked = 0
    els.forEach((el, i) => {
      const start = delay + i * stagger
      const end = start + hold
      if (elapsed < start) return
      if (elapsed >= end) {
        if (el.dataset.state !== 'locked') {
          el.textContent = el.dataset.char ?? ''
          el.dataset.state = 'locked'
        }
        locked++
      } else {
        el.dataset.state = 'noise'
        if (churn) el.textContent = pick()
      }
    })
    if (locked === els.length) {
      done = true
      off()
      onDone?.()
    }
  })
  return () => {
    done = true
    off()
    els.forEach((el) => {
      el.textContent = el.dataset.char ?? ''
      el.dataset.state = 'locked'
    })
  }
}

/** Decode an element's text from whatever it shows now into `text` (ticker swaps). */
export function decodeTo(el: HTMLElement, text: string, opts: { duration?: number } = {}) {
  const duration = (opts.duration ?? 0.55) * 1000
  let elapsed = 0
  let lastChurn = 0
  const off = onFrame((_t, delta) => {
    elapsed += delta
    const p = Math.min(1, elapsed / duration)
    const locked = Math.floor(p * text.length)
    if (elapsed - lastChurn > 40 || p === 1) {
      lastChurn = elapsed
      let out = text.slice(0, locked)
      for (let i = locked; i < text.length; i++) out += text[i] === ' ' ? ' ' : pick()
      el.textContent = out
    }
    if (p === 1) {
      el.textContent = text
      off()
    }
  })
  return () => {
    off()
    el.textContent = text
  }
}

/** Type a string into an element character by character (boot log). */
export function typeText(el: HTMLElement, text: string, opts: { cps?: number; delay?: number; onDone?: () => void } = {}) {
  const { cps = 90, delay = 0, onDone } = opts
  let elapsed = 0
  let shown = -1
  el.textContent = ''
  const off = onFrame((_t, delta) => {
    elapsed += delta / 1000
    if (elapsed < delay) return
    const n = Math.min(text.length, Math.floor((elapsed - delay) * cps))
    if (n !== shown) {
      shown = n
      el.textContent = text.slice(0, n)
    }
    if (n >= text.length) {
      off()
      onDone?.()
    }
  })
  return () => {
    off()
    el.textContent = text
  }
}
