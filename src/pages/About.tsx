import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import MacScene from '../components/MacScene'
import ScrollCue from '../components/ScrollCue'
import CodeRain from '../components/CodeRain'
import { ABOUT_EDU, ABOUT_EXPERIENCE, ABOUT_SKILLS } from '../data/about'
import { useI18n } from '../i18n'

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/* Hand-drawn marker ellipse hugging the emphasised name. The loop is
   deliberately imperfect — varying radii and a closing flick that runs past
   the start — so it reads as marker-on-paper, not a geometric circle.
   Drawn with a dash travel (see index.css st-ell-draw); the stroke is
   non-scaling, so the em-sized box may stretch per language freely. */
const ELLIPSE_D =
  'M50 6 C78 5 96 20 95 40 C94 62 74 94 50 95 C27 96 5 78 5 52 C5 28 24 6 46 5 C53 4.2 60 4.5 66 6.5'

/** Box size in em, estimated from the word's own advance width
    (CJK ≈ 1em per char, latin ≈ 0.58em) — a wrap only has to hug, not trace. */
function ellipseBox(text: string) {
  const cjk = /[\u4e00-\u9fff]/.test(text)
  const adv = [...text].reduce((s, c) => s + (/[\u4e00-\u9fff]/.test(c) ? 1 : 0.58), 0)
  return cjk
    ? { width: `${(adv * 1.5).toFixed(2)}em`, height: `${(adv * 0.98).toFixed(2)}em` }
    : { width: `${(adv * 1.32).toFixed(2)}em`, height: `${(adv * 0.42).toFixed(2)}em` }
}

/** Statement block: words float in left-to-right, one after another,
    the moment the block scrolls into view. Deliberately slow. */
function Statement({ text, tail, emphasis }: { text: string; tail?: boolean; emphasis?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [inView, setInView] = useState(false)
  const [rush, setRush] = useState(false)
  // remount key for the hand-drawn ellipse: 1 on view-enter, +1 on every click
  const [ellKey, setEllKey] = useState(0)
  useEffect(() => {
    let lastY = scrollY
    let lastT = performance.now()
    const onScroll = () => {
      const now = performance.now()
      const v = Math.abs(scrollY - lastY) / Math.max(16, now - lastT)
      lastY = scrollY
      lastT = now
      if (v > 1.6) setRush(true)
    }
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        setInView(true)
        io.disconnect()
      }
    }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  // the ellipse waits for the name to float in, then draws itself — fast
  useEffect(() => {
    if (!inView || !emphasis) return
    const t = window.setTimeout(() => setEllKey(1), 850)
    return () => clearTimeout(t)
  }, [inView, emphasis])
  // English floats in word by word; Chinese character by character.
  // "\n" in the copy starts a new line (a <br />), the float order stays continuous.
  const spaced = text.includes(' ')
  const lines = text.split('\n')
  let k = 0
  return (
    <div className="statement-wrap">
      <p className={`statement ${inView ? 'st-in' : ''} ${rush ? 'st-rush' : ''}`} ref={ref}>
        {lines.map((line, li) => {
          const tokens = spaced ? line.split(' ') : (emphasis ? line.split(new RegExp(`(${emphasis})`)).flatMap(part => part === emphasis ? [part] : [...part]) : [...line])
          return (
            <Fragment key={li}>
              {tokens.map(w => {
                const i = k++
                const named = Boolean(emphasis && w.includes(emphasis))
                return (
                  <Fragment key={i}>
                    <span
                      className={`st-word ${named ? 'st-name' : ''}`}
                      style={{ transitionDelay: `${Math.min(i * 95, 2800)}ms` }}
                      onClick={named ? () => setEllKey(k => k + 1) : undefined}
                    >
                      {w}
                      {named && ellKey > 0 && (
                        <svg
                          key={ellKey}
                          className="st-ell"
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                          style={ellipseBox(w)}
                          aria-hidden
                        >
                          <path d={ELLIPSE_D} pathLength={1} vectorEffect="non-scaling-stroke" />
                        </svg>
                      )}
                    </span>
                    {spaced ? ' ' : ''}
                  </Fragment>
                )
              })}
              {li < lines.length - 1 && <br />}
            </Fragment>
          )
        })}
        {tail && <span className="stmt-dash" aria-hidden style={{ transitionDelay: `${Math.min(k * 55, 2400)}ms` }} />}
      </p>
    </div>
  )
}

/** Slow fade-up reveal for the structured about sections. */
function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        setInView(true)
        io.disconnect()
      }
    }, { threshold: 0.18 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className={`about-reveal ${inView ? 'ar-in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------
   ASCII decoration: a diverse field of monospace marks scattered over
   the whole about page — single glyphs, short code tokens, and small
   ascii-art figures (a dashed arrow, a spark, a pixel block). A few
   flicker to a new character every beat; rare Klein-blue sparks.
   Desktop only, pointer-transparent, well below reading contrast.
------------------------------------------------------------------ */
const ASCII_POOL = '01<>/\\|+-=*#%@:;·'
const ASCII_TOKENS = ['=>', '[ ]', '{ * }', '//', '0x2B5BFF', '&&', '< />', '::', 'fn()', '#!']
/* small multi-line ascii figures, drawn cell-by-cell so they can flicker too */
const ASCII_FIGURES: string[][] = [
  ['*---*', '|   |', '*---*'],
  ['.--', ':  \\', '   >', ':  /', "'--"],
  [' . .', '  + ', ' . .'],
]
function AboutAscii() {
  const SINGLES = 150
  const cells = useMemo(() => Array.from({ length: SINGLES }, () => ({
    x: Math.random() * 97,
    y: Math.random() * 98.5,
    ch: ASCII_POOL[Math.floor(Math.random() * ASCII_POOL.length)],
    blue: Math.random() < 0.07,
    size: 12 + Math.floor(Math.random() * 4),
  })), [])
  const tokens = useMemo(() => Array.from({ length: 22 }, () => ({
    x: Math.random() * 92,
    y: Math.random() * 98,
    text: ASCII_TOKENS[Math.floor(Math.random() * ASCII_TOKENS.length)],
    blue: Math.random() < 0.18,
    size: 10 + Math.floor(Math.random() * 3),
  })), [])
  const figures = useMemo(() => Array.from({ length: 5 }, (_, f) => ({
    x: 4 + Math.random() * 88,
    y: 6 + Math.random() * 90,
    fig: ASCII_FIGURES[f % ASCII_FIGURES.length],
    blue: Math.random() < 0.4,
  })), [])
  const [tick, setTick] = useState(0)
  const [enabled, setEnabled] = useState(true)
  useEffect(() => {
    const mq = matchMedia('(max-width: 1100px)')
    const apply = () => setEnabled(!mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => setTick(v => v + 1), 900)
    return () => clearInterval(id)
  }, [enabled])
  if (!enabled) return null
  return (
    <div className="about-ascii" aria-hidden>
      {cells.map((cell, i) => {
        const flick = (i * 13 + tick) % 29 === 0
        const ch = flick ? ASCII_POOL[(i * 7 + tick) % ASCII_POOL.length] : cell.ch
        return (
          <span
            key={i}
            className={`aa-cell ${cell.blue ? 'aa-blue' : ''} ${flick ? 'aa-flick' : ''}`}
            style={{ left: `${cell.x}%`, top: `${cell.y}%`, fontSize: cell.size }}
          >{ch}</span>
        )
      })}
      {tokens.map((tk, i) => (
        <span
          key={`t${i}`}
          className={`aa-cell aa-token ${tk.blue ? 'aa-blue' : ''}`}
          style={{ left: `${tk.x}%`, top: `${tk.y}%`, fontSize: tk.size }}
        >{tk.text}</span>
      ))}
      {figures.map((fg, i) => (
        <span
          key={`f${i}`}
          className={`aa-cell aa-fig ${fg.blue ? 'aa-blue' : ''}`}
          style={{ left: `${fg.x}%`, top: `${fg.y}%` }}
        >{fg.fig.join('\n')}</span>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------
   Closing sequence: a real 3D Macintosh sits in a minimal studio scene;
   scrolling dollies the camera in while the machine straightens up, the
   site on its screen dims to black, and that black floods the viewport,
   carrying the page into the closing statements. (Timings unchanged.)
------------------------------------------------------------------ */
function EndCard() {
  const trackRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)
  // the code rain draws into an off-DOM canvas; the Mac scene textures it
  // onto a backdrop wall so the gear occludes the rain with real depth
  const rainCanvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const track = trackRef.current
        if (!track) return
        const total = track.offsetHeight - innerHeight
        const p = clamp01(scrollY / Math.max(1, total))
        progressRef.current = p

        // NOTE: the Mac canvas stays fully opaque — once the camera is
        // through the screen the in-scene darkness fills the frame, so
        // fading the canvas here would let the white page flash through.
        // seal the last few percent into pure black
        const fade = track.querySelector('.ec-fade') as HTMLElement | null
        if (fade) fade.style.opacity = String(smooth(0.74, 0.9, p))
        const cue = track.querySelector('.ec-scroll-cue') as HTMLElement | null
        if (cue) {
          cue.style.opacity = String(1 - smooth(0.93, 0.99, p))
          const ink = Math.round(28 + 217 * smooth(0.50, 0.70, p))
          cue.style.color = `rgb(${ink}, ${ink}, ${ink})`
        }
      })
    }
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    return () => {
      removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="ec-track" ref={trackRef}>
      <div className="ec-sticky" ref={stageRef}>
        <CodeRain progress={progressRef} canvasRef={rainCanvasRef} stageRef={stageRef} />
        <MacScene progress={progressRef} rainCanvasRef={rainCanvasRef} />
        <div className="ec-fade" aria-hidden /><div className="ec-scroll-cue"><ScrollCue /></div>
      </div>
    </div>
  )
}

export default function About() {
  const { lang, t } = useI18n()
  const zh = lang === 'zh'
  return (
    <div className="page-about">
      <Nav back />
      <EndCard />
      <div className="about-body">
        <AboutAscii />
        {/* short intro */}
        <Statement text={t.aboutS1} emphasis={zh ? '陈祺' : 'Quincy'} />

        {/* skills */}
        <section className="about-sec">
          <Reveal>
            <h3 className="about-h"><span className="about-sq" aria-hidden />{t.aboutSkills}</h3>
          </Reveal>
          <ul className="about-list">
            {ABOUT_SKILLS.map((s, i) => (
              <Reveal key={s.title} delay={120 + i * 110}>
                <li className="about-li">
                  <b>{zh ? s.titleZh : s.title}</b>
                  <span className="about-li-sep">·</span>
                  {zh ? s.textZh : s.text}
                </li>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* internship experience */}
        <section className="about-sec">
          <Reveal>
            <h3 className="about-h"><span className="about-sq" aria-hidden />{t.aboutExp}</h3>
          </Reveal>
          {ABOUT_EXPERIENCE.map((e, i) => (
            <Reveal key={e.id} delay={120 + i * 90} className="about-exp">
              <div className="about-exp-head">
                <span className="about-exp-co">{zh ? e.companyZh : e.company}</span>
                <span className="about-exp-role">{zh ? `${e.deptZh} · ${e.roleZh}` : `${e.dept} · ${e.role}`}</span>
                <span className="about-exp-date">{zh ? e.periodZh : e.period}</span>
              </div>
              <ul className="about-list">
                {e.items.map(it => (
                  <li className="about-li" key={it.label}>
                    <b>{zh ? it.labelZh : it.label}</b>
                    <span className="about-li-sep">·</span>
                    {zh ? it.textZh : it.text}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </section>

        {/* education */}
        <section className="about-sec">
          <Reveal>
            <h3 className="about-h"><span className="about-sq" aria-hidden />{t.aboutEdu}</h3>
          </Reveal>
          <Reveal delay={120} className="about-exp">
            <div className="about-exp-head">
              <span className="about-exp-co">{zh ? ABOUT_EDU.schoolZh : ABOUT_EDU.school}</span>
              <span className="about-exp-role">{zh ? ABOUT_EDU.majorZh : ABOUT_EDU.major}</span>
              <span className="about-exp-date">{zh ? ABOUT_EDU.periodZh : ABOUT_EDU.period}</span>
            </div>
            <ul className="about-list">
              {ABOUT_EDU.items.map((it, i) => (
                <li className="about-li" key={i}>{zh ? it.textZh : it.text}</li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* closing line */}
      </div>
      <Footer dark />
    </div>
  )
}
