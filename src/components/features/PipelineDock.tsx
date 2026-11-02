/**
 * PipelineDock: scroll progress styled as a CI run, plus the streaming console log.
 *
 *  - Seven stages, one per section (boot, profile, build, test, link, verify, deploy). Passed stages
 *    fill, the current one runs; each stage is a jump link.
 *  - A progress bar follows overall scroll (transform only, from one ScrollTrigger).
 *  - The log streams real facts from content.ts, one line every few seconds. Hover or focus shows the
 *    recent history; it pauses on hover, focus, its own button, hidden tabs and reduced motion.
 */
import { useEffect, useRef, useState } from 'react'
import { sections, consoleLog } from '../../content/content'
import { ScrollTrigger } from '../../lib/gsap'
import { scrollToTarget } from '../../lib/scroll'
import { decodeTo } from '../../lib/scramble'
import { usePrefs } from '../../hooks/prefs'

const EVERY_MS = 2800
const HISTORY = 5

export function PipelineDock() {
  const [current, setCurrent] = useState(0)
  const [lines, setLines] = useState<string[]>([consoleLog[0]])
  const [paused, setPaused] = useState(false)
  const [held, setHeld] = useState(false)
  const [shown, setShown] = useState(false)
  const bar = useRef<HTMLSpanElement>(null)
  const latest = useRef<HTMLSpanElement>(null)
  const cursor = useRef(1)
  const { reduced } = usePrefs()

  // Stage tracking + overall progress.
  useEffect(() => {
    const triggers: ScrollTrigger[] = []
    const bind = () => {
      triggers.forEach((t) => t.kill())
      triggers.length = 0
      sections.forEach((s, i) => {
        const el = document.getElementById(s.id)
        if (!el) return
        triggers.push(
          ScrollTrigger.create({
            trigger: el,
            start: 'top 55%',
            end: 'bottom 55%',
            onToggle: (self) => self.isActive && setCurrent(i),
          }),
        )
      })
      triggers.push(
        ScrollTrigger.create({
          start: 0,
          end: 'max',
          onUpdate: (self) => {
            if (bar.current) bar.current.style.transform = `scaleX(${self.progress.toFixed(4)})`
            setShown(self.scroll() > window.innerHeight * 0.6)
          },
        }),
      )
    }
    bind()
    window.addEventListener('sections:ready', bind)
    return () => {
      window.removeEventListener('sections:ready', bind)
      triggers.forEach((t) => t.kill())
    }
  }, [])

  // Stream the log.
  const stopped = paused || held || reduced
  useEffect(() => {
    if (stopped) return
    const id = window.setInterval(() => {
      if (document.hidden) return
      const next = consoleLog[cursor.current % consoleLog.length]
      cursor.current++
      setLines((l) => [...l.slice(-(HISTORY - 1)), next])
    }, EVERY_MS)
    return () => window.clearInterval(id)
  }, [stopped])

  useEffect(() => {
    const el = latest.current
    if (!el) return
    const text = lines[lines.length - 1]
    if (reduced) {
      el.textContent = text
      return
    }
    return decodeTo(el, text, { duration: 0.6 })
  }, [lines, reduced])

  const stage = sections[current]

  return (
    <aside
      className="dock"
      aria-label="Page progress"
      hidden={!shown}
      data-expanded={held || undefined}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setHeld(false)
      }}
    >
      <div className="dock__row">
        <ol className="dock__stages">
          {sections.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                className="dock__stage"
                data-state={i < current ? 'passed' : i === current ? 'running' : 'queued'}
                aria-current={i === current ? 'step' : undefined}
                aria-label={`${s.stage}: go to ${s.label}`}
                onClick={() => scrollToTarget(s.id)}
              />
            </li>
          ))}
        </ol>
        <p className="dock__status readout" aria-live="off">
          <span className="dock__stage-name">{stage.stage}</span>
          <span className="readout-label">{current === sections.length - 1 ? 'ready' : 'running'}</span>
        </p>
      </div>
      <span className="dock__track" aria-hidden="true">
        <span ref={bar} className="dock__bar" />
      </span>

      <div className="dock__log readout" aria-hidden="true">
        {lines.slice(0, -1).map((l, i) => (
          <span key={`${i}-${l}`} className="dock__line dock__line--old">
            {l}
          </span>
        ))}
        <span ref={latest} className="dock__line">
          {lines[lines.length - 1]}
        </span>
      </div>
      {!reduced && (
        <button type="button" className="dock__pause readout" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
          {paused ? 'Resume log' : 'Pause log'}
        </button>
      )}
    </aside>
  )
}
