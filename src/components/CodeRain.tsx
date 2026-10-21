import { useEffect } from 'react'
import type { MutableRefObject, RefObject } from 'react'
import { loadingMotionPaused } from '../lib/loadingMotion'

const CHARS = '01<>/\\|+-=*#%@$&:;·'.split('')
const COL_W = 26
const CHAR_H = 19
const ACCENT = '46, 46, 230' // Klein blue
const INK = '20, 20, 26'

interface Column {
  x: number
  y: number          // head position, px (wraps)
  speed: number      // px per second
  len: number        // trail length, chars
  accent: boolean    // this stream runs Klein blue
  chars: string[]
  strip?: HTMLCanvasElement
  dirty?: boolean
  flipAt: number     // next time a trail char jump-changes
}

/**
 * Sparse falling code streams. The canvas never enters the DOM: it is drawn
 * here and textured onto a backdrop wall INSIDE the Mac scene (see MacScene),
 * so the gear properly occludes the rain with the depth buffer instead of
 * the rain weaving through the translucent particle shells. Quiet ink
 * columns drift top-to-bottom; a few run Klein blue, and characters
 * jump-change with a brief accent flash — a classic code-rain cadence.
 */
export default function CodeRain({ progress, canvasRef, stageRef }: {
  progress: { current: number }
  canvasRef: MutableRefObject<HTMLCanvasElement | null>
  stageRef: RefObject<HTMLDivElement | null>
}) {
  useEffect(() => {
    // create (once) and hand the canvas to the scene that textures it
    let cvs = canvasRef.current
    if (!cvs) {
      cvs = document.createElement('canvas')
      canvasRef.current = cvs
    }
    const ctx = cvs.getContext('2d')!
    let cols: Column[] = []
    let raf = 0
    let onScreen = true
    let last = 0

    const build = () => {
      const w = innerWidth, h = innerHeight
      const dpr = Math.min(1, 1280 / w, 900 / h)
      cvs.width = w * dpr
      cvs.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.font = '500 13px ui-monospace, "SF Mono", Menlo, Consolas, monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      cols = []
      const n = Math.floor(w / COL_W)
      for (let i = 0; i < n; i++) {
        if (Math.random() < 0.14) continue // dense curtain, a few gaps
        const len = 8 + Math.floor(Math.random() * 13)
        cols.push({
          x: i * COL_W + COL_W / 2,
          y: Math.random() * h,
          speed: 85.5 + Math.random() * 153, // ~10% calmer than before
          len,
          accent: Math.random() < 0.16,
          chars: Array.from({ length: len }, () => CHARS[Math.floor(Math.random() * CHARS.length)]),
          flipAt: 0,
        })
      }
    }

    // Cache one vertical ribbon per stream; text rasterises only when a glyph changes.
    const ribbon = (c: Column) => {
      const strip = c.strip ?? document.createElement('canvas')
      if (strip.width !== COL_W || strip.height !== (c.len + 1) * CHAR_H) {
        strip.width = COL_W; strip.height = (c.len + 1) * CHAR_H
      }
      const ink = strip.getContext('2d')!
      ink.clearRect(0,0,strip.width,strip.height)
      ink.font = '500 13px ui-monospace, "SF Mono", Menlo, Consolas, monospace'
      ink.textAlign = 'center'; ink.textBaseline = 'top'
      for (let i = 0; i < c.len; i++) {
        const k = 1 - i / c.len
        const alpha = i === 0 ? (c.accent ? .72 : .26) : c.accent ? (.06+k*k*.55)*(i < 3 ? 1 : .6) : .035+k*k*.15
        ink.fillStyle = `rgba(${c.accent ? ACCENT : INK},${alpha})`
        ink.fillText(c.chars[i], COL_W / 2, (c.len - 1 - i) * CHAR_H)
      }
      c.strip = strip
      c.dirty = false
    }

    const tick = (t: number) => {
      raf = 0
      // the route veil owns the main thread while it draws its lines
      if (!onScreen || loadingMotionPaused()) return
      const dt = Math.min(0.1, (t - last) / 1000 || 0.016)
      last = t
      // fade with the dive — gone well before the screen floods black
      const p = progress.current
      const fade = 1 - Math.min(1, Math.max(0, (p - 0.38) / 0.2))
      if (fade <= 0) { wake(); return }

      const h = innerHeight
      ctx.clearRect(0, 0, innerWidth, h)
      for (const c of cols) {
        c.y += c.speed * dt
        if (c.y - c.len * CHAR_H > h) {
          c.y = -Math.random() * h * 0.3
          c.speed = 85.5 + Math.random() * 153
          c.accent = Math.random() < 0.16
          c.dirty = true
        }
        // occasional jump-change inside the trail — the glitch beat
        if (t > c.flipAt) {
          c.chars[Math.floor(Math.random() * c.len)] = CHARS[Math.floor(Math.random() * CHARS.length)]
          c.dirty = true
          c.flipAt = t + 150 + Math.random() * 560
        }
        if (!c.strip || c.dirty) ribbon(c)
        ctx.drawImage(c.strip!, c.x - COL_W / 2, c.y - (c.len - 1) * CHAR_H)
      }
      cvs.dataset.frame = String(t)
      wake()
    }
    const wake = () => { if (!raf && onScreen && !loadingMotionPaused()) raf = requestAnimationFrame(tick) }

    build()
    addEventListener('resize', build)
    addEventListener('portfolio-loading-motion', wake)
    // the rain only ever shows inside the Mac stage; freeze it outside that band
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      if (onScreen) wake()
    })
    if (stageRef.current) io.observe(stageRef.current)
    wake()
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      removeEventListener('resize', build)
      removeEventListener('portfolio-loading-motion', wake)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
