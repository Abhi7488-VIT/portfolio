/**
 * Skills: the six résumé groups as a draggable constellation.
 *  - Drag any node (or a group hub) and let go: it springs back through the others.
 *  - Hover or focus a skill: the projects that used it light up, from the stack lines only.
 *    Skills with no project light the internship when the résumé ties them there, or nothing.
 *  - Phones get the same data as grouped chips (tap to see where each was used).
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { projects, skillGroups, skillsSection, type ProjectId, type Skill } from '../content/content'
import { SectionTitle } from '../components/SectionTitle'
import { useReveal } from '../hooks/useReveal'
import { usePrefs } from '../hooks/prefs'
import { onFrame } from '../lib/gsap'
import { Constellation } from '../components/skills/constellation'

type Target = ProjectId | 'ortect'
const TARGETS: { id: Target; label: string }[] = [
  ...projects.map((p) => ({ id: p.id as Target, label: p.id === 'nse' ? 'NSE Alpha Signal Framework' : p.name })),
  { id: 'ortect', label: 'Ortect Organics internship' },
]

const allSkills = skillGroups.flatMap((g) => g.skills.map((s) => ({ ...s, group: g.id })))
const skillByName = new Map(allSkills.map((s) => [s.name, s]))

function targetsOf(s: Skill | undefined): Set<Target> {
  const t = new Set<Target>(s?.projects ?? [])
  if (s?.ortect) t.add('ortect')
  return t
}

function sentence(name: string | null, touch = false) {
  if (!name) return touch ? skillsSection.hintTouch : skillsSection.hint
  if (name.startsWith('hub:')) {
    const g = skillGroups.find((x) => `hub:${x.id}` === name)
    return g ? `${g.name}: ${g.skills.length} skills.` : ''
  }
  const s = skillByName.get(name)
  const t = [...targetsOf(s)].map((id) => TARGETS.find((x) => x.id === id)!.label)
  if (!t.length) return `${name}: on the résumé, not tied to a project shown here.`
  return `${name}: used in ${t.join(', ')}.`
}

export function Skills() {
  const root = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const nodeEls = useRef(new Map<string, HTMLButtonElement>())
  const lineEls = useRef(new Map<string, SVGLineElement>())
  const sim = useMemo(() => new Constellation(), [])
  const { reduced } = usePrefs()
  const [active, setActive] = useState<string | null>(null)
  const [graph, setGraph] = useState(true)
  useReveal(root)

  const lit = useMemo(() => {
    if (!active) return new Set<Target>()
    if (active.startsWith('hub:')) {
      const g = skillGroups.find((x) => `hub:${x.id}` === active)
      const u = new Set<Target>()
      g?.skills.forEach((s) => targetsOf(s).forEach((t) => u.add(t)))
      return u
    }
    return targetsOf(skillByName.get(active))
  }, [active])

  // Graph on wide screens, grouped list on phones.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 40rem)')
    const on = () => setGraph(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // Lay out the bodies from measured label sizes, then render positions.
  const render = () => {
    for (const b of sim.bodies) {
      const el = nodeEls.current.get(b.id)
      if (el) el.style.transform = `translate3d(${(b.x - el.offsetWidth / 2).toFixed(1)}px, ${(b.y - el.offsetHeight / 2).toFixed(1)}px, 0)`
      if (b.hub >= 0) {
        const line = lineEls.current.get(b.id)
        const h = sim.bodies[b.hub]
        if (line) {
          line.setAttribute('x1', h.x.toFixed(1))
          line.setAttribute('y1', h.y.toFixed(1))
          line.setAttribute('x2', b.x.toFixed(1))
          line.setAttribute('y2', b.y.toFixed(1))
        }
      }
    }
  }

  useLayoutEffect(() => {
    const el = stage.current
    if (!el || !graph) return
    const doLayout = () => {
      const groups = skillGroups.map((g) => ({ id: g.id, skills: g.skills.map((s) => s.name) }))
      sim.layout(el.clientWidth, el.clientHeight, groups, (id) => nodeEls.current.get(id)?.offsetWidth ?? 80)
      if (reduced) sim.settle()
      render()
    }
    doLayout()
    const ro = new ResizeObserver(doLayout)
    ro.observe(el)
    return () => ro.disconnect()
  }, [graph, reduced, sim])

  // Run the simulation while visible and not at rest.
  useEffect(() => {
    const el = stage.current
    if (!el || !graph) return
    let visible = false
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) sim.wake()
    })
    io.observe(el)
    const off = onFrame((_t, delta) => {
      if (!visible || sim.asleep) return
      if (reduced && !sim.dragged) {
        sim.settle(60)
      } else sim.step(delta)
      render()
    })
    return () => {
      off()
      io.disconnect()
    }
  }, [graph, reduced, sim])

  // Dragging with pointer capture; velocity on release flings the node.
  const drag = useRef<{ id: string; dx: number; dy: number; lx: number; ly: number; lt: number; vx: number; vy: number } | null>(null)
  const onDown = (id: string) => (e: React.PointerEvent<HTMLButtonElement>) => {
    const b = sim.bodies.find((x) => x.id === id)
    const r = stage.current?.getBoundingClientRect()
    if (!b || !r) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { id, dx: e.clientX - r.left - b.x, dy: e.clientY - r.top - b.y, lx: e.clientX, ly: e.clientY, lt: performance.now(), vx: 0, vy: 0 }
    sim.dragged = b
    sim.wake()
    e.currentTarget.dataset.dragging = 'true'
  }
  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    const r = stage.current?.getBoundingClientRect()
    if (!d || !r || !sim.dragged) return
    const now = performance.now()
    const dt = Math.max(1, now - d.lt)
    d.vx = ((e.clientX - d.lx) / dt) * 16
    d.vy = ((e.clientY - d.ly) / dt) * 16
    d.lx = e.clientX
    d.ly = e.clientY
    d.lt = now
    sim.dragged.x = Math.min(sim.w, Math.max(0, e.clientX - r.left - d.dx))
    sim.dragged.y = Math.min(sim.h, Math.max(0, e.clientY - r.top - d.dy))
    if (reduced) render()
  }
  const onUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (d && sim.dragged) {
      sim.dragged.vx = reduced ? 0 : d.vx
      sim.dragged.vy = reduced ? 0 : d.vy
    }
    sim.dragged = null
    drag.current = null
    sim.wake()
    delete e.currentTarget.dataset.dragging
  }

  const nodeProps = (id: string) => ({
    ref: (el: HTMLButtonElement | null) => {
      if (el) nodeEls.current.set(id, el)
    },
    onPointerDown: onDown(id),
    onPointerMove: onMove,
    onPointerUp: onUp,
    onPointerCancel: onUp,
    onPointerEnter: () => setActive(id),
    onPointerLeave: () => setActive((a) => (a === id ? null : a)),
    onFocus: () => setActive(id),
    onBlur: () => setActive((a) => (a === id ? null : a)),
    'aria-describedby': 'skills-readout',
  })

  const activeGroup = active?.startsWith('hub:') ? active.slice(4) : active ? skillByName.get(active)?.group : null

  return (
    <section id="skills" ref={root} className="skills section section--loose" aria-labelledby="skills-title">
      <div className="container">
        <SectionTitle id="skills-title" text={skillsSection.heading} />

        <div className="skills__layout">
          {graph ? (
            <div ref={stage} className="constellation" data-reveal="fade" data-has-active={active ? 'true' : undefined}>
              <svg className="constellation__lines" aria-hidden="true" focusable="false">
                {allSkills.map((s) => (
                  <line
                    key={s.name}
                    ref={(el) => {
                      if (el) lineEls.current.set(s.name, el)
                    }}
                    data-on={activeGroup === s.group || undefined}
                  />
                ))}
              </svg>
              {skillGroups.map((g) => (
                <button key={g.id} type="button" className="c-node c-node--hub" data-cursor="drag" data-on={activeGroup === g.id || undefined} {...nodeProps(`hub:${g.id}`)}>
                  {g.name}
                </button>
              ))}
              {allSkills.map((s) => {
                const used = targetsOf(s).size > 0
                return (
                  <button
                    key={s.name}
                    type="button"
                    className="c-node readout"
                    data-cursor="drag"
                    data-used={used || undefined}
                    data-on={active === s.name || (active?.startsWith('hub:') && activeGroup === s.group) || undefined}
                    {...nodeProps(s.name)}
                  >
                    {s.name}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="skills__list" data-reveal="rise">
              {skillGroups.map((g) => (
                <div key={g.id} className="skills__group">
                  <h3 className="skills__group-name">{g.name}</h3>
                  <ul className="skills__chips">
                    {g.skills.map((s) => (
                      <li key={s.name}>
                        <button
                          type="button"
                          className="chip skills__chip"
                          aria-pressed={active === s.name}
                          aria-describedby="skills-readout"
                          onClick={() => setActive((a) => (a === s.name ? null : s.name))}
                        >
                          {s.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <aside className="used-in" aria-label="Where it was used" data-reveal="rise">
            <p id="skills-readout" className="used-in__readout" aria-live="polite">
              {sentence(active, !graph)}
            </p>
            <ul className="used-in__list">
              {TARGETS.map((t) => (
                <li key={t.id} className="used-in__item" data-on={lit.has(t.id) || undefined} data-dim={active && !lit.has(t.id) ? 'true' : undefined}>
                  <span className="used-in__mark" aria-hidden="true" />
                  {t.label}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  )
}
