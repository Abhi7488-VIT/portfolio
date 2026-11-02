/**
 * scroll.ts: Lenis smooth scrolling, driven by GSAP's ticker and feeding ScrollTrigger.
 *
 * One loop: gsap.ticker -> lenis.raf -> lenis emits scroll -> ScrollTrigger.update.
 * Under reduced motion Lenis is not started; native scrolling and ScrollTrigger still work.
 */
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'

let lenis: Lenis | null = null
let tick: ((time: number) => void) | null = null

export function startSmoothScroll() {
  if (lenis) return lenis
  lenis = new Lenis({
    duration: 1.1,
    easing: (t) => 1 - Math.pow(1 - t, 4),
    smoothWheel: true,
    // Touch keeps native momentum: it already feels right and never fights the OS.
    syncTouch: false,
    autoRaf: false,
  })
  lenis.on('scroll', ScrollTrigger.update)
  tick = (time: number) => lenis?.raf(time * 1000)
  gsap.ticker.add(tick)
  window.addEventListener('scroll', resyncOnNativeJump, { passive: true })
  return lenis
}

/**
 * Lenis ignores native scrolls while it is still easing a wheel gesture, so a jump made outside it
 * (scrollbar drag, Find in page, a browser-restored position, an assistive tool) would be undone by
 * the next wheel tick. Lenis writes its own position every frame, so a large mismatch can only be an
 * outside jump: adopt it immediately.
 */
function resyncOnNativeJump() {
  if (!lenis) return
  if (Math.abs(window.scrollY - lenis.animatedScroll) > 48) {
    lenis.scrollTo(window.scrollY, { immediate: true, force: true })
  }
}

export function stopSmoothScroll() {
  window.removeEventListener('scroll', resyncOnNativeJump)
  if (tick) gsap.ticker.remove(tick)
  lenis?.destroy()
  lenis = null
  tick = null
}

export const getLenis = () => lenis

/** Signed scroll velocity in px/frame (0 when Lenis is off). Used by the kinetic marquee. */
export const getScrollVelocity = () => lenis?.velocity ?? 0

/** Scroll to a section id or element, smoothly when Lenis runs, instantly otherwise. */
export function scrollToTarget(target: string | HTMLElement, opts: { offset?: number; immediate?: boolean } = {}) {
  const el = typeof target === 'string' ? document.getElementById(target.replace(/^#/, '')) : target
  if (!el) return
  if (lenis && !opts.immediate) {
    lenis.scrollTo(el, { offset: opts.offset ?? 0, duration: 1.4 })
  } else {
    el.scrollIntoView({ block: 'start' })
  }
  // Move focus for keyboard and screen-reader users without a second jump.
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
  el.focus({ preventScroll: true })
}

/** Lock and unlock page scroll (modals, palette). */
export function lockScroll(locked: boolean) {
  if (lenis) {
    if (locked) lenis.stop()
    else lenis.start()
  }
  document.documentElement.style.overflow = locked ? 'hidden' : ''
}
