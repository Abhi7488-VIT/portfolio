/**
 * NseLab: the honest finding, made visible.
 *
 *  - Equity curves for the four signals draw themselves as the chart scrolls into view.
 *  - The costs switch (0 / 10 bps a side) morphs the curves from gross to net. Curve SHAPES are
 *    illustrative (seeded random walks); the facts they encode are real: the pairs signal is the one
 *    with a real edge, and after 10 bps/side every signal ends below zero (negative Sharpe).
 *  - The t-stat strip is real: pairs IC t = +2.12 against the ±1.96 band at 5% significance.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { nseData } from '../../content/content'
import { gsap } from '../../lib/gsap'
import { dur, gsapEase } from '../../lib/motion'
import { usePrefs } from '../../hooks/prefs'

const N = 140
const W = 1000
const H = 380
const PAD = 24

/** Small seeded PRNG so the illustration is identical on every visit. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// drift: gross edge per step; vol: noise; drag: cost per step at 10 bps/side (turnover-driven).
const SPEC = [
  { id: 'pairs', drift: 0.055, vol: 0.55, drag: 0.085, seed: 11 },
  { id: 'momentum', drift: 0.008, vol: 0.6, drag: 0.03, seed: 23 },
  { id: 'volume', drift: 0.012, vol: 0.65, drag: 0.06, seed: 37 },
  { id: 'reversal', drift: 0.02, vol: 0.5, drag: 0.07, seed: 51 },
]

function buildSeries() {
  return SPEC.map((s) => {
    const rnd = mulberry32(s.seed)
    const gross: number[] = [0]
    const net: number[] = [0]
    for (let i = 1; i < N; i++) {
      const shock = (rnd() + rnd() + rnd() - 1.5) * s.vol
      gross.push(gross[i - 1] + s.drift + shock * 0.35)
      net.push(net[i - 1] + s.drift - s.drag + shock * 0.35)
    }
    return { id: s.id, gross, net }
  })
}

export function NseChart() {
  const series = useMemo(buildSeries, [])
  const { reduced } = usePrefs()
  const [costs, setCosts] = useState(false)
  const mix = useRef({ t: 0 })
  const svg = useRef<SVGSVGElement>(null)
  const lines = useRef<(SVGPathElement | null)[]>([])
  const cross = useRef<SVGLineElement>(null)
  const [hoverDay, setHoverDay] = useState<number | null>(null)

  // One y-scale that fits both states, so the morph is honest about direction and size.
  const [lo, hi] = useMemo(() => {
    const all = series.flatMap((s) => [...s.gross, ...s.net])
    return [Math.min(...all), Math.max(...all)]
  }, [series])
  const x = (i: number) => PAD + (i / (N - 1)) * (W - PAD * 2)
  const y = (v: number) => PAD + (1 - (v - lo) / (hi - lo)) * (H - PAD * 2)
  const zeroY = y(0)

  const pathAt = (k: number, t: number) => {
    const s = series[k]
    let d = ''
    for (let i = 0; i < N; i++) {
      const v = s.gross[i] + (s.net[i] - s.gross[i]) * t
      d += `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`
    }
    return d
  }
  const ghosts = useRef<(SVGPathElement | null)[]>([])
  // The ghost layer shows the other state faintly, so gross and net are always in one frame.
  const redraw = () => {
    lines.current.forEach((p, k) => p?.setAttribute('d', pathAt(k, mix.current.t)))
    ghosts.current.forEach((p, k) => p?.setAttribute('d', pathAt(k, 1 - mix.current.t)))
  }

  // Draw-on: each line's stroke reveals as the chart scrolls into view.
  useLayoutEffect(() => {
    redraw()
    const el = svg.current
    if (!el || reduced) return
    const ctx = gsap.context(() => {
      // pathLength="1" on each line keeps this exact while the costs morph changes real lengths.
      lines.current.forEach((p) => {
        if (!p) return
        gsap.fromTo(
          p,
          { strokeDasharray: 1, strokeDashoffset: 1 },
          {
            strokeDashoffset: 0,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 85%', end: 'center 45%', scrub: 0.8 },
          },
        )
      })
    }, el)
    return () => ctx.revert()
  }, [reduced])

  // Costs switch morphs gross <-> net.
  useEffect(() => {
    const target = costs ? 1 : 0
    if (reduced) {
      mix.current.t = target
      redraw()
      return
    }
    const tw = gsap.to(mix.current, { t: target, duration: dur.reveal, ease: gsapEase.inOut, onUpdate: redraw })
    return () => {
      tw.kill()
    }
  }, [costs, reduced])

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    const i = Math.round(((px - PAD) / (W - PAD * 2)) * (N - 1))
    if (i < 0 || i >= N) return setHoverDay(null)
    cross.current?.setAttribute('x1', String(x(i)))
    cross.current?.setAttribute('x2', String(x(i)))
    setHoverDay(i)
  }

  return (
    <div className="nse-chart">
      <div className="nse-chart__head">
        <ul className="nse-legend" aria-label="Signals">
          {nseData.signals.map((s, k) => (
            <li key={s.id} className={`nse-legend__item nse-legend__item--${k}`}>
              <span className="nse-legend__swatch" aria-hidden="true" />
              {s.name}
            </li>
          ))}
        </ul>
        <button
          type="button"
          role="switch"
          aria-checked={costs}
          className="nse-costs"
          onClick={() => setCosts((c) => !c)}
        >
          <span className="readout readout-label">Trading costs</span>
          <span className="nse-costs__track" aria-hidden="true">
            <span className="nse-costs__knob" />
          </span>
          <span className="readout nse-costs__value">{costs ? '10 bps a side' : 'off'}</span>
        </button>
      </div>

      <figure className="nse-chart__figure" data-reveal="wipe">
        <svg
          ref={svg}
          className="nse-chart__svg"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Illustrative cumulative returns of four signals. ${costs ? 'With 10 bps a side costs, all four end below zero.' : 'Before costs, the pairs signal climbs the most.'}`}
          data-cursor="data"
          onPointerMove={onMove}
          onPointerLeave={() => setHoverDay(null)}
        >
          <line x1={PAD} x2={W - PAD} y1={zeroY} y2={zeroY} className="nse-zero" />
          <text x={PAD} y={zeroY - 8} className="nse-zero__label">
            0
          </text>
          {series.map((s, k) => (
            <path key={`g-${s.id}`} ref={(el) => void (ghosts.current[k] = el)} className="nse-ghost" />
          ))}
          {series.map((s, k) => (
            <path key={s.id} ref={(el) => void (lines.current[k] = el)} pathLength={1} className={`nse-line nse-line--${k}`} />
          ))}
          <line ref={cross} y1={PAD} y2={H - PAD} className="nse-cross" data-on={hoverDay !== null || undefined} />
        </svg>
        <figcaption className="nse-chart__caption readout">
          <span>{costs ? 'After 10 bps a side, all four end below zero.' : 'Before costs, the pairs signal leads.'}</span>
          <span className="readout-label">
            {hoverDay !== null ? `day ${hoverDay + 1} of ${N}. ` : ''}
            {nseData.chartDisclaimer}
          </span>
        </figcaption>
      </figure>
    </div>
  )
}

/** The one real statistic, on a number line with the 5% significance band. */
export function TStatStrip() {
  const span = 3
  const pos = (v: number) => `${((v + span) / (span * 2)) * 100}%`
  return (
    <figure className="tstat" data-cursor="data">
      <figcaption className="tstat__label">
        Pairs signal, rank IC t-stat{' '}
        <strong className="tstat__value" data-reveal="count">
          +{nseData.pairsTStat.toFixed(2)}
        </strong>
      </figcaption>
      <div className="tstat__line" aria-hidden="true">
        <span className="tstat__band" style={{ left: pos(-1.96), right: `calc(100% - ${pos(1.96)})` }} />
        <span className="tstat__tick" style={{ left: pos(0) }} />
        <span className="tstat__marker" data-reveal="rise" style={{ left: pos(nseData.pairsTStat) }} />
      </div>
      <div className="tstat__scale readout readout-label" aria-hidden="true">
        <span>−3</span>
        <span>not significant within ±1.96</span>
        <span>+3</span>
      </div>
    </figure>
  )
}
