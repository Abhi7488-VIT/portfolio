/**
 * NodeFieldCanvas: mounts the node field behind the hero.
 * Starts after first paint (idle callback) so the name is the LCP, then fades in.
 */
import { useEffect, useRef, useState, type RefObject } from 'react'
import { NodeField } from './nodeField'
import { ScrollTrigger } from '../../lib/gsap'
import { usePrefs } from '../../hooks/prefs'

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number
  cancelIdleCallback?: (h: number) => void
}
const idle = (cb: () => void) => {
  const w = window as IdleWindow
  return w.requestIdleCallback ? w.requestIdleCallback(cb, { timeout: 400 }) : window.setTimeout(cb, 120)
}
const cancelIdle = (h: number) => {
  const w = window as IdleWindow
  return w.cancelIdleCallback ? w.cancelIdleCallback(h) : window.clearTimeout(h)
}

export function NodeFieldCanvas({ hostRef }: { hostRef: RefObject<HTMLElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fieldRef = useRef<NodeField | null>(null)
  const { reduced } = usePrefs()
  const [ready, setReady] = useState(false)
  const reducedRef = useRef(reduced)
  reducedRef.current = reduced

  useEffect(() => {
    const canvas = canvasRef.current
    const host = hostRef.current
    if (!canvas || !host) return
    let field: NodeField | null = null
    let trigger: ScrollTrigger | null = null

    const onMove = (e: PointerEvent) => {
      if (!field || e.pointerType === 'touch') return
      const r = canvas.getBoundingClientRect()
      field.setPointer(e.clientX - r.left, e.clientY - r.top, true)
    }
    const onLeave = () => field?.setPointer(-9999, -9999, false)
    const onDown = (e: PointerEvent) => {
      if (!field) return
      // Controls keep their own job; clicks on the open field send a shockwave.
      if ((e.target as HTMLElement).closest('a, button, input, textarea, [role="switch"]')) return
      const r = canvas.getBoundingClientRect()
      field.shockwave(e.clientX - r.left, e.clientY - r.top)
    }

    const start = () => {
      try {
        field = new NodeField(canvas, { reduced: reducedRef.current })
      } catch {
        return // No 2D context: the hero still works without its background.
      }
      fieldRef.current = field
      trigger = ScrollTrigger.create({
        trigger: host,
        start: 'top top',
        end: 'bottom top',
        onUpdate: (self) => field?.setScrollProgress(self.progress),
      })
      setReady(true)
    }
    const handle = idle(start)

    host.addEventListener('pointermove', onMove, { passive: true })
    host.addEventListener('pointerleave', onLeave)
    host.addEventListener('pointerdown', onDown)
    return () => {
      cancelIdle(handle)
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
      host.removeEventListener('pointerdown', onDown)
      trigger?.kill()
      field?.destroy()
      fieldRef.current = null
    }
  }, [hostRef])

  useEffect(() => {
    fieldRef.current?.setReduced(reduced)
  }, [reduced])

  return (
    <canvas
      ref={canvasRef}
      className="node-field"
      data-ready={ready || undefined}
      aria-hidden="true"
    />
  )
}
