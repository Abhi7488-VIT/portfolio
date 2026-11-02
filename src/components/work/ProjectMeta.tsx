/**
 * ProjectMeta: the case-study text column. Name, what it is, the problem, the approach,
 * stack chips and the real links (demo links open in a new tab; Streamlit may be asleep).
 */
import type { Project } from '../../content/content'
import { Magnetic } from '../Magnetic'

/** The case study's name, set across the whole bay, with what it is and when. */
export function ProjectHead({ project }: { project: Project }) {
  return (
    <header className="project-head">
      <h3 id={`${project.id}-title`} className="project-head__name display" data-reveal="rise">
        {project.name}
      </h3>
      <p className="project-head__tag readout" data-reveal="rise">
        {project.tagline}, {project.date}
      </p>
    </header>
  )
}

export function ProjectMeta({ project, className = '' }: { project: Project; className?: string }) {
  return (
    <div className={`project-meta ${className}`}>
      <p className="project-meta__lead" data-reveal="rise">
        {project.heading}.
      </p>
      <dl className="project-meta__story">
        <div data-reveal="rise">
          <dt className="readout readout-label">Problem</dt>
          <dd>{project.problem}</dd>
        </div>
        <div data-reveal="rise">
          <dt className="readout readout-label">Approach</dt>
          <dd>{project.approach}</dd>
        </div>
      </dl>
      <ul className="project-meta__stack" aria-label={`${project.name} stack`} data-reveal="rise">
        {project.stack.map((s) => (
          <li key={s} className="chip" data-skill={s}>
            {s}
          </li>
        ))}
      </ul>
      <div className="project-meta__links" data-reveal="rise">
        {project.demo && (
          <Magnetic>
            <a className="btn" href={project.demo} target="_blank" rel="noopener noreferrer">
              Live demo<span className="visually-hidden"> of {project.name} (opens in a new tab)</span>
            </a>
          </Magnetic>
        )}
        <Magnetic>
          <a className="btn" href={project.repo} target="_blank" rel="noopener noreferrer">
            GitHub<span className="visually-hidden"> repository for {project.name} (opens in a new tab)</span>
          </a>
        </Magnetic>
      </div>
    </div>
  )
}
