import { useEffect, useRef } from 'react'

const GLYPHS = '01<>/\\|+-=*#%@:;·'.split('')
const CELL = 30
const DENSITY = 0.075
const ACCENT = '46, 46, 230' // site accent blue
const INK = '20, 20, 24'

interface Cell {
  glyph: string
  pixel: boolean // drawn as a solid pixel block instead of a glyph
  accent: boolean
  base: number // resting opacity 0..1 (scaled down at draw time)
  flash: number // jump-change burst, decays to 0
  phase: number
}

/**
 * Sparse ASCII / pixel-art field behind the work list. Cells quietly flicker,
 * a few jump-change every moment, and the pointer wakes the ones it passes.
 */
export default function PixelField({ chars, pixels = 0.3 }: { chars?: string; pixels?: number } = {}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cvs = ref.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')!
    const glyphs = chars ? chars.split('') : GLYPHS
    let cells: Cell[] = []
    let cols = 0, rows = 0
    let raf = 0
    let visible = false
    const mouse = { x: -9999, y: -9999 }

    const randomCell = (): Cell => {
      const accent = Math.random() < 0.14
      return {
        glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
        pixel: Math.random() < pixels,
        accent,
        base: 0.25 + Math.random() * 0.75,
        flash: 0,
        phase: Math.random() * Math.PI * 2,
      }
    }

    const build = () => {
      const parent = cvs.parentElement!
      const w = parent.clientWidth, h = parent.clientHeight
      const dpr = Math.min(devicePixelRatio, innerWidth < 700 ? 1.3 : 1.75)
      cvs.width = w * dpr
      cvs.height = h * dpr
      cvs.style.width = `${w}px`
      cvs.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.font = '600 13px ui-monospace, "SF Mono", Menlo, Consolas, monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      cols = Math.ceil(w / CELL)
      rows = Math.ceil(h / CELL)
      cells = []
      for (let i = 0; i < cols * rows; i++) {
        cells.push(Math.random() < DENSITY ? randomCell() : {
          glyph: '', pixel: false, accent: false, base: 0, flash: 0, phase: 0,
        })
      }
    }

    const onMove = (e: PointerEvent) => {
      const r = cvs.getBoundingClientRect()
      mouse.x = e.clientX - r.left
      mouse.y = e.clientY - r.top
    }
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999 }

    const tick = (t: number) => {
      raf = 0
      if (!visible) return // off screen: sleep until the observer wakes us
      ctx.clearRect(0, 0, cvs.width, cvs.height)
      // a handful of cells jump-change every frame — the "hop" feel
      const hops = Math.max(2, Math.floor(cols * rows * 0.004))
      for (let k = 0; k < hops; k++) {
        const i = Math.floor(Math.random() * cells.length)
        if (cells[i].glyph) {
          cells[i] = { ...randomCell(), flash: 1 }
        } else if (Math.random() < 0.35) {
          cells[i] = { ...randomCell(), flash: 1 }
        }
      }
      const time = t * 0.001
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i]
        if (!c.glyph) continue
        const cx = (i % cols) * CELL + CELL / 2
        const cy = Math.floor(i / cols) * CELL + CELL / 2
        const dx = cx - mouse.x, dy = cy - mouse.y
        const near = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 150)
        if (near > 0.55 && Math.random() < 0.06) cells[i] = { ...randomCell(), flash: 1, accent: c.accent }
        c.flash *= 0.9
        const flicker = 0.75 + 0.25 * Math.sin(time * 1.8 + c.phase)
        let a = c.base * flicker * (c.accent ? 0.34 : 0.11)
        a += c.flash * (c.accent ? 0.5 : 0.2) // jump burst
        a += near * (c.accent ? 0.5 : 0.22) // pointer wake
        a = Math.min(a, c.accent ? 0.85 : 0.4)
        const color = c.accent ? ACCENT : INK
        if (c.pixel) {
          const s = 4 + c.flash * 4 + near * 3
          ctx.fillStyle = `rgba(${color}, ${a})`
          ctx.fillRect(cx - s / 2, cy - s / 2, s, s)
        } else {
          ctx.fillStyle = `rgba(${color}, ${a})`
          ctx.fillText(c.glyph, cx, cy)
        }
      }
      raf = requestAnimationFrame(tick)
    }

    build()
    const io = new IntersectionObserver(es => {
      visible = es.some(e => e.isIntersecting)
      if (visible && !raf) raf = requestAnimationFrame(tick)
    })
    io.observe(cvs.parentElement!)
    addEventListener('resize', build)
    addEventListener('pointermove', onMove)
    cvs.parentElement!.addEventListener('pointerleave', onLeave)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      removeEventListener('resize', build)
      removeEventListener('pointermove', onMove)
      cvs.parentElement?.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return <canvas ref={ref} className="pixel-field" aria-hidden />
}
