/**
 * Magnetic: pulls its child toward the pointer when the pointer comes near.
 * GSAP quickTo on the shared out-curve gives the soft, damped follow (no overshoot).
 * Inert for touch and reduced motion.
 */
import { useEffect, useRef, type ReactNode } from 'react'
import { gsap } from '../lib/gsap'
import { gsapEase } from '../lib/motion'
import { usePrefs } from '../hooks/prefs'

export function Magnetic({ children, strength = 0.32, className = '' }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const to = useRef<{ x: (v: number) => void; y: (v: number) => void } | null>(null)
  const { reduced } = usePrefs()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    to.current = {
      x: gsap.quickTo(el, 'x', { duration: 0.55, ease: gsapEase.out }),
      y: gsap.quickTo(el, 'y', { duration: 0.55, ease: gsapEase.out }),
    }
    return () => {
      gsap.killTweensOf(el)
      gsap.set(el, { x: 0, y: 0 })
    }
  }, [])

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current
    if (reduced || e.pointerType !== 'mouse' || !el || !to.current) return
    const r = el.getBoundingClientRect()
    to.current.x((e.clientX - (r.left + r.width / 2)) * strength)
    to.current.y((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const reset = () => {
    to.current?.x(0)
    to.current?.y(0)
  }

  return (
    <span ref={ref} className={`magnetic ${className}`} onPointerMove={onMove} onPointerLeave={reset} onBlur={reset}>
      {children}
    </span>
  )
}
