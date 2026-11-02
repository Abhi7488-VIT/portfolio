/**
 * SectionTitle: every section opens the same way, so the cut between sections reads as one system.
 * A lime scanline sweeps across, and the words rise out of their masks behind it.
 * Works with useReveal on the parent section.
 */
import type { ElementType } from 'react'

export function SectionTitle({ id, text, as: Tag = 'h2', className = '' }: { id: string; text: string; as?: ElementType; className?: string }) {
  const words = text.split(' ')
  return (
    <Tag id={id} className={`section-title section-title--cut ${className}`}>
      <span className="scanline" data-reveal="scan" aria-hidden="true" />
      {words.map((w, i) => (
        <span key={i}>
          <span className="word-mask">
            <span className="word" data-reveal="mask">
              {w}
            </span>
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  )
}
