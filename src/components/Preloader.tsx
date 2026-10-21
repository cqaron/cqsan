import { useEffect, useRef, useState } from 'react'
import { holdLoadingMotion } from '../lib/loadingMotion'

/* Time-led visual progress stays independent of network milestones. Resource
   readiness starts a finite 720ms landing, while the blue shimmer stays alive
   even during a long wait. Per-frame transforms avoid React rendering overhead. */
const CURVE_K = 2.0      // 时间曲线速率：t=0.5s→50% · 1s→67% · 2s→80% · 8s→94%
const FOLLOW_TAU = 0.09  // 数字贴住曲线的阻尼（吸收掉帧，不改变形状）

export default function Preloader({
  progress,
  onReveal,
  onGone,
}: {
  progress: number
  onReveal: () => void
  onGone: () => void
}) {
  const [fade, setFade] = useState(false)
  useEffect(() => { if (!fade) return holdLoadingMotion() }, [fade])
  const barRef = useRef<HTMLSpanElement>(null)
  const numRef = useRef<HTMLSpanElement>(null)
  const shown = useRef(0)
  const pRef = useRef(progress)
  pRef.current = progress

  useEffect(() => {
    let raf = 0
    let done = false
    const start = performance.now()
    let previous = start
    let goneTimer = 0
    let landingStart = -1
    let landingFrom = 0

    const paint = (v: number) => {
      if (barRef.current) barRef.current.style.transform = `scaleY(${(v / 100).toFixed(4)})`
      if (numRef.current) {
        const n = String(Math.floor(v))
        if (numRef.current.textContent !== n) numRef.current.textContent = n
      }
      const wrap = numRef.current?.parentElement
      if (wrap) wrap.style.transform = `translateY(${(14 + (v / 100) * 62).toFixed(3)}vh)`
    }
    shown.current = 0
    paint(0)

    const tick = (now: number) => {
      const dt = Math.min(0.064, Math.max(0, (now - previous) / 1000))
      previous = now
      const t = (now - start) / 1000
      const real = Math.max(0, Math.min(1, pRef.current))
      const cur = shown.current

      if (real >= 1 && t >= 0.65) {
        if (landingStart < 0) { landingStart = now; landingFrom = cur }
        const u = Math.min(1, (now - landingStart) / 720)
        // A finite, velocity-matched landing avoids the exponential snap to 100.
        const initialSlope = Math.min((100 - landingFrom) * 2, 720 * (100 * CURVE_K / (1 + CURVE_K * t) ** 2) / 1000)
        const ease = u * u * (3 - 2 * u)
        shown.current = landingFrom + (100 - landingFrom) * ease + initialSlope * u * (1 - u) ** 2
      } else {
        const aim = (CURVE_K * t) / (1 + CURVE_K * t) * 100
        shown.current = Math.max(cur, cur + (aim - cur) * (1 - Math.exp(-dt / FOLLOW_TAU)))
      }
      paint(shown.current)

      if (!done && real >= 1 && shown.current >= 99.9) {
        done = true
        paint(100)
        setFade(true)
        onReveal()
        goneTimer = window.setTimeout(onGone, 960)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); clearTimeout(goneTimer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`preloader ${fade ? 'pre-fade' : ''}`}>
      <span className="preloader-bar" aria-hidden ref={barRef} />
      <span className="preloader-num"><span ref={numRef}>0</span><span className="preloader-percent">%</span></span>
    </div>
  )
}

