/**
 * Record: leadership, the hackathon and the certificates, as one horizontal scroll segment.
 * On wide screens the section pins and vertical scroll drives the track sideways; each panel
 * leads with its real figure set at poster scale. Phones and reduced motion get a vertical stack.
 */
import { useLayoutEffect, useRef } from 'react'
import { extras } from '../content/content'
import { SectionTitle } from '../components/SectionTitle'
import { Tilt } from '../components/Tilt'
import { useReveal } from '../hooks/useReveal'
import { usePrefs } from '../hooks/prefs'
import { gsap } from '../lib/gsap'

export function Record() {
  const root = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const { reduced } = usePrefs()
  useReveal(root)

  useLayoutEffect(() => {
    const el = root.current
    const tr = track.current
    if (!el || !tr || reduced) return
    const mm = gsap.matchMedia()
    mm.add('(min-width: 60rem)', () => {
      const distance = () => tr.scrollWidth - tr.clientWidth
      gsap.to(tr, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: el.querySelector('.record__pin'),
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      })
    })
    return () => mm.revert()
  }, [reduced])

  const L = extras.leadership
  const A = extras.achievement

  return (
    <section id="extras" ref={root} className="record section" aria-labelledby="record-title">
      <div className="record__pin">
        <div className="container record__head">
          <SectionTitle id="record-title" text={extras.heading} />
        </div>
        <div ref={track} className="record__track">
          <article className="record__panel" aria-labelledby="rec-lead">
            <Tilt max={3}>
              <div className="record__card">
                <p className="record__figure display">
                  <span data-reveal="count">{L.figure}</span>
                  <span className="record__unit readout">{L.figureLabel}</span>
                </p>
                <h3 id="rec-lead" className="record__title">
                  {L.title}
                </h3>
                <p className="readout">
                  {L.org}, {L.dates}
                </p>
                <p className="record__text">{L.text}</p>
              </div>
            </Tilt>
          </article>

          <article className="record__panel" aria-labelledby="rec-hack">
            <Tilt max={3}>
              <div className="record__card record__card--signal">
                <p className="record__figure display">
                  <span data-reveal="count">{A.figure}</span>
                  <span className="record__unit readout">{A.figureLabel}</span>
                </p>
                <h3 id="rec-hack" className="record__title">
                  {A.title}
                </h3>
                <p className="readout">
                  {A.org}, {A.dates}
                </p>
                <p className="record__text">{A.text}</p>
              </div>
            </Tilt>
          </article>

          <article className="record__panel" aria-labelledby="rec-certs">
            <Tilt max={3}>
              <div className="record__card">
                <p className="record__figure display">{extras.certifications.length}</p>
                <h3 id="rec-certs" className="record__title">
                  Certifications
                </h3>
                <ul className="certs">
                  {extras.certifications.map((c) => (
                    <li key={c.name}>
                      <a className="cert" href={c.href} target="_blank" rel="noopener noreferrer">
                        <span className="cert__name">{c.name}</span>
                        <span className="readout readout-label">
                          {c.issuer}, {c.date}
                        </span>
                        <span className="visually-hidden"> (opens in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Tilt>
          </article>
        </div>
      </div>
    </section>
  )
}
