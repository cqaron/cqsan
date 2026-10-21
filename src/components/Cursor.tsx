import { useEffect, useRef } from 'react'

/** Thin circle cursor that follows the pointer with easing and grows over interactive elements. */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = dotRef.current
    if (!el) return
    let x = innerWidth / 2, y = innerHeight / 2
    let tx = x, ty = y
    let scale = 1, tScale = 1
    let raf = 0
    let visible = false
    let lastX = -1, lastY = -1

    const paint = () => {
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`
      lastX = x; lastY = y
    }
    const onMove = (e: PointerEvent) => {
      tx = e.clientX; ty = e.clientY
      if (!visible) { visible = true; el.style.opacity = '1' }
      const t = e.target as HTMLElement
      const interactive = t.closest('a, button, [data-cursor]')
      tScale = interactive ? 2.1 : 1
      if (!raf) { previous = performance.now(); raf = requestAnimationFrame(loop) }
    }
    const onLeave = () => { visible = false; el.style.opacity = '0' }

    let previous = performance.now()
    const loop = (now: number) => {
      raf = 0
      const dt = Math.min(64, now - previous)
      previous = now
      x = tx
      y = ty
      const before = scale
      scale += (tScale - scale) * (1 - Math.exp(-dt / 65))
      // only touch the DOM when something actually moves
      if (x !== lastX || y !== lastY || scale !== before) paint()
      // settled and idle: sleep until the next pointermove restarts us
      if (x === tx && y === ty && Math.abs(tScale - scale) < 0.002) {
        if (scale !== tScale) { scale = tScale; paint() }
        return
      }
      raf = requestAnimationFrame(loop)
    }
    addEventListener('pointermove', onMove)
    document.documentElement.addEventListener('pointerleave', onLeave)
    raf = requestAnimationFrame(loop)
    return () => {
      removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [])

  return <div ref={dotRef} className="cursor-ring" aria-hidden />
}
