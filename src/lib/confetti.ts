/**
 * confetti.ts: a single, dependency-free burst for the "sudo hire abhishek" easter egg.
 * One fixed canvas, ~140 square flakes in the theme's colours, gravity and drag, removed after
 * ~2.6s. Runs on the shared frame loop. Skipped entirely under reduced motion.
 */
import { onFrame } from './gsap'
import { readColor } from './tokens'
import { maxDpr } from './perf'

export function confetti(origin?: { x: number; y: number }) {
  const canvas = document.createElement('canvas')
  canvas.className = 'confetti'
  canvas.setAttribute('aria-hidden', 'true')
  document.body.appendChild(canvas)
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr())
  const w = window.innerWidth
  const h = window.innerHeight
  canvas.width = w * dpr
  canvas.height = h * dpr
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas.remove()
  ctx.scale(dpr, dpr)
  const colors = [readColor('--color-accent'), readColor('--color-signal'), readColor('--color-ink')]
  const ox = origin?.x ?? w / 2
  const oy = origin?.y ?? h * 0.62
  const flakes = Array.from({ length: 140 }, () => {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6
    const v = 0.55 + Math.random() * 0.75
    return {
      x: ox,
      y: oy,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      s: 4 + Math.random() * 6,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.02,
      c: colors[(Math.random() * colors.length) | 0],
    }
  })
  let t = 0
  const off = onFrame((_t, delta) => {
    const dt = Math.min(delta, 32)
    t += dt
    ctx.clearRect(0, 0, w, h)
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - 1800) / 800)
    for (const f of flakes) {
      f.vy += 0.0016 * dt
      f.vx *= 0.995
      f.x += f.vx * dt
      f.y += f.vy * dt
      f.r += f.vr * dt
      ctx.save()
      ctx.translate(f.x, f.y)
      ctx.rotate(f.r)
      ctx.fillStyle = f.c
      ctx.fillRect(-f.s / 2, -f.s / 4, f.s, f.s / 2)
      ctx.restore()
    }
    if (t > 2600) {
      off()
      canvas.remove()
    }
  })
}
