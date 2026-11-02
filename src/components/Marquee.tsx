/**
 * Marquee: kinetic display type that drifts on its own and speeds up with scroll velocity,
 * flipping direction with the scroll. Stops on hover and focus and has a visible pause control
 * (it would otherwise move for longer than five seconds). Still under reduced motion.
 */
import { useEffect, useRef, useState } from 'react'
import { marquee } from '../content/content'
import { onFrame } from '../lib/gsap'
import { getScrollVelocity } from '../lib/scroll'
import { usePrefs } from '../hooks/prefs'

export function Marquee() {
  const root = useRef<HTMLDivElement>(null)
  const row = useRef<HTMLDivElement>(null)
  const { reduced } = usePrefs()
  const [paused, setPaused] = useState(false)
  const [held, setHeld] = useState(false)
  const stopped = paused || held || reduced

  useEffect(() => {
    const el = root.current
    const r = row.current
    if (!el || !r) return
    let visible = false
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(el)
    let x = 0
    let dir = -1
    let speed = 0
    const off = onFrame((_t, delta) => {
      if (!visible) return
      const v = getScrollVelocity()
      if (Math.abs(v) > 0.5) dir = v > 0 ? -1 : 1
      const target = stopped ? 0 : 0.05 + Math.min(1.6, Math.abs(v) * 0.05)
      speed += (target - speed) * 0.08
      if (speed < 0.0005 && stopped) return
      x += dir * speed * delta
      const half = r.scrollWidth / 2
      if (x <= -half) x += half
      if (x > 0) x -= half
      r.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`
    })
    return () => {
      off()
      io.disconnect()
    }
  }, [stopped])

  const copy = (hidden: boolean) => (
    <div className="marquee__copy" aria-hidden={hidden || undefined}>
      {marquee.phrases.map((p) => (
        <span key={p} className="marquee__item">
          {p}
          <span className="marquee__sep" aria-hidden="true" />
        </span>
      ))}
    </div>
  )

  return (
    <div
      ref={root}
      className="marquee"
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <div ref={row} className="marquee__row display">
        {copy(false)}
        {copy(true)}
      </div>
      {!reduced && (
        <button type="button" className="marquee__pause readout" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
          {paused ? 'Play' : 'Pause'}
          <span className="visually-hidden"> the moving banner</span>
        </button>
      )}
    </div>
  )
}
