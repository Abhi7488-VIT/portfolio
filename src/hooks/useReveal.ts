/**
 * useReveal: one entrance system for every section.
 *
 * Mark elements inside a section with data-reveal="<kind>". When the section enters the viewport
 * they play once, in DOM order, staggered:
 *   rise    opacity + 24px rise            (paragraphs, panels, chips)
 *   mask    rise out of an overflow mask   (heading words; parent clips)
 *   scan    a scanline that sweeps a heading (section-cut signature)
 *   wipe    clip-path opening from the left (instruments, pictures)
 *   count   number counts up to its text    (metrics)
 *   fade    opacity only
 * data-reveal-group="name" restarts the stagger for a separate cluster.
 *
 * Hidden states are set by script just before paint, so content is visible if the script fails.
 * Reduced motion: every kind becomes a short fade.
 */
import { useLayoutEffect, type RefObject } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { distance, dur, gsapEase, stagger } from '../lib/motion'
import { usePrefs } from './prefs'
import { animateCount } from '../lib/count'

export function useReveal(ref: RefObject<HTMLElement | null>, opts: { start?: string } = {}) {
  const { reduced } = usePrefs()
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const els = [...root.querySelectorAll<HTMLElement>('[data-reveal]')]
    if (!els.length) return

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(els, { opacity: 0 })
        ScrollTrigger.create({
          trigger: root,
          start: opts.start ?? 'top 80%',
          once: true,
          onEnter: () => gsap.to(els, { opacity: 1, duration: dur.ui, ease: gsapEase.out, stagger: 0.02 }),
        })
        return
      }
      els.forEach((el) => {
        switch (el.dataset.reveal) {
          case 'mask':
            gsap.set(el, { yPercent: 110 })
            break
          case 'scan':
            gsap.set(el, { scaleX: 0, transformOrigin: 'left center' })
            break
          case 'wipe':
            gsap.set(el, { clipPath: 'inset(0% 100% 0% 0%)' })
            break
          case 'count':
            break
          case 'fade':
            gsap.set(el, { opacity: 0 })
            break
          default:
            gsap.set(el, { opacity: 0, y: distance.rise })
        }
      })
      ScrollTrigger.create({
        trigger: root,
        start: opts.start ?? 'top 78%',
        once: true,
        onEnter: () => {
          const groups = new Map<string, number>()
          els.forEach((el) => {
            const g = el.dataset.revealGroup ?? 'main'
            const i = groups.get(g) ?? 0
            groups.set(g, i + 1)
            const extra = Number(el.dataset.revealDelay ?? 0)
            const step = el.dataset.reveal === 'mask' ? stagger.char * 3 : stagger.item
            const delay = Math.min(i * step, 0.9) + extra
            switch (el.dataset.reveal) {
              case 'mask':
                gsap.to(el, { yPercent: 0, duration: dur.reveal, ease: gsapEase.expo, delay })
                break
              case 'scan':
                gsap
                  .timeline({ delay })
                  .to(el, { scaleX: 1, duration: 0.45, ease: gsapEase.inOut })
                  .set(el, { transformOrigin: 'right center' })
                  .to(el, { scaleX: 0, duration: 0.45, ease: gsapEase.inOut })
                break
              case 'wipe':
                gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: dur.open, ease: gsapEase.inOut, delay })
                break
              case 'count':
                gsap.delayedCall(delay, () => animateCount(el))
                break
              case 'fade':
                gsap.to(el, { opacity: 1, duration: dur.reveal, ease: gsapEase.out, delay })
                break
              default:
                gsap.to(el, { opacity: 1, y: 0, duration: dur.reveal, ease: gsapEase.expo, delay })
            }
          })
        },
      })
    }, root)
    return () => ctx.revert()
  }, [ref, reduced, opts.start])
}
