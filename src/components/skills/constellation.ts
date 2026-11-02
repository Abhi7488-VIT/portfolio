/**
 * constellation.ts: a small force simulation for the skill graph (no library).
 *
 *  - Each skill is pulled toward its group hub by a spring; hubs are pulled toward their home.
 *  - Every pair of bodies repels (n is ~42, so the O(n^2) pass is a few microseconds).
 *  - Velocities are damped; the sim sleeps once its energy falls below a threshold and wakes on drag.
 *  - A dragged body follows the pointer exactly; on release it is flung with the pointer's velocity.
 */
export interface Body {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  r: number // collision radius (half the label width, roughly)
  hub: number // index of its hub body, -1 for hubs
  homeX: number
  homeY: number
  fixed: boolean
}

export class Constellation {
  bodies: Body[] = []
  w = 1
  h = 1
  private energy = Infinity
  dragged: Body | null = null

  layout(w: number, h: number, groups: { id: string; skills: string[] }[], measure: (id: string) => number) {
    const fresh = this.bodies.length === 0
    const prev = new Map(this.bodies.map((b) => [b.id, b]))
    this.w = w
    this.h = h
    const bodies: Body[] = []
    // Hubs on a 3 x 2 grid (2 x 3 when the stage is tall), skills in a ring around each hub.
    const cols = w >= h ? 3 : 2
    const rows = Math.ceil(groups.length / cols)
    const cellW = w / cols
    const cellH = h / rows
    groups.forEach((g, gi) => {
      const hx = cellW * ((gi % cols) + 0.5)
      const hy = cellH * (Math.floor(gi / cols) + 0.5)
      const hubId = `hub:${g.id}`
      const hubIndex = bodies.length
      const ph = prev.get(hubId)
      bodies.push({ id: hubId, x: ph?.x ?? hx, y: ph?.y ?? hy, vx: 0, vy: 0, r: measure(hubId) / 2 + 8, hub: -1, homeX: hx, homeY: hy, fixed: false })
      const n = g.skills.length
      g.skills.forEach((s, si) => {
        const sa = (si / n) * Math.PI * 2 - Math.PI / 2 + gi * 0.4
        const rx = Math.min(cellW * 0.36, 150) + (si % 2) * 18
        const ry = Math.min(cellH * 0.36, 110) + (si % 2) * 10
        const sx = hx + Math.cos(sa) * rx
        const sy = hy + Math.sin(sa) * ry
        const p = prev.get(s)
        bodies.push({
          id: s,
          x: p?.x ?? (fresh ? hx + (Math.random() - 0.5) * 30 : sx),
          y: p?.y ?? (fresh ? hy + (Math.random() - 0.5) * 30 : sy),
          vx: 0,
          vy: 0,
          r: measure(s) / 2 + 6,
          hub: hubIndex,
          homeX: sx,
          homeY: sy,
          fixed: false,
        })
      })
    })
    this.bodies = bodies
    this.wake()
  }

  wake() {
    this.energy = Infinity
  }

  get asleep() {
    return this.energy < 0.02 && !this.dragged
  }

  /** Advance the simulation by dt milliseconds. */
  step(dt: number) {
    const k = Math.min(dt, 32) / 16.67
    const B = this.bodies
    // Springs.
    for (const b of B) {
      if (b === this.dragged) continue
      if (b.hub < 0) {
        b.vx += (b.homeX - b.x) * 0.012 * k
        b.vy += (b.homeY - b.y) * 0.012 * k
      } else {
        const h = B[b.hub]
        const tx = h.x + (b.homeX - h.homeX)
        const ty = h.y + (b.homeY - h.homeY)
        b.vx += (tx - b.x) * 0.02 * k
        b.vy += (ty - b.y) * 0.02 * k
      }
    }
    // Pairwise repulsion. Labels are wide and short, so vertical distance counts more (ellipse metric).
    const VY = 2.6
    for (let i = 0; i < B.length; i++) {
      const a = B[i]
      for (let j = i + 1; j < B.length; j++) {
        const b = B[j]
        let dx = b.x - a.x
        let dy = (b.y - a.y) * VY
        let d2 = dx * dx + dy * dy
        if (d2 < 0.01) {
          dx = Math.random() - 0.5
          dy = Math.random() - 0.5
          d2 = 0.5
        }
        const min = a.r + b.r + 8
        if (d2 > min * min) continue
        const d = Math.sqrt(d2)
        const f = ((min - d) / d) * 0.12 * k
        const fx = dx * f
        const fy = (dy / VY) * f
        if (a !== this.dragged) {
          a.vx -= fx
          a.vy -= fy
        }
        if (b !== this.dragged) {
          b.vx += fx
          b.vy += fy
        }
      }
    }
    // Integrate, damp, keep inside the stage.
    let e = 0
    for (const b of B) {
      if (b === this.dragged) continue
      b.vx *= Math.pow(0.82, k)
      b.vy *= Math.pow(0.82, k)
      b.x += b.vx * k
      b.y += b.vy * k
      // Keep the whole label inside the stage.
      const m = b.r - 4
      b.x = Math.min(this.w - m, Math.max(m, b.x))
      b.y = Math.min(this.h - 22, Math.max(22, b.y))
      e += b.vx * b.vx + b.vy * b.vy
    }
    this.energy = e / B.length
  }

  /** Run the simulation to rest without rendering (reduced motion, first paint). */
  settle(iterations = 400) {
    for (let i = 0; i < iterations; i++) this.step(16.67)
  }
}
