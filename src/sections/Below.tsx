/**
 * Below: every section after the hero, loaded as one lazy chunk once the hero has painted.
 * Announces itself so chrome that observes sections (nav, progress) can bind to them.
 */
import { useEffect, useState } from 'react'
import { ScrollTrigger } from '../lib/gsap'
import { About } from './About'
import { Work } from './Work'
import { Experience } from './Experience'
import { Skills } from './Skills'
import { Record } from './Record'
import { Contact } from './Contact'
import { Marquee } from '../components/Marquee'

const SECTIONS = [About, Work, Experience, Skills, Record, Marquee, Contact]

type IdleWindow = Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }

/**
 * Sections mount one per idle slice instead of in one long task, so the main thread stays free
 * while the hero boots. A deep link (#contact) or a fast scroll skips straight to mounting all.
 */
export default function Below() {
  const [count, setCount] = useState(() => (window.location.hash ? SECTIONS.length : 1))

  useEffect(() => {
    if (count >= SECTIONS.length) return
    const w = window as IdleWindow
    const next = () => setCount((c) => Math.min(SECTIONS.length, c + 1))
    const id = w.requestIdleCallback ? w.requestIdleCallback(next, { timeout: 300 }) : window.setTimeout(next, 60)
    const all = () => setCount(SECTIONS.length)
    window.addEventListener('scroll', all, { once: true, passive: true })
    window.addEventListener('keydown', all, { once: true })
    return () => {
      if (!w.requestIdleCallback) window.clearTimeout(id)
      window.removeEventListener('scroll', all)
      window.removeEventListener('keydown', all)
    }
  }, [count])

  // Once everything is in: announce it, then recompute trigger positions a single time.
  const done = count >= SECTIONS.length
  useEffect(() => {
    if (!done) return
    window.dispatchEvent(new Event('sections:ready'))
    let cancelled = false
    ;(document.fonts?.ready ?? Promise.resolve()).then(() => {
      if (!cancelled) requestAnimationFrame(() => ScrollTrigger.refresh())
    })
    return () => {
      cancelled = true
    }
  }, [done])

  return (
    <>
      {SECTIONS.slice(0, count).map((S, i) => (
        <S key={i} />
      ))}
      {!done && <div className="below-placeholder" aria-hidden="true" />}
    </>
  )
}
