/**
 * nodeField.ts: the hero's live node graph, drawn on a 2D canvas.
 *
 * Why 2D and not WebGL: ~140 points and their links fit comfortably in a 2D context at 60fps,
 * and skipping Three.js keeps ~150KB off the critical path (Lighthouse 95+).
 *
 * Behaviour
 *  - Nodes drift slowly and link to neighbours within `linkDist` (spatial hash, O(n)).
 *  - Pointer: nearby nodes lean toward it and the cursor joins the graph with lime links.
 *  - Click / tap: a shockwave ring pushes nodes outward.
 *  - Scroll: the field drifts up (parallax) and speeds up with scroll velocity.
 *  - Quality governor: fewer nodes and a lower pixel ratio when frames run long.
 *  - Paused off-screen and in hidden tabs; under reduced motion it draws one still frame.
 */
import { onFrame } from '../../lib/gsap'
import { getQuality, maxDpr, onQualityChange, type Quality } from '../../lib/perf'
import { readColor, onThemeChange } from '../../lib/tokens'
import { getScrollVelocity } from '../../lib/scroll'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  bx: number // base drift
  by: number
  r: number
  kind: 0 | 1 | 2 // ink, accent, signal
}

interface Wave {
  x: number
  y: number
  age: number
}

const CAP: Record<Quality, number> = { high: 150, medium: 90, low: 48 }
const WAVE_MS = 1100
const WAVE_SPEED = 0.62 // px per ms

export class NodeField {
  private ctx: CanvasRenderingContext2D
  private nodes: Node[] = []
  private waves: Wave[] = []
  private w = 0
  private h = 0
  private dpr = 1
  private pointer = { x: -9999, y: -9999, active: false }
  private visible = true
  private running = false
  private offFrame: (() => void) | null = null
  private disposers: (() => void)[] = []
  private colors = { ink: '#ddd', accent: '#c5f738', signal: '#f39a32', rule: '#333' }
  private scrollShift = 0
  private linkDist = 130

  constructor(
    private canvas: HTMLCanvasElement,
    private opts: { reduced: boolean },
  ) {
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) throw new Error('2D canvas unavailable')
    this.ctx = ctx
    this.readColors()
    this.resize()

    const ro = new ResizeObserver(() => this.resize())
    ro.observe(canvas)
    this.disposers.push(() => ro.disconnect())

    const io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting
      this.sync()
    })
    io.observe(canvas)
    this.disposers.push(() => io.disconnect())

    const onVis = () => this.sync()
    document.addEventListener('visibilitychange', onVis)
    this.disposers.push(() => document.removeEventListener('visibilitychange', onVis))

    this.disposers.push(
      onThemeChange(() => {
        this.readColors()
        if (!this.running) this.draw()
      }),
    )
    this.disposers.push(
      onQualityChange(() => {
        this.resize()
      }),
    )
  }

  /** Called by the React wrapper with pointer coordinates relative to the canvas. */
  setPointer(x: number, y: number, active: boolean) {
    this.pointer.x = x
    this.pointer.y = y
    this.pointer.active = active
  }

  shockwave(x: number, y: number) {
    if (this.opts.reduced) return
    this.waves.push({ x, y, age: 0 })
    if (this.waves.length > 4) this.waves.shift()
  }

  /** 0..1 progress of the hero leaving the viewport; drives parallax. */
  setScrollProgress(p: number) {
    this.scrollShift = p * this.h * 0.35
    if (!this.running) this.draw()
  }

  setReduced(reduced: boolean) {
    this.opts.reduced = reduced
    this.sync()
    if (reduced) this.draw()
  }

  destroy() {
    this.offFrame?.()
    this.disposers.forEach((d) => d())
  }

  private readColors() {
    this.colors = {
      ink: readColor('--color-ink', '#dddddd'),
      accent: readColor('--color-accent', '#c5f738'),
      signal: readColor('--color-signal', '#f39a32'),
      rule: readColor('--color-rule-strong', '#333333'),
    }
  }

  private resize() {
    const rect = this.canvas.getBoundingClientRect()
    const q = getQuality()
    this.dpr = Math.min(window.devicePixelRatio || 1, maxDpr(q))
    this.w = Math.max(1, rect.width)
    this.h = Math.max(1, rect.height)
    this.canvas.width = Math.round(this.w * this.dpr)
    this.canvas.height = Math.round(this.h * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.linkDist = this.w < 640 ? 96 : 130
    const target = Math.min(CAP[q], Math.round((this.w * this.h) / 9000))
    this.seed(target)
    this.draw()
  }

  private seed(count: number) {
    // Keep existing nodes where possible so a resize doesn't visibly reshuffle the field.
    const keep = this.nodes.filter((n) => n.x <= this.w && n.y <= this.h).slice(0, count)
    while (keep.length < count) {
      const a = Math.random() * Math.PI * 2
      const s = 0.006 + Math.random() * 0.012
      const roll = Math.random()
      keep.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vx: 0,
        vy: 0,
        bx: Math.cos(a) * s,
        by: Math.sin(a) * s,
        r: roll < 0.08 ? 2.2 : 1.2 + Math.random() * 0.6,
        kind: roll < 0.06 ? 1 : roll < 0.085 ? 2 : 0,
      })
    }
    this.nodes = keep
  }

  /** Start or stop the loop depending on visibility and motion preference. */
  private sync() {
    const should = this.visible && !document.hidden && !this.opts.reduced
    if (should && !this.running) {
      this.running = true
      this.offFrame = onFrame((_t, delta) => this.step(Math.min(delta, 48)))
    } else if (!should && this.running) {
      this.running = false
      this.offFrame?.()
      this.offFrame = null
    }
  }

  private step(dt: number) {
    const { nodes, pointer, w, h } = this
    const boost = 1 + Math.min(4, Math.abs(getScrollVelocity()) * 0.12)
    const pr = 210
    for (const n of nodes) {
      // Pointer attraction (soft, falls off with distance).
      if (pointer.active) {
        const dx = pointer.x - n.x
        const dy = pointer.y - n.y + this.scrollShift
        const d2 = dx * dx + dy * dy
        if (d2 < pr * pr && d2 > 1) {
          const d = Math.sqrt(d2)
          const f = (1 - d / pr) * 0.0009
          n.vx += (dx / d) * f * dt
          n.vy += (dy / d) * f * dt
        }
      }
      // Shockwaves push nodes caught in the ring outward.
      for (const wv of this.waves) {
        const radius = wv.age * WAVE_SPEED
        const dx = n.x - wv.x
        const dy = n.y - (wv.y + this.scrollShift)
        const d = Math.hypot(dx, dy) || 1
        const band = Math.abs(d - radius)
        if (band < 40) {
          const f = (1 - band / 40) * (1 - wv.age / WAVE_MS) * 0.05
          n.vx += (dx / d) * f * dt
          n.vy += (dy / d) * f * dt
        }
      }
      // Damping back toward the base drift.
      n.vx += (n.bx - n.vx) * 0.04
      n.vy += (n.by - n.vy) * 0.04
      n.x += n.vx * dt * boost
      n.y += n.vy * dt * boost
      // Wrap around the edges of the visible window (which moves with the parallax shift).
      const top = this.scrollShift
      if (n.x < -10) n.x = w + 10
      else if (n.x > w + 10) n.x = -10
      if (n.y < top - 10) n.y += h + 20
      else if (n.y > top + h + 10) n.y -= h + 20
    }
    for (const wv of this.waves) wv.age += dt
    this.waves = this.waves.filter((wv) => wv.age < WAVE_MS)
    this.draw()
  }

  private draw() {
    const { ctx, nodes, w, h, linkDist, colors, pointer } = this
    ctx.clearRect(0, 0, w, h)
    ctx.save()
    ctx.translate(0, -this.scrollShift)

    // Links, bucketed by alpha so the whole web costs four stroke calls.
    const cell = linkDist
    const cols = Math.ceil(w / cell) + 1
    const grid = new Map<number, number[]>()
    nodes.forEach((n, i) => {
      const key = Math.floor(n.y / cell) * cols + Math.floor(n.x / cell)
      const list = grid.get(key)
      if (list) list.push(i)
      else grid.set(key, [i])
    })
    const buckets: Path2D[] = [new Path2D(), new Path2D(), new Path2D(), new Path2D()]
    const ld2 = linkDist * linkDist
    nodes.forEach((a, i) => {
      const cx = Math.floor(a.x / cell)
      const cy = Math.floor(a.y / cell)
      for (let oy = 0; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          if (oy === 0 && ox < 0) continue
          const list = grid.get((cy + oy) * cols + (cx + ox))
          if (!list) continue
          for (const j of list) {
            if (j <= i && oy === 0 && ox === 0) continue
            const b = nodes[j]
            const dx = a.x - b.x
            const dy = a.y - b.y
            const d2 = dx * dx + dy * dy
            if (d2 > ld2) continue
            const k = Math.min(3, Math.floor((d2 / ld2) * 4))
            buckets[k].moveTo(a.x, a.y)
            buckets[k].lineTo(b.x, b.y)
          }
        }
      }
    })
    ctx.lineWidth = 1
    ctx.strokeStyle = colors.ink
    const alphas = [0.22, 0.14, 0.08, 0.04]
    buckets.forEach((p, k) => {
      ctx.globalAlpha = alphas[k]
      ctx.stroke(p)
    })

    // The operator joins the graph: lime links from the pointer to nearby nodes.
    if (pointer.active) {
      const px = pointer.x
      const py = pointer.y + this.scrollShift
      const reach = linkDist * 1.4
      const path = new Path2D()
      for (const n of nodes) {
        const d = Math.hypot(n.x - px, n.y - py)
        if (d < reach) {
          path.moveTo(px, py)
          path.lineTo(n.x, n.y)
        }
      }
      ctx.globalAlpha = 0.35
      ctx.strokeStyle = colors.accent
      ctx.stroke(path)
    }

    // Nodes.
    const fills = [colors.ink, colors.accent, colors.signal]
    const nodeAlpha = [0.55, 0.95, 0.9]
    for (let kind = 0; kind < 3; kind++) {
      ctx.globalAlpha = nodeAlpha[kind]
      ctx.fillStyle = fills[kind]
      ctx.beginPath()
      for (const n of nodes) {
        if (n.kind !== kind) continue
        ctx.moveTo(n.x + n.r, n.y)
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
      }
      ctx.fill()
    }

    // Shockwave rings.
    for (const wv of this.waves) {
      const t = wv.age / WAVE_MS
      ctx.globalAlpha = (1 - t) * 0.6
      ctx.strokeStyle = colors.accent
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(wv.x, wv.y + this.scrollShift, wv.age * WAVE_SPEED, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.restore()
    ctx.globalAlpha = 1
  }
}
