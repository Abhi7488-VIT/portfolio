/**
 * Cursor: a context-aware cursor for fine pointers.
 *
 * Modes (from the element under the pointer):
 *   link      a, button, [role=switch]          ring expands
 *   data      [data-cursor="data"]              crosshair
 *   drag      [data-cursor="drag"]              ring with a "drag" label
 *   text      input, textarea                   custom cursor hides, native caret returns
 *   default                                     dot + ring + a short particle trail
 *
 * Positions update on the shared frame loop with frame-rate-independent smoothing.
 * Off for touch, coarse pointers and reduced motion (the native cursor stays).
 */
import { useEffect, useRef, useState } from 'react'
import { onFrame } from '../lib/gsap'
import { usePrefs } from '../hooks/prefs'

type Mode = 'default' | 'link' | 'data' | 'drag' | 'text'
const TRAIL = 6

function modeFor(target: EventTarget | null): Mode {
  if (!(target instanceof Element)) return 'default'
  const tagged = target.closest<HTMLElement>('[data-cursor]')
  if (tagged) return (tagged.dataset.cursor as Mode) || 'default'
  if (target.closest('input, textarea, select, [contenteditable="true"]')) return 'text'
  if (target.closest('a, button, [role="button"], [role="switch"], [role="option"], label, summary')) return 'link'
  return 'default'
}

export function Cursor() {
  const { reduced } = usePrefs()
  const [enabled, setEnabled] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const trail = useRef<(HTMLSpanElement | null)[]>([])

  // Only for a real mouse or trackpad.
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const on = () => setEnabled(mq.matches && !reduced)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [reduced])

  useEffect(() => {
    const html = document.documentElement
    if (!enabled) {
      html.classList.remove('has-cursor')
      return
    }
    html.classList.add('has-cursor')
    const el = root.current!
    const target = { x: -100, y: -100 }
    const ringPos = { x: -100, y: -100 }
    const trailPos = Array.from({ length: TRAIL }, () => ({ x: -100, y: -100 }))
    let visible = false

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      target.x = e.clientX
      target.y = e.clientY
      if (!visible) {
        visible = true
        ringPos.x = target.x
        ringPos.y = target.y
        trailPos.forEach((p) => ((p.x = target.x), (p.y = target.y)))
        el.dataset.visible = 'true'
      }
    }
    const onOver = (e: PointerEvent) => {
      el.dataset.mode = modeFor(e.target)
    }
    const onDown = () => (el.dataset.pressed = 'true')
    const onUp = () => delete el.dataset.pressed
    const onLeaveWindow = () => {
      visible = false
      el.dataset.visible = 'false'
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeaveWindow)

    const off = onFrame((_t, delta) => {
      if (!visible) return
      // Frame-rate-independent smoothing: same feel at 60Hz and 120Hz.
      const k = (base: number) => 1 - Math.pow(1 - base, delta / 16.67)
      ringPos.x += (target.x - ringPos.x) * k(0.22)
      ringPos.y += (target.y - ringPos.y) * k(0.22)
      if (dot.current) dot.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`
      if (ring.current) ring.current.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`
      let prev = target
      trailPos.forEach((p, i) => {
        p.x += (prev.x - p.x) * k(0.42)
        p.y += (prev.y - p.y) * k(0.42)
        const node = trail.current[i]
        if (node) node.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`
        prev = p
      })
    })

    return () => {
      off()
      html.classList.remove('has-cursor')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.documentElement.removeEventListener('pointerleave', onLeaveWindow)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div ref={root} className="cursor" data-mode="default" data-visible="false" aria-hidden="true">
      {Array.from({ length: TRAIL }, (_, i) => (
        <span
          key={i}
          ref={(el) => void (trail.current[i] = el)}
          className="cursor__trail"
          style={{ ['--i' as string]: i }}
        />
      ))}
      <div ref={ring} className="cursor__ring">
        <span className="cursor__ring-shape" />
        <span className="cursor__cross" />
        <span className="cursor__label readout">drag</span>
      </div>
      <div ref={dot} className="cursor__dot" />
    </div>
  )
}
