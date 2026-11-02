/**
 * Tilt: tilts its panel toward the pointer in 3D and moves a specular glow under it.
 * Rotation runs through GSAP quickTo (damped, no overshoot); the glow position is a CSS variable
 * (--gx/--gy) so only one paint layer changes. Inert for touch and reduced motion.
 */
import { useEffect, useRef, type ReactNode } from 'react'
import { gsap } from '../lib/gsap'
import { gsapEase } from '../lib/motion'
import { usePrefs } from '../hooks/prefs'

export function Tilt({ children, className = '', max = 6 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const to = useRef<{ rx: (v: number) => void; ry: (v: number) => void } | null>(null)
  const { reduced } = usePrefs()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    gsap.set(el, { transformPerspective: 1200 })
    to.current = {
      rx: gsap.quickTo(el, 'rotationX', { duration: 0.7, ease: gsapEase.out }),
      ry: gsap.quickTo(el, 'rotationY', { duration: 0.7, ease: gsapEase.out }),
    }
    return () => {
      gsap.killTweensOf(el)
      gsap.set(el, { rotationX: 0, rotationY: 0 })
    }
  }, [])

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el || e.pointerType !== 'mouse') return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`)
    el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`)
    if (reduced || !to.current) return
    to.current.ry((px - 0.5) * max * 2)
    to.current.rx(-(py - 0.5) * max * 2)
  }
  const reset = () => {
    to.current?.rx(0)
    to.current?.ry(0)
  }

  return (
    <div className="tilt-stage">
      <div ref={ref} className={`tilt ${className}`} onPointerMove={onMove} onPointerLeave={reset}>
        {children}
        <span className="tilt__glow" aria-hidden="true" />
      </div>
    </div>
  )
}
