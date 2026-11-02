/**
 * About: side facts and a wide paragraph.
 *  - The paragraph inks in word by word as it scrolls through the screen.
 *  - The "currently" ticker decodes between real project and skill names; it pauses on hover,
 *    on focus and with its own button (it would otherwise run past five seconds).
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { about } from '../content/content'
import { SectionTitle } from '../components/SectionTitle'
import { useReveal } from '../hooks/useReveal'
import { usePrefs } from '../hooks/prefs'
import { gsap } from '../lib/gsap'
import { decodeTo } from '../lib/scramble'

const ROTATE_MS = 2600

export function About() {
  const root = useRef<HTMLElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const itemRef = useRef<HTMLSpanElement>(null)
  const { reduced } = usePrefs()
  useReveal(root)

  const ticks = useMemo(() => about.ticker.flatMap((t) => t.items.map((item) => ({ verb: t.verb, item }))), [])
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)

  // Ink fill: words go from soft to full ink as the paragraph scrolls up the screen.
  useLayoutEffect(() => {
    const el = body.current
    if (!el || reduced) return
    const words = el.querySelectorAll<HTMLElement>('.ink-word')
    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        { opacity: 0.22 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.04,
          scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 52%', scrub: 0.6 },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [reduced])

  // Ticker rotation.
  useEffect(() => {
    if (paused || hovered) return
    const id = window.setInterval(() => setI((n) => (n + 1) % ticks.length), ROTATE_MS)
    return () => window.clearInterval(id)
  }, [paused, hovered, ticks.length])

  useEffect(() => {
    const el = itemRef.current
    if (!el) return
    if (reduced) {
      el.textContent = ticks[i].item
      return
    }
    return decodeTo(el, ticks[i].item)
  }, [i, ticks, reduced])

  return (
    <section id="about" ref={root} className="about section section--loose" aria-labelledby="about-title">
      <div className="container">
        <SectionTitle id="about-title" text={about.heading} />

        <div className="about__grid">
          <dl className="about__facts">
            {about.facts.map((f) => (
              <div key={f.label} className="about__fact" data-reveal="rise">
                <dt className="readout readout-label">{f.label}</dt>
                <dd>{f.label === 'CGPA' ? <span data-reveal="count">{f.value}</span> : f.value}</dd>
              </div>
            ))}
          </dl>

          <div className="about__main">
            <div ref={body} className="about__body">
              {about.body.map((p, pi) => (
                <p key={pi} data-reveal="rise">
                  {p.split(' ').map((w, wi) => (
                    <span key={wi} className="ink-word">
                      {w}{' '}
                    </span>
                  ))}
                </p>
              ))}
            </div>

            <div
              className="ticker"
              data-reveal="rise"
              onPointerEnter={() => setHovered(true)}
              onPointerLeave={() => setHovered(false)}
              onFocus={() => setHovered(true)}
              onBlur={() => setHovered(false)}
            >
              <p className="ticker__line" aria-live="off">
                <span className="readout ticker__verb">
                  currently {ticks[i].verb}
                </span>
                <span ref={itemRef} className="ticker__item" data-cursor="data">
                  {ticks[0].item}
                </span>
              </p>
              <button type="button" className="ticker__pause readout" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
                {paused ? 'Play' : 'Pause'}
                <span className="visually-hidden"> the currently ticker</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
