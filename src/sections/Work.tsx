/**
 * Work: three case studies, each built around the instrument that proves it.
 * Neighbouring bays never share a layout:
 *   AgentFlow     text + live capture, then the running pipeline full width, then the build badges
 *   CommerceLens  the finding as two giant figures, then text beside the what-if
 *   NSE           the chart first (draws on scroll), then text beside the t-stat and the repo
 * Each bay's field panel opens with a clip-path wipe scrubbed to scroll.
 */
import { useLayoutEffect, useRef } from 'react'
import { projects, workSection, agentflowGraph, commercelensData, type Project } from '../content/content'
import { SectionTitle } from '../components/SectionTitle'
import { ProjectHead, ProjectMeta } from '../components/work/ProjectMeta'
import { Capture } from '../components/work/Capture'
import { AgentFlowGraph } from '../components/work/AgentFlowGraph'
import { CommerceLensCompare, CommerceLensWhatIf } from '../components/work/CommerceLensLab'
import { NseChart, TStatStrip } from '../components/work/NseLab'
import { useReveal } from '../hooks/useReveal'
import { usePrefs } from '../hooks/prefs'
import { gsap } from '../lib/gsap'

const byId = (id: Project['id']) => projects.find((p) => p.id === id)!

function Bay({ project, children, variant }: { project: Project; children: React.ReactNode; variant: string }) {
  const ref = useRef<HTMLElement>(null)
  const { reduced } = usePrefs()
  useReveal(ref, { start: 'top 72%' })

  // The field panel behind the bay opens from a narrow slit as the bay arrives.
  useLayoutEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('.bay__field')
    if (!el || reduced) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { clipPath: 'inset(6% 8% 6% 8%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 35%', scrub: 0.6 } },
      )
    }, ref)
    return () => ctx.revert()
  }, [reduced])

  return (
    <article ref={ref} id={`project-${project.id}`} className={`bay bay--${variant}`} aria-labelledby={`${project.id}-title`}>
      <div className="bay__field" aria-hidden="true" />
      <div className="container bay__inner">{children}</div>
    </article>
  )
}

export function Work() {
  const head = useRef<HTMLDivElement>(null)
  useReveal(head)
  const af = byId('agentflow')
  const cl = byId('commercelens')
  const nse = byId('nse')

  return (
    <section id="work" className="work section" aria-labelledby="work-title">
      <div ref={head} className="container work__head">
        <SectionTitle id="work-title" text={workSection.heading} />
        <p className="work__intro" data-reveal="rise">
          {workSection.intro}
        </p>
      </div>

      {/* AgentFlow AI */}
      <Bay project={af} variant="agentflow">
        <ProjectHead project={af} />
        <div className="bay__split">
          <ProjectMeta project={af} />
          <Capture id="agentflow" />
        </div>
        <div className="bay__instrument" data-reveal="wipe">
          <AgentFlowGraph />
        </div>
        <ul className="badges" aria-label="AgentFlow build facts">
          {agentflowGraph.badges.map((b) => {
            const m = b.match(/^(\d+)\s(.*)$/)
            return (
              <li key={b} className="badge" data-reveal="rise">
                {m ? (
                  <>
                    <span className="badge__num display" data-reveal="count">
                      {m[1]}
                    </span>
                    <span>{m[2]}</span>
                  </>
                ) : (
                  <span className="badge__text">{b}</span>
                )}
              </li>
            )
          })}
        </ul>
      </Bay>

      {/* CommerceLens */}
      <Bay project={cl} variant="commercelens">
        <ProjectHead project={cl} />
        <CommerceLensCompare />
        <div className="bay__split bay__split--reverse">
          <ProjectMeta project={cl} />
          <div className="bay__side">
            <CommerceLensWhatIf />
            <dl className="mini-metrics" data-reveal="rise">
              <div>
                <dt className="readout readout-label">Orders</dt>
                <dd className="display" data-reveal="count">{commercelensData.orders.toLocaleString('en-US')}</dd>
              </div>
              <div>
                <dt className="readout readout-label">Tables joined</dt>
                <dd className="display" data-reveal="count">{commercelensData.tables}</dd>
              </div>
              <div>
                <dt className="readout readout-label">LightGBM ROC-AUC</dt>
                <dd className="display" data-reveal="count">{commercelensData.rocAuc.toFixed(2)}</dd>
              </div>
            </dl>
            <Capture id="commercelens" />
          </div>
        </div>
      </Bay>

      {/* NSE Alpha */}
      <Bay project={nse} variant="nse">
        <ProjectHead project={nse} />
        <NseChart />
        <div className="bay__split">
          <ProjectMeta project={nse} />
          <div className="bay__side">
            <TStatStrip />
            <Capture id="nse" />
          </div>
        </div>
      </Bay>
    </section>
  )
}
