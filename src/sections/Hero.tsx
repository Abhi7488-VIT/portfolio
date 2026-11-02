/**
 * Hero: the console boots.
 *
 * The hero is pre-rendered into index.html at build (scripts/prerender.mjs), so the name, lede and
 * actions paint with the HTML, before any JavaScript. On mount the console "comes online":
 *   0.00  boot log retypes its four real lines
 *   0.20  a decode wave crosses the name, letter by letter (the name never leaves the screen)
 *   0.40  status rows settle in, staggered
 *   ~0.1  the node field fades in behind everything once the browser is idle
 * Finishes in ~1.1s, inside the 1.5s budget.
 * After boot, each letter of the name thins as the cursor approaches (variable weight).
 * Scrolling away drifts the two name lines apart.
 * Reduced motion: everything fades in together, no typing, no decode, no drift.
 */
import { useEffect, useLayoutEffect, useRef } from 'react'
import { hero, links, person } from '../content/content'
import { gsap, onFrame } from '../lib/gsap'
import { dur, gsapEase, stagger, distance } from '../lib/motion'
import { scrambleChars, typeText } from '../lib/scramble'
import { usePrefs } from '../hooks/prefs'
import { scrollToTarget } from '../lib/scroll'
import { Magnetic } from '../components/Magnetic'
import { NodeFieldCanvas } from '../components/hero/NodeFieldCanvas'

const clockFmt = new Intl.DateTimeFormat('en-GB', { timeZone: hero.timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
// At build (pre-render) there is no "now": a same-width placeholder, replaced on mount.
const formatClock = () => (typeof window === 'undefined' ? '--:--:-- IST' : `${clockFmt.format(new Date())} IST`)

const REST_WGHT = 780
const MIN_WGHT = 240

export function Hero() {
  const { reduced } = usePrefs()
  const host = useRef<HTMLElement>(null)
  const nameRef = useRef<HTMLHeadingElement>(null)
  const bootRef = useRef<HTMLPreElement>(null)
  const footRef = useRef<HTMLDivElement>(null)
  const clockRef = useRef<HTMLTimeElement>(null)
  const booted = useRef(false)

  /* ---------- Load sequence ---------- */
  useLayoutEffect(() => {
    const root = host.current
    const name = nameRef.current
    const boot = bootRef.current
    const foot = footRef.current
    if (!root || !name || !boot || !foot) return

    const chars = [...name.querySelectorAll<HTMLElement>('.ch')]
    const cmds = [...boot.querySelectorAll<HTMLElement>('[data-cmd]')]
    const outs = [...boot.querySelectorAll<HTMLElement>('[data-out]')]
    // Only the small status rows re-enter; the name, lede and actions are already painted.
    const footItems = [...foot.querySelectorAll<HTMLElement>('.hero__status-row')]
    const cleanups: (() => void)[] = []

    // Lock each letter's box to its final width so decoding and weight changes never reflow.
    const lockWidths = () => {
      chars.forEach((c) => (c.style.width = ''))
      const widths = chars.map((c) => c.getBoundingClientRect().width)
      chars.forEach((c, i) => (c.style.width = `${widths[i]}px`))
    }

    const ctx = gsap.context(() => {
      if (reduced || booted.current) {
        booted.current = true
        root.dataset.booted = 'true'
        return
      }
      gsap.set(outs, { opacity: 0 })
      gsap.set(footItems, { opacity: 0, y: distance.riseSmall })
      cmds.forEach((c) => (c.textContent = ''))

      const fontsReady = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 300))])
      fontsReady.then(() => {
        lockWidths()
        cmds.forEach((el, i) => {
          const text = el.dataset.cmd ?? ''
          cleanups.push(
            typeText(el, text, {
              cps: 150,
              delay: i * 0.12,
              onDone: () => gsap.to(outs[i], { opacity: 1, duration: dur.hover, ease: gsapEase.out }),
            }),
          )
        })
        cleanups.push(
          scrambleChars(chars, {
            delay: 0.2,
            stagger: 0.034,
            hold: 0.22,
            fromVisible: true,
            onDone: () => {
              booted.current = true
              root.dataset.booted = 'true'
            },
          }),
        )
        gsap.to(footItems, { opacity: 1, y: 0, duration: dur.reveal, ease: gsapEase.expo, stagger: stagger.item, delay: 0.4 })
      })
    }, root)

    const onResize = () => booted.current && lockWidths()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      cleanups.forEach((c) => c())
      ctx.revert()
    }
    // The sequence plays once per visit; a motion toggle mid-way just fades.
  }, [])

  /* ---------- Cursor-distance weight on the name ---------- */
  useEffect(() => {
    const name = nameRef.current
    const root = host.current
    if (!name || !root || reduced) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const chars = [...name.querySelectorAll<HTMLElement>('.ch')]
    const weights = chars.map(() => REST_WGHT)
    let centers: { x: number; y: number }[] = []
    const pointer = { x: -9999, y: -9999 }
    let settled = true
    let stale = true

    const measure = () => {
      centers = chars.map((c) => {
        const r = c.getBoundingClientRect()
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 + window.scrollY }
      })
    }
    const onMove = (e: PointerEvent) => {
      // Centres are read after the boot has placed the lines, and again after any resize or scroll.
      if (stale && root.dataset.booted === 'true') {
        measure()
        stale = false
      }
      pointer.x = e.clientX
      pointer.y = e.clientY + window.scrollY
      settled = false
    }
    const markStale = () => (stale = true)
    const onLeave = () => {
      pointer.x = -9999
      settled = false
    }
    const ro = new ResizeObserver(markStale)
    ro.observe(name)
    window.addEventListener('scroll', markStale, { passive: true })
    root.addEventListener('pointermove', onMove, { passive: true })
    root.addEventListener('pointerleave', onLeave)

    const radius = Math.max(220, window.innerWidth * 0.16)
    const off = onFrame((_t, delta) => {
      if (settled || stale || root.dataset.booted !== 'true') return
      const k = 1 - Math.pow(1 - 0.18, delta / 16.67)
      let moving = false
      chars.forEach((c, i) => {
        const p = centers[i]
        const d = p ? Math.hypot(pointer.x - p.x, pointer.y - p.y) : Infinity
        const t = Math.max(0, 1 - d / radius)
        const target = REST_WGHT - (REST_WGHT - MIN_WGHT) * t * t
        const next = weights[i] + (target - weights[i]) * k
        if (Math.abs(next - weights[i]) > 0.4) {
          weights[i] = next
          c.style.fontVariationSettings = `'wdth' 125, 'wght' ${next.toFixed(0)}`
          moving = true
        }
      })
      if (!moving) settled = true
    })
    return () => {
      off()
      ro.disconnect()
      window.removeEventListener('scroll', markStale)
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerleave', onLeave)
      chars.forEach((c) => (c.style.fontVariationSettings = ''))
    }
  }, [reduced])

  /* ---------- Scroll away: the name splits, the boot log dims ---------- */
  useEffect(() => {
    const root = host.current
    if (!root || reduced) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
      })
      tl.to('.hero__line--1', { xPercent: -6, ease: 'none' }, 0)
        .to('.hero__line--2', { xPercent: 6, ease: 'none' }, 0)
        .to('.hero__boot', { opacity: 0, y: -40, ease: 'none' }, 0)
        .to('.hero__foot', { y: -60, opacity: 0.2, ease: 'none' }, 0)
    }, root)
    return () => ctx.revert()
  }, [reduced])

  /* ---------- Live clock (Vellore) ---------- */
  useEffect(() => {
    const tick = () => {
      if (clockRef.current) clockRef.current.textContent = formatClock()
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <section id="hero" ref={host} className="hero" aria-labelledby="hero-name">
      <NodeFieldCanvas hostRef={host} />

      <div className="container hero__inner">
        <pre ref={bootRef} className="hero__boot readout" aria-label="Boot log" data-ui>
          <code>
            {hero.boot.map((line) => (
              <span key={line.cmd} className="boot-line">
                <span className="hero__prompt" aria-hidden="true">
                  ${' '}
                </span>
                <span data-cmd={line.cmd}>{line.cmd}</span>
                <span data-out className="hero__out">
                  {' > '}
                  {line.out}
                </span>
              </span>
            ))}
          </code>
        </pre>

        <h1 id="hero-name" ref={nameRef} className="hero__name display" aria-label={person.name}>
          {hero.nameLines.map((word, li) => (
            <span key={word} className={`hero__line hero__line--${li + 1}`} aria-hidden="true">
              <span className="hero__line-inner">
                {[...word].map((ch, ci) => (
                  <span key={ci} className="ch" data-char={ch}>
                    {ch}
                  </span>
                ))}
              </span>
            </span>
          ))}
        </h1>

        <div ref={footRef} className="hero__foot">
          <div className="hero__intro">
            <p className="hero__lede" data-rise>
              {hero.lede}
            </p>
            <div className="hero__actions" data-rise>
              <Magnetic>
                <a
                  className="btn btn-primary"
                  href={hero.primaryAction.href}
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToTarget('contact')
                  }}
                >
                  {hero.primaryAction.label}
                </a>
              </Magnetic>
              <Magnetic>
                <a className="btn" href={hero.secondaryAction.href} download={links.resumeFileName}>
                  {hero.secondaryAction.label}
                </a>
              </Magnetic>
            </div>
          </div>

          <figure className="hero__status readout" data-cursor="data">
            <figcaption className="visually-hidden">System status</figcaption>
            <dl className="hero__status-list">
              {hero.status.map((row) => (
                <div key={row.label} className="hero__status-row" data-rise>
                  <dt className="readout-label">{row.label}</dt>
                  <dd>
                    {row.label === 'Status' && <span className="blink" aria-hidden="true" />}
                    {row.value}
                  </dd>
                </div>
              ))}
              <div className="hero__status-row" data-rise>
                <dt className="readout-label">{hero.timeLabel}</dt>
                <dd>
                  <time ref={clockRef}>{formatClock()}</time>
                </dd>
              </div>
            </dl>
          </figure>
        </div>
      </div>
    </section>
  )
}
