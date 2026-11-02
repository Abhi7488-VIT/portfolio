/**
 * Capture: a real screenshot of the project with an x-ray lens.
 * Under the pointer, a circle reveals the "blueprint" layer: the same capture re-inked in the
 * console's line colour over a drafting grid. Tap (touch) or the Blueprint button shows it whole.
 * The lens is a clip-path driven by CSS variables: one composited layer, no re-layout.
 */
import { useRef, useState } from 'react'
import { captures, type ProjectId } from '../../content/content'
import { Tilt } from '../Tilt'

export function Capture({ id, className = '' }: { id: ProjectId; className?: string }) {
  const c = captures[id]
  const frame = useRef<HTMLDivElement>(null)
  const [full, setFull] = useState(false)

  const onMove = (e: React.PointerEvent) => {
    const el = frame.current
    if (!el || e.pointerType !== 'mouse') return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--lx', `${e.clientX - r.left}px`)
    el.style.setProperty('--ly', `${e.clientY - r.top}px`)
    el.dataset.lens = 'on'
  }
  const onLeave = () => {
    if (frame.current) frame.current.dataset.lens = 'off'
  }

  const img = (extra = '') => (
    <img
      className={`capture__img ${extra}`}
      src={c.src}
      srcSet={`${c.srcSmall} 800w, ${c.src} 1600w`}
      sizes="(max-width: 60rem) 100vw, 50vw"
      width={c.width}
      height={c.height}
      alt={extra ? '' : c.alt}
      loading="lazy"
      decoding="async"
    />
  )

  return (
    <figure className={`capture ${className}`} data-reveal="wipe">
      <Tilt max={4}>
        <div
          ref={frame}
          className="capture__frame"
          data-full={full || undefined}
          data-lens="off"
          data-cursor="data"
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          onClick={(e) => {
            if ((e.nativeEvent as PointerEvent).pointerType !== 'mouse') setFull((f) => !f)
          }}
        >
          {img()}
          <div className="capture__blueprint" aria-hidden="true">
            {img('capture__img--blueprint')}
          </div>
        </div>
      </Tilt>
      <figcaption className="capture__caption">
        <span>{c.caption}</span>
        <button type="button" className="capture__toggle readout" aria-pressed={full} onClick={() => setFull((f) => !f)}>
          Blueprint
        </button>
      </figcaption>
    </figure>
  )
}
