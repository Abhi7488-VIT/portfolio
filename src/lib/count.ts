/**
 * count.ts: animate a number in an element's text up from zero to its written value.
 * Keeps prefixes and suffixes ("~1,700", "+2.12", "90+", "10 bps") and the original formatting.
 * The element's width is locked first so the counting digits never shift the layout.
 */
import { gsap } from './gsap'
import { gsapEase } from './motion'

export function parseFigure(text: string) {
  const m = text.match(/^(\D*?)(-?[\d,]*\.?\d+)(.*)$/)
  if (!m) return null
  const [, prefix, num, suffix] = m
  const decimals = num.includes('.') ? num.split('.')[1].length : 0
  const grouped = num.includes(',')
  return { prefix, value: parseFloat(num.replace(/,/g, '')), decimals, grouped, suffix }
}

export function formatFigure(v: number, f: NonNullable<ReturnType<typeof parseFigure>>) {
  const fixed = v.toFixed(f.decimals)
  const body = f.grouped ? Number(fixed).toLocaleString('en-US', { minimumFractionDigits: f.decimals, maximumFractionDigits: f.decimals }) : fixed
  return `${f.prefix}${body}${f.suffix}`
}

export function animateCount(el: HTMLElement, opts: { from?: number; duration?: number } = {}) {
  const final = el.dataset.final ?? el.textContent ?? ''
  el.dataset.final = final
  const f = parseFigure(final)
  if (!f) return
  el.style.minWidth = `${el.getBoundingClientRect().width}px`
  el.style.display = el.style.display || 'inline-block'
  const state = { v: opts.from ?? 0 }
  gsap.to(state, {
    v: f.value,
    duration: opts.duration ?? 1.4,
    ease: gsapEase.expo,
    onUpdate: () => (el.textContent = formatFigure(state.v, f)),
    onComplete: () => (el.textContent = final),
  })
}
