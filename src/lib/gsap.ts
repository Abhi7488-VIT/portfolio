/**
 * gsap.ts: GSAP is registered once here, and its ticker is the site's single animation loop.
 *
 * Lenis, ScrollTrigger and every canvas effect run off gsap.ticker, so scroll position and
 * scroll-driven animation are always computed in the same frame and never fight.
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'
import { ease, gsapEase } from './motion'

let registered = false

export function setupGsap() {
  if (registered) return
  registered = true
  gsap.registerPlugin(ScrollTrigger, CustomEase)
  const bez = (p: readonly number[]) => `M0,0 C${p[0]},${p[1]} ${p[2]},${p[3]} 1,1`
  CustomEase.create(gsapEase.expo, bez(ease.expo))
  CustomEase.create(gsapEase.out, bez(ease.out))
  CustomEase.create(gsapEase.inOut, bez(ease.inOut))
  CustomEase.create(gsapEase.exit, bez(ease.exit))
  gsap.defaults({ ease: gsapEase.out, duration: 0.8 })
  // Never let GSAP "catch up" after a long frame: that is what makes jank visible.
  gsap.ticker.lagSmoothing(0)
}

export type FrameCallback = (time: number, deltaMs: number) => void

/** Subscribe to the shared frame loop. Returns an unsubscribe function. */
export function onFrame(cb: FrameCallback) {
  const wrapped = (time: number, delta: number) => cb(time, delta)
  gsap.ticker.add(wrapped)
  return () => gsap.ticker.remove(wrapped)
}

export { gsap, ScrollTrigger }
