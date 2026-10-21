import { useEffect, useRef } from 'react'

/* A pixel-art moon. Phase follows the real synodic cycle (anchored to a known new moon),
   replayed at an accelerated rate so the phases visibly turn. Shading is a 4-level
   palette with 4x4 Bayer dithering, and the maria and craters are fixed. */

const N = 60 // grid size in pixels (room around the disc for the particles)
const R = 18 // moon radius in pixels
const SECONDS_PER_CYCLE = 12 // one full set of phases every 12s
const FPS = 8
const SYNODIC_MS = 29.530588853 * 86400000
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14)

// 4 levels, darkest to brightest: night side (earthshine), dark maria, lit highland, brightest highland.
// A cool, slightly blue-grey tint keeps it looking like the real moon rather than a flat grey disc.
const PAL: [number, number, number][] = [
  [178, 180, 190],
  [140, 142, 154],
  [216, 218, 226],
  [242, 243, 247],
]
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16)

// large maria: x, y (disk coords, -1..1), radius, albedo
const MARIA: [number, number, number, number][] = [
  [-0.32, 0.28, 0.3, 0.3],
  [-0.62, 0.02, 0.22, 0.32],
  [0.02, 0.42, 0.16, 0.3],
  [0.28, 0.12, 0.2, 0.32],
  [-0.18, -0.2, 0.2, 0.32],
  [0.56, 0.22, 0.1, 0.3],
  [0.18, -0.42, 0.12, 0.32],
  [-0.5, -0.36, 0.1, 0.3],
]

// deterministic crater field
function rnd(i: number) {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453
  return s - Math.floor(s)
}
const CRATERS: [number, number, number][] = Array.from({ length: 26 }, (_, i) => {
  const a = rnd(i * 3) * Math.PI * 2
  const d = Math.sqrt(rnd(i * 3 + 1)) * 0.82
  return [Math.cos(a) * d, Math.sin(a) * d, 0.03 + rnd(i * 3 + 2) * 0.05]
})

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Surface albedo at a disk point (x right, y up). */
function albedo(x: number, y: number) {
  let a = 0.8
  for (const [mx, my, mr, ma] of MARIA) {
    const d = Math.hypot(x - mx, y - my) / mr
    if (d < 1) a = Math.min(a, ma + (0.8 - ma) * smoothstep(0.55, 1, d))
  }
  for (const [cx, cy, cr] of CRATERS) {
    const d = Math.hypot(x - cx, y - cy) / cr
    if (d < 1.15) {
      if (d > 0.78) a += 0.1 // sunlit rim
      else a -= 0.07 // shaded floor
    }
  }
  return Math.min(1, Math.max(0, a))
}

/** Render one frame into an ImageData-sized buffer. `phase` is 0 (new) .. 0.5 (full) .. 1. */
function renderFrame(data: Uint8ClampedArray, phase: number) {
  const phi = phase * Math.PI * 2
  // sun direction: z flips across new/full; x flips between waxing (right) and waning (left)
  const sx = Math.sin(phi), sy = 0.22, sz = -Math.cos(phi)
  const sl = Math.hypot(sx, sy, sz)
  const Lx = sx / sl, Ly = sy / sl, Lz = sz / sl
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4
      const dx = (x + 0.5 - N / 2) / R
      const dy = -(y + 0.5 - N / 2) / R
      const r2 = dx * dx + dy * dy
      if (r2 > 1) {
        data[i + 3] = 0
        continue
      }
      const nz = Math.sqrt(1 - r2)
      const lit = Math.max(0, dx * Lx + dy * Ly + nz * Lz)
      const s = albedo(dx, dy) * Math.pow(lit, 0.75)
      // earthshine on the dark side keeps the disc readable
      const v = s * 3 + (r2 > 0.9 ? 0 : 0.2)
      const lvl = Math.min(3, Math.floor(v + BAYER[(y % 4) * 4 + (x % 4)]))
      const [r, g, b] = PAL[lvl]
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = 205 // a touch translucent, so it reads lighter on white
    }
  }
}

export default function PixelMoon() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = N
    canvas.height = N
    const img = ctx.createImageData(N, N)
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

    // starting phase = the real current phase; then it runs the cycle faster
    const age0 = ((Date.now() - KNOWN_NEW_MOON) / SYNODIC_MS) % 1
    const draw = (elapsed: number) => {
      renderFrame(img.data, (age0 + elapsed / SECONDS_PER_CYCLE) % 1)
      ctx.putImageData(img, 0, 0)
    }
    draw(0)
    if (reduce) return

    let visible = false
    let running = false
    let raf = 0
    let t0 = 0
    let lastStep = -1
    let elapsed = 0

    const tick = (now: number) => {
      if (!visible || document.hidden) {
        running = false
        return
      }
      if (!t0) t0 = now
      elapsed = (now - t0) / 1000
      const step = Math.floor(elapsed * FPS)
      if (step !== lastStep) {
        lastStep = step
        draw(elapsed)
      }
      raf = requestAnimationFrame(tick)
    }
    const start = () => {
      if (running || !visible || document.hidden) return
      running = true
      t0 = 0
      raf = requestAnimationFrame(tick)
    }

    // animate only while on (or near) the screen
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
    }, { rootMargin: '200px' })
    io.observe(canvas)
    document.addEventListener('visibilitychange', start)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      document.removeEventListener('visibilitychange', start)
    }
  }, [])

  return (
    <div className="moon-wrap" aria-hidden>
      <canvas ref={canvasRef} className="moon-canvas" />
    </div>
  )
}
