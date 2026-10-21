import { useEffect, useRef, useState } from 'react'

const GLYPHS = 'XZ{}[]*+/<>#%&$@≈∅◊Ø∆≡◈'

// Klein blue (#2e2ee6 ≈ hsl(240 79% 54%)) jittered per flash. Hue stays inside a
// narrow band so nothing drifts toward green or red; lightness swings wide
// because the hero ground is black and a saturated 54% blue reads as muddy.
const rand = (a: number, b: number) => a + Math.random() * (b - a)
const cipherColor = () => `hsl(${rand(231, 249).toFixed(0)} ${rand(64, 96).toFixed(0)}% ${rand(56, 86).toFixed(0)}%)`

type FreezeRef = { current: boolean } | undefined

/** One letter; when (and only when) the pointer rests on it, it slowly
    cycles through cipher glyphs until the pointer leaves. */
function Letter({ ch, className, freeze }: { ch: string; className?: string; freeze?: FreezeRef }) {
  const [glyph, setGlyph] = useState<{ ch: string; color: string } | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = () => {
    if (!ch.trim() || freeze?.current) return
    setGlyph({ ch: GLYPHS[Math.floor(Math.random() * GLYPHS.length)], color: cipherColor() })
    timer.current = setInterval(() => {
      setGlyph({ ch: GLYPHS[Math.floor(Math.random() * GLYPHS.length)], color: cipherColor() })
    }, 320)
  }
  const stop = () => {
    if (timer.current) clearInterval(timer.current)
    timer.current = null
    setGlyph(null)
  }
  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  if (glyph) {
    return (
      <span className="scramble-cipher" style={{ color: glyph.color }} onPointerLeave={stop}>
        {glyph.ch}
      </span>
    )
  }
  return (
    <span className={className} onPointerEnter={ch.trim() ? start : undefined} data-cursor>
      {ch === ' ' ? ' ' : ch}
    </span>
  )
}

/**
 * Text with two glitch behaviours:
 * 1. ambient — random letters briefly flash into coloured glyphs (idle)
 * 2. per-letter hover — only the letter under the cursor slowly scrambles
 */
export default function ScrambleText({
  text,
  className,
  interval = 3400,
  freeze,
}: {
  text: string
  className?: string
  interval?: number
  /** while freeze.current is true: no hover scramble, no ambient glitch */
  freeze?: FreezeRef
}) {
  const [ambient, setAmbient] = useState<Record<number, { ch: string; color: string }>>({})

  useEffect(() => {
    let alive = true
    let timer: ReturnType<typeof setTimeout>
    const glitch = () => {
      if (!alive) return
      if (freeze?.current) {                       // frozen: stay perfectly still
        timer = setTimeout(glitch, 600)
        return
      }
      const candidates = text.split('').map((c, i) => (c.trim() ? i : -1)).filter(i => i >= 0)
      const next: Record<number, { ch: string; color: string }> = {}
      const n = 1 + Math.floor(Math.random() * 3)
      for (let k = 0; k < n && candidates.length; k++) {
        const pick = Math.floor(Math.random() * candidates.length)
        const i = candidates.splice(pick, 1)[0]
        next[i] = { ch: GLYPHS[Math.floor(Math.random() * GLYPHS.length)], color: cipherColor() }
      }
      setAmbient(next)
      setTimeout(() => alive && setAmbient({}), 480 + Math.random() * 350)
      timer = setTimeout(glitch, interval + Math.random() * 1800)
    }
    timer = setTimeout(glitch, 1600)
    return () => { alive = false; clearTimeout(timer) }
  }, [text, interval, freeze])

  return (
    <span className={className} aria-label={text}>
      {text.split('').map((c, i) =>
        ambient[i] ? (
          <span key={i} className="scramble-glyph" style={{ color: ambient[i].color }}>
            {ambient[i].ch}
          </span>
        ) : (
          <Letter key={i} ch={c} freeze={freeze} />
        ),
      )}
    </span>
  )
}
