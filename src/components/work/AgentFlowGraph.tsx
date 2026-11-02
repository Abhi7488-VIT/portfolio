/**
 * AgentFlowGraph: the real six-node LangGraph pipeline, running.
 *
 * Packets leave Amazon, YouTube and Reddit, pass Research -> Cleaning -> NLP -> Insight -> Report ->
 * Reviewer, and either ship (PDF/DOCX + indexed for RAG Q&A) or get sent back to Report for another
 * pass, as the repo's graph does. Nodes are real buttons laid over the SVG: hover, focus or click one
 * to read what it does; the edges it touches light up.
 *
 * Two layouts (wide / narrow) chosen from the container width. Packets run on the shared frame
 * loop only while the graph is on screen; reduced motion shows the graph still.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { agentflowGraph } from '../../content/content'
import { onFrame } from '../../lib/gsap'
import { usePrefs } from '../../hooks/prefs'

type NodeId = 'amazon' | 'youtube' | 'reddit' | 'research' | 'cleaning' | 'nlp' | 'insight' | 'report' | 'reviewer' | 'output' | 'rag'
type Pt = [number, number]

const WIDE: { w: number; h: number; p: Record<NodeId, Pt> } = {
  w: 1000,
  h: 360,
  p: {
    amazon: [70, 50], youtube: [70, 170], reddit: [70, 290],
    research: [230, 170], cleaning: [370, 170], nlp: [510, 170], insight: [650, 170],
    report: [790, 100], reviewer: [790, 250],
    output: [935, 60], rag: [935, 290],
  },
}
const NARROW: typeof WIDE = {
  w: 360,
  h: 860,
  p: {
    amazon: [60, 50], youtube: [180, 50], reddit: [300, 50],
    research: [180, 170], cleaning: [180, 280], nlp: [180, 390], insight: [180, 500],
    report: [110, 610], reviewer: [260, 610],
    output: [100, 790], rag: [260, 790],
  },
}

const EDGES: [NodeId, NodeId][] = [
  ['amazon', 'research'], ['youtube', 'research'], ['reddit', 'research'],
  ['research', 'cleaning'], ['cleaning', 'nlp'], ['nlp', 'insight'], ['insight', 'report'],
  ['report', 'reviewer'], ['reviewer', 'report'], ['reviewer', 'output'], ['reviewer', 'rag'],
]
const edgeKey = (a: NodeId, b: NodeId) => `${a}-${b}`

const SOURCES: NodeId[] = ['amazon', 'youtube', 'reddit']
const MAIN: NodeId[] = ['research', 'cleaning', 'nlp', 'insight', 'report', 'reviewer']

const LABEL: Partial<Record<NodeId, string>> = {
  amazon: 'Amazon', youtube: 'YouTube', reddit: 'Reddit',
  output: 'PDF / DOCX', rag: agentflowGraph.rag.name,
}
const DOES: Partial<Record<NodeId, string>> = {
  amazon: 'Product reviews collected by the Research agent.',
  youtube: 'Video data collected by the Research agent.',
  reddit: 'Threads collected by the Research agent.',
  output: 'The finished market report, exported as PDF or DOCX.',
  rag: agentflowGraph.rag.does,
}
agentflowGraph.nodes.forEach((n) => {
  LABEL[n.id as NodeId] = n.name
  DOES[n.id as NodeId] = n.does
})

/** Curved path between two points (gentle S for horizontal, straight for vertical). */
function pathFor(a: Pt, b: Pt, back = false) {
  if (back) {
    // Reviewer -> Report loop bows outward so the two directions read as separate lanes.
    const mx = (a[0] + b[0]) / 2 + (a[1] === b[1] ? 0 : 60)
    const my = (a[1] + b[1]) / 2 + (a[1] === b[1] ? 60 : 0)
    return `M${a[0]},${a[1]} Q${mx},${my} ${b[0]},${b[1]}`
  }
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  if (Math.abs(dx) > Math.abs(dy)) {
    const c = dx * 0.5
    return `M${a[0]},${a[1]} C${a[0] + c},${a[1]} ${b[0] - c},${b[1]} ${b[0]},${b[1]}`
  }
  const c = dy * 0.5
  return `M${a[0]},${a[1]} C${a[0]},${a[1] + c} ${b[0]},${b[1] - c} ${b[0]},${b[1]}`
}

interface Packet {
  route: string[] // edge keys
  leg: number
  dist: number
  kind: 0 | 1 | 2
  el: SVGRectElement
}

export function AgentFlowGraph() {
  const wrap = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const pathRefs = useRef(new Map<string, SVGPathElement>())
  const nodeRefs = useRef(new Map<NodeId, HTMLButtonElement>())
  const [narrow, setNarrow] = useState(false)
  const [active, setActive] = useState<NodeId | null>(null)
  const [pinned, setPinned] = useState<NodeId | null>(null)
  const { reduced } = usePrefs()
  const L = narrow ? NARROW : WIDE

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setNarrow(e.contentRect.width < 640))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const paths = useMemo(
    () => EDGES.map(([a, b]) => ({ key: edgeKey(a, b), a, b, d: pathFor(L.p[a], L.p[b], a === 'reviewer' && b === 'report') })),
    [L],
  )

  // Packets: spawn from a random source, walk the pipeline, sometimes loop back once.
  useEffect(() => {
    const host = svg.current
    if (!host || reduced) return
    const layer = host.querySelector<SVGGElement>('.af-packets')!
    let visible = false
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(host)
    const packets: Packet[] = []
    let spawnIn = 0
    const lengths = new Map<string, number>()
    pathRefs.current.forEach((p, k) => lengths.set(k, p.getTotalLength()))
    const speed = 0.16 // svg units per ms

    const hit = (id: NodeId) => {
      const n = nodeRefs.current.get(id)
      if (!n) return
      n.dataset.hit = 'true'
      window.setTimeout(() => delete n.dataset.hit, 260)
    }

    const off = onFrame((_t, delta) => {
      if (!visible || document.hidden) return
      const dt = Math.min(delta, 48)
      spawnIn -= dt
      if (spawnIn <= 0 && packets.length < 9) {
        spawnIn = 520 + Math.random() * 420
        const s = Math.floor(Math.random() * 3) as 0 | 1 | 2
        const route = [edgeKey(SOURCES[s], 'research')]
        for (let i = 0; i < MAIN.length - 1; i++) route.push(edgeKey(MAIN[i], MAIN[i + 1]))
        if (Math.random() < 0.3) route.push(edgeKey('reviewer', 'report'), edgeKey('report', 'reviewer'))
        route.push(edgeKey('reviewer', Math.random() < 0.5 ? 'output' : 'rag'))
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        el.setAttribute('width', '9')
        el.setAttribute('height', '9')
        el.setAttribute('x', '-4.5')
        el.setAttribute('y', '-4.5')
        el.setAttribute('class', `af-packet af-packet--${s}`)
        layer.appendChild(el)
        packets.push({ route, leg: 0, dist: 0, kind: s, el })
      }
      for (let i = packets.length - 1; i >= 0; i--) {
        const pk = packets[i]
        pk.dist += speed * dt
        let len = lengths.get(pk.route[pk.leg]) ?? 1
        while (pk.dist > len) {
          pk.dist -= len
          const arrived = pk.route[pk.leg].split('-')[1] as NodeId
          hit(arrived)
          pk.leg++
          if (pk.leg >= pk.route.length) break
          len = lengths.get(pk.route[pk.leg]) ?? 1
        }
        if (pk.leg >= pk.route.length) {
          pk.el.remove()
          packets.splice(i, 1)
          continue
        }
        const p = pathRefs.current.get(pk.route[pk.leg])!.getPointAtLength(pk.dist)
        pk.el.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`)
      }
    })
    return () => {
      off()
      io.disconnect()
      packets.forEach((p) => p.el.remove())
    }
  }, [paths, reduced])

  const shown = pinned ?? active
  const lit = (k: string) => !!shown && k.split('-').includes(shown)
  const ids = Object.keys(L.p) as NodeId[]

  return (
    <div className="af" data-narrow={narrow || undefined}>
      <div
        ref={wrap}
        className="af__stage diagram"
        role="group"
        aria-label="Diagram of the AgentFlow LangGraph pipeline: sources, six agents, outputs"
        style={{ aspectRatio: `${L.w} / ${L.h}` }}
      >
        <svg ref={svg} className="af__svg" viewBox={`0 0 ${L.w} ${L.h}`} aria-hidden="true" focusable="false">
          {paths.map((p) => (
            <path
              key={p.key}
              ref={(el) => {
                if (el) pathRefs.current.set(p.key, el)
              }}
              d={p.d}
              className={`af-edge${lit(p.key) ? ' is-lit' : ''}${p.a === 'reviewer' && p.b === 'report' ? ' af-edge--back' : ''}`}
            />
          ))}
          <g className="af-packets" />
        </svg>
        {ids.map((id) => {
          const [x, y] = L.p[id]
          const kind = SOURCES.includes(id) ? 'source' : id === 'output' || id === 'rag' ? 'sink' : 'agent'
          return (
            <button
              key={id}
              type="button"
              ref={(el) => {
                if (el) nodeRefs.current.set(id, el)
              }}
              className={`af-node af-node--${kind}`}
              style={{ left: `${(x / L.w) * 100}%`, top: `${(y / L.h) * 100}%` }}
              aria-pressed={pinned === id}
              aria-describedby="af-detail"
              data-active={shown === id || undefined}
              onPointerEnter={() => setActive(id)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(id)}
              onBlur={() => setActive(null)}
              onClick={() => setPinned((p) => (p === id ? null : id))}
            >
              {LABEL[id]}
            </button>
          )
        })}
      </div>
      <p id="af-detail" className="af__detail" aria-live="polite">
        {shown ? (
          <>
            <strong>{LABEL[shown]}</strong> <span>{DOES[shown]}</span>
          </>
        ) : (
          <span className="af__hint">Select a node to see what it does.</span>
        )}
      </p>
    </div>
  )
}
