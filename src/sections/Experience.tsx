/**
 * Experience: the Ortect Organics internship as a timeline that draws itself.
 * The spine scrubs down with scroll; each résumé bullet is a checkpoint that lights as the spine
 * reaches it. Beside it, a Lighthouse-style gauge counts accessibility from 75 to 90+.
 */
import { useLayoutEffect, useRef } from 'react'
import { experience } from '../content/content'
import { SectionTitle } from '../components/SectionTitle'
import { useReveal } from '../hooks/useReveal'
import { usePrefs } from '../hooks/prefs'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { gsapEase } from '../lib/motion'

const R = 88
const C = 2 * Math.PI * R

export function Experience() {
  const root = useRef<HTMLElement>(null)
  const { reduced } = usePrefs()
  useReveal(root)
  const g = experience.gauge

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const spine = el.querySelector<HTMLElement>('.timeline__spine-fill')
    const points = [...el.querySelectorAll<HTMLElement>('.checkpoint')]
    const arc = el.querySelector<SVGCircleElement>('.gauge__arc')
    const num = el.querySelector<HTMLElement>('.gauge__num')
    const ctx = gsap.context(() => {
      // Checkpoints light as the spine reaches them (works in reduced mode too: it's a state change).
      points.forEach((p) =>
        ScrollTrigger.create({ trigger: p, start: 'top 62%', onEnter: () => (p.dataset.on = 'true'), onLeaveBack: () => delete p.dataset.on }),
      )
      if (!reduced && spine) {
        gsap.fromTo(
          spine,
          { scaleY: 0 },
          { scaleY: 1, ease: 'none', scrollTrigger: { trigger: el.querySelector('.timeline'), start: 'top 62%', end: 'bottom 62%', scrub: 0.5 } },
        )
      }
      if (arc && num) {
        const state = { v: 0 }
        const set = (v: number) => {
          arc.style.strokeDashoffset = String(C * (1 - v / 100))
          num.textContent = String(Math.round(v))
        }
        set(0)
        ScrollTrigger.create({
          trigger: el.querySelector('.gauge'),
          start: 'top 75%',
          once: true,
          onEnter: () => {
            if (reduced) {
              set(g.to)
              el.querySelector('.gauge')?.setAttribute('data-done', 'true')
              return
            }
            // Load the "before" score first, hold, then climb to the "after" score.
            gsap
              .timeline()
              .to(state, { v: g.from, duration: 1, ease: gsapEase.expo, onUpdate: () => set(state.v) })
              .to(state, {
                v: g.to,
                duration: 1.1,
                ease: gsapEase.inOut,
                delay: 0.35,
                onUpdate: () => set(state.v),
                onComplete: () => el.querySelector('.gauge')?.setAttribute('data-done', 'true'),
              })
          },
        })
      }
    }, el)
    return () => ctx.revert()
  }, [reduced, g.from, g.to])

  return (
    <section id="experience" ref={root} className="experience section" aria-labelledby="exp-title">
      <div className="container">
        <SectionTitle id="exp-title" text={experience.heading} />

        <div className="experience__grid">
          <div className="timeline">
            <div className="timeline__head" data-reveal="rise">
              <h3 className="timeline__role">{experience.role}</h3>
              <p className="readout">
                <span>{experience.company}</span>
                <span className="readout-label">, {experience.dates}</span>
              </p>
            </div>
            <div className="timeline__track">
              <span className="timeline__spine" aria-hidden="true">
                <span className="timeline__spine-fill" />
              </span>
              <ol className="timeline__points">
                {experience.bullets.map((b) => (
                  <li key={b.lead} className="checkpoint" data-reveal="rise">
                    <span className="checkpoint__node" aria-hidden="true" />
                    <p className="checkpoint__lead display">{b.lead}</p>
                    <p className="checkpoint__text">{b.text}</p>
                  </li>
                ))}
              </ol>
            </div>
            <ul className="timeline__stack" aria-label="Stack" data-reveal="rise">
              {experience.stack.map((s) => (
                <li key={s} className="chip">
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <figure className="gauge" data-reveal="rise" data-cursor="data">
            <div className="gauge__dial">
              <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
                <circle cx="100" cy="100" r={R} className="gauge__track" />
                <circle cx="100" cy="100" r={R} className="gauge__arc" strokeDasharray={C} strokeDashoffset={C} transform="rotate(-90 100 100)" />
              </svg>
              <p className="gauge__value display" aria-hidden="true">
                <span className="gauge__num">{g.to}</span>
                <span className="gauge__suffix">{g.suffix}</span>
              </p>
            </div>
            <figcaption className="gauge__caption">
              <span className="gauge__label">{g.label}</span>
              <span className="readout readout-label">
                about {g.from} before, {g.to}
                {g.suffix} after
              </span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}
