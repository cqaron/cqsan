import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import ParticleGlobe from '../components/ParticleGlobe'
import PixelMoon from '../components/PixelMoon'
import ScrambleText from '../components/ScrambleText'
import Nav from '../components/Nav'
import PixelField from '../components/PixelField'
import ScrollCue from '../components/ScrollCue'
import Preloader from '../components/Preloader'
import { SELECTED_WORK } from '../data/projects'
import { useI18n } from '../i18n'

/* State-driven reveal — immune to React wiping manually-added classes. */
function useInView<T extends HTMLElement>(threshold = 0.12, rootMargin = '0px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        setInView(true)
        io.disconnect()
      }
    }, { threshold, rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, rootMargin])
  return { ref, inView }
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

export default function Home() {
  const { lang, t, toggle } = useI18n()
  const [showPre, setShowPre] = useState(true)
  const [loaded, setLoaded] = useState(false)
  // Hero reveal waits for the globe to be ready, with a 2s safety cap so a slow
  // device never leaves the page stuck behind the counter
  const [revealed, setRevealed] = useState(false)
  const [globeReady, setGlobeReady] = useState(false)
  const [globeTimedOut, setGlobeTimedOut] = useState(false)
  const [bootP, setBootP] = useState(0.04)
  const bumpBoot = (p: number) => setBootP(v => (p > v ? p : v))
  const fontsOk = useRef(false)
  const globeOk = useRef(false)
  const finishBoot = () => { if (fontsOk.current && globeOk.current) bumpBoot(1) }
  useEffect(() => {
    document.fonts?.ready.then(() => { fontsOk.current = true; bumpBoot(0.35); finishBoot() }).catch(() => { fontsOk.current = true; finishBoot() })
    const cap = window.setTimeout(() => { fontsOk.current = true; globeOk.current = true; bumpBoot(1); setGlobeTimedOut(true) }, 8000)
    return () => clearTimeout(cap)
  }, [])
  /* the page underneath must not move while the counter is up */
  useEffect(() => {
    if (!showPre) return
    const html = document.documentElement
    const prevHtml = html.style.overflow
    const prevBody = document.body.style.overflow
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    scrollTo(0, 0)
    const pin = () => { if (scrollY !== 0) scrollTo(0, 0) }
    const block = (e: Event) => e.preventDefault()
    const keys = (e: KeyboardEvent) => {
      if ([' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(e.key)) e.preventDefault()
    }
    addEventListener('scroll', pin)
    addEventListener('wheel', block, { passive: false })
    addEventListener('touchmove', block, { passive: false })
    addEventListener('keydown', keys)
    return () => {
      html.style.overflow = prevHtml
      document.body.style.overflow = prevBody
      removeEventListener('scroll', pin)
      removeEventListener('wheel', block)
      removeEventListener('touchmove', block)
      removeEventListener('keydown', keys)
      scrollTo(0, 0)
    }
  }, [showPre])
  useEffect(() => {
    if (!revealed) return
    const t = window.setTimeout(() => setGlobeTimedOut(true), 2000)
    return () => clearTimeout(t)
  }, [revealed])
  useEffect(() => {
    if (revealed && (globeReady || globeTimedOut)) setLoaded(true)
  }, [revealed, globeReady, globeTimedOut])
  // start the work reveal only once the section has climbed well into the viewport,
  // so nothing greyish fades in while the dive's white is still handing over
  const { ref: workRef, inView } = useInView<HTMLElement>(0.12, '0px 0px -28% 0px')
  const { ref: aboutRef, inView: aboutIn } = useInView<HTMLElement>(0.12, '0px 0px -28% 0px')
  const [hovered, setHovered] = useState<number | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  /* Measure the exact centre of the first "l" INK (not the letter box) by
     drawing the glyph onto an offscreen canvas and scanning its pixels, and
     derive the scale needed for that white stroke to flood the viewport.
     Layout offsets are used throughout, so measuring is valid at any zoom. */
  const measureRef = useRef<() => void>(() => {})
  useEffect(() => {
    if (!loaded) return

    const inkOf = (el: HTMLElement) => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (!w || !h) return null
      const s = 2
      const cv = document.createElement('canvas')
      cv.width = Math.ceil(w * s)
      cv.height = Math.ceil(h * s)
      const ctx = cv.getContext('2d', { willReadFrequently: true })
      if (!ctx) return null
      const cs = getComputedStyle(el)
      ctx.scale(s, s)
      ctx.fillStyle = '#fff'
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
      ctx.textBaseline = 'middle'
      ctx.fillText(el.textContent ?? '', 0, h / 2)
      const data = ctx.getImageData(0, 0, cv.width, cv.height).data
      let minX = cv.width, maxX = -1, minY = cv.height, maxY = -1
      for (let y = 0; y < cv.height; y++) {
        for (let x = 0; x < cv.width; x++) {
          if (data[(y * cv.width + x) * 4 + 3] > 40) {
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
          }
        }
      }
      if (maxX < 0) return null
      // the stem: ink range across the vertical middle band — serifs widen
      // the bounding box, but the stem is what must flood the screen
      const bandTop = Math.floor(minY + (maxY - minY) * 0.32)
      const bandBot = Math.ceil(maxY - (maxY - minY) * 0.32)
      let sx0 = cv.width, sx1 = -1
      for (let y = bandTop; y <= bandBot; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (data[(y * cv.width + x) * 4 + 3] > 40) {
            if (x < sx0) sx0 = x
            if (x > sx1) sx1 = x
          }
        }
      }
      const hasStem = sx1 >= sx0
      return {
        cx: (hasStem ? (sx0 + sx1) / 2 : (minX + maxX) / 2) / s,
        cy: (minY + maxY) / 2 / s,
        w: (hasStem ? sx1 - sx0 + 1 : maxX - minX + 1) / s,
        h: (maxY - minY + 1) / s,
      }
    }

    const measure = () => {
      const h1 = document.querySelector('.hero-hello')
      const ht = document.querySelector('.hero-text') as HTMLElement | null
      if (!h1 || !ht || !ht.offsetWidth) return
      const letters = h1.querySelectorAll(':scope > span > span')
      if (letters.length < 4) return
      const el = letters[2] as HTMLElement // first "l" in "Hello,"
      const ink = inkOf(el)
      const cx = el.offsetLeft + (ink ? ink.cx : el.offsetWidth / 2)
      const cy = el.offsetTop + (ink ? ink.cy : el.offsetHeight / 2)
      ht.dataset.llOrigin = `${(cx / ht.offsetWidth) * 100}% ${(cy / ht.offsetHeight) * 100}%`
      const iw = ink ? Math.max(4, ink.w) : Math.max(4, el.offsetWidth)
      const ih = ink ? Math.max(4, ink.h) : Math.max(4, el.offsetHeight)
      // scale so the STEM itself overflows the whole screen, any viewport —      // a little extra margin, so no sliver of black can survive at the edge
      // margin raised from 1.4: at 1.4 the stem only covered ~60% of the width before the
      // white sheet, leaving black slivers whose anti-aliased edges read as a grey flash
      ht.dataset.llScale = String(Math.ceil(Math.max(innerWidth / iw, innerHeight / ih) * 2.2))
    }
    measureRef.current = measure

    const t = setTimeout(measure, 500)
    document.fonts?.ready.then(() => measure()).catch(() => {})
    addEventListener('resize', measure)
    return () => {
      clearTimeout(t)
      removeEventListener('resize', measure)
    }
  }, [loaded, lang])

  /* Scroll: zoom into the white "ll" stroke until it floods the screen.
     Progress is damped (lerped toward the scroll target every frame) so
     the dive feels like one continuous camera move. The moment a dive
     begins, the scramble letters snap back to clean text (via remount)
     and the stroke centre is re-measured, so the camera ALWAYS enters
     through the white "l" — on any device, at any glyph state. */
  const freezeRef = useRef(false)
  const [diving, setDiving] = useState(false)
  const diveState = useRef(false)
  const lastMeasure = useRef(0)
  useEffect(() => {
    let raf = 0
    let running = true
    let target = 0
    let shown = -1 // force first paint

    const onScroll = () => {
      const track = trackRef.current
      if (!track) return
      const total = track.offsetHeight - innerHeight
      target = clamp01(scrollY / Math.max(1, total))
      // the damped loop sleeps once settled — wake it for this move
      if (!raf) raf = requestAnimationFrame(frame)
      // dive just started: restore clean letters + re-measure the stroke
      if (target > 0.015 && !diveState.current) {
        diveState.current = true
        setDiving(true)
        // measure ONCE, after the letters have been restored to clean text (remount).
        // Re-measuring during the dive moved the zoom origin under the camera = a jump.
        lastMeasure.current = performance.now()
        setTimeout(() => measureRef.current(), 80)
      } else if (target <= 0.005 && diveState.current) {
        diveState.current = false
        setDiving(false)
      }
    }

    const frame = () => {
      if (!running) return
      const prev = shown
      shown = shown < 0 ? target : shown + (target - shown) * 0.11
      if (Math.abs(shown - target) < 0.0004) shown = target
      freezeRef.current = target > 0.015
      if (shown !== prev) {
        const p = shown
        const zoom = smooth(0.03, 0.92, p)

        const heroText = document.querySelector('.hero-text') as HTMLElement | null
        if (heroText) {
          const need = parseFloat(heroText.dataset.llScale || '80')
          heroText.style.transformOrigin = heroText.dataset.llOrigin || '40% 30%'
          // exponential zoom = a constant-speed camera dolly INTO the
          // letter; the white stem itself widens until it floods the
          // viewport — no mask, no patching sheet, just the letter
          heroText.style.transform =
            `translateY(-52%) scale(${Math.pow(need, zoom)})`
          // fade only once the white stroke already fills the screen: white text over
          // white is invisible, whereas fading over black produced a grey flash
          heroText.style.opacity = String(1 - smooth(0.985, 0.998, p))
        }
        const canvas = document.querySelector('.hero-canvas') as HTMLElement | null
        if (canvas) {
          canvas.style.transform = `scale(${1 + zoom * 0.7}) translateY(${p * 16}vh)`
          canvas.style.opacity = String(1 - smooth(0.1, 0.6, p))
          // the globe is invisible from here on: park its WebGL loop until the
          // visitor scrolls back up (see ParticleGlobe "portfolio-globe-resume")
          if (p > 0.62) {
            if (canvas.dataset.globePark !== '1') canvas.dataset.globePark = '1'
          } else if (canvas.dataset.globePark !== '0') {
            canvas.dataset.globePark = '0'
            dispatchEvent(new Event('portfolio-globe-resume'))
          }
        }
        const chrome = document.querySelectorAll('.hero-chrome, .hero-lang, .hero-scroll')
        chrome.forEach(c => {
          const el = c as HTMLElement
          el.style.opacity = String(1 - smooth(0, 0.22, p))
          if (p > 0.02) el.style.animation = 'none'
        })
        // the stem covers the last pixels itself; the white sheet only
        // seals the final 4% as an invisible safeguard against sub-pixel
        // gaps — identical #fff, so nothing ever "patches in"
        const white = document.querySelector('.hero-white') as HTMLElement | null
        // a sub-pixel safeguard only: the window is tiny and sits on an already-white
        // screen, so it never passes through a visible black/white grey mix
        // ramp the sheet in BEFORE the hero text starts fading (0.985+), so there is no
        // window where black hero ground and the half-transparent white mix into grey
        if (white) white.style.opacity = String(smooth(0.93, 0.96, p))
        const arrivalCue = document.querySelector('.home-white-cue') as HTMLElement | null
        if (arrivalCue) arrivalCue.style.opacity = String(smooth(0.86, 0.93, p))
      }
      // settled at rest: sleep this loop until the next scroll wakes it
      if (shown === target && shown === prev) { raf = 0; return }
      raf = requestAnimationFrame(frame)
    }

    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    raf = requestAnimationFrame(frame)
    return () => {
      running = false
      removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="page-home">
      {showPre && (
        <Preloader
          progress={globeTimedOut ? 1 : bootP}
          onReveal={() => setRevealed(true)}
          onGone={() => setShowPre(false)}
        />
      )}

      <div className="hero-track" ref={trackRef}>
        <section className={`hero hero-sticky ${loaded ? 'hero-in' : ''}`}>
          <ParticleGlobe
            className="hero-canvas"
            onProgress={bumpBoot}
            onReady={() => { globeOk.current = true; bumpBoot(0.92); finishBoot(); setGlobeReady(true) }}
          />
          <div className="hero-chrome">
            <Nav dark />
          </div>
          <div className="hero-text">
            <h1 className="hero-hello">
              <ScrambleText key={diving ? 'dive' : 'idle'} text="Hello," freeze={freezeRef} />
            </h1>
            <p className="hero-name">
              <ScrambleText key={diving ? 'dive' : 'idle'} text="I'm Quincy" interval={4200} freeze={freezeRef} />
            </p>
          </div>
          <button className="hero-lang" data-cursor onClick={toggle} aria-label="Switch language">
            {lang === 'en' ? '中文' : 'EN'}
          </button>
          <div className="hero-scroll"><ScrollCue /></div>
          <div className="hero-white" aria-hidden />
          <div className="home-white-cue"><ScrollCue /></div>
        </section>
      </div>

      {/* ---------- ABOUT TEASER ---------- */}
      <section className={`about-teaser ${aboutIn ? 'about-in' : ''}`} ref={aboutRef}>
        <PixelField chars="01" pixels={0} />
        <div className="about-grid">
          <h2 className="work-title reveal" style={{ transitionDelay: '0ms' }}>{t.aboutTitle}</h2>
          <div className="about-figure">
            <Link to="/about" data-cursor className="work-thumb about-card reveal" style={{ transitionDelay: '140ms' }} aria-label={t.aboutTitle}>
              <img loading="lazy" decoding="async" src="/assets/card-about-home-anim.webp" alt="" draggable={false} />
              <span className="about-dots reveal" style={{ transitionDelay: '260ms' }} aria-hidden>
                {Array.from({ length: 12 }, (_, k) => <i key={k} className={k === 7 ? 'on' : ''} />)}
              </span>
              <span className="about-kicker reveal" style={{ transitionDelay: '320ms' }}>ABOUT ME</span>
              <span className="about-name reveal" style={{ transitionDelay: '410ms' }}>QUINCY</span>
              <span className="about-ruler reveal" style={{ transitionDelay: '440ms' }} aria-hidden />
              <span className="about-dots about-dots-b reveal" style={{ transitionDelay: '520ms' }} aria-hidden>
                {Array.from({ length: 8 }, (_, k) => <i key={k} className={k === 2 || k === 5 ? 'on' : ''} />)}
              </span>
            </Link>
            <Link to="/about" data-cursor className="about-cta">
              {t.aboutCta} <span className="arrow-ne">↗</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- SELECTED WORK ---------- */}
      <section className={`work-section ${inView ? 'work-in' : ''}`} ref={workRef}>
        <PixelField />
        <div className="work-grid">
          <h2 className="work-title reveal" style={{ transitionDelay: '0ms' }}>
            {t.workTitleA}<br />{t.workTitleB}
          </h2>
          <div className="work-list">
            {SELECTED_WORK.map((w, i) => {
              const title = lang === 'zh' ? w.titleZh : w.title
              return (
              <Link
                to={w.link}
                data-cursor
                key={w.index}
                className={`work-row reveal ${hovered === i ? 'row-active' : ''}`}
                style={{ transitionDelay: `${140 + i * 90}ms` }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <span className="work-num">{w.index}</span>
                <span className="work-info">
                  <span className="work-name">
                    <span className="wn-roll">
                      <span className="wn-line">{title}</span>
                      <span className="wn-line wn-blue" aria-hidden>{title}</span>
                    </span>
                  </span>
                </span>
                <span className="work-thumb">
                  <img loading="lazy" decoding="async" src={w.thumb} alt={w.title} draggable={false} />
                </span>
              </Link>
              )
            })}
            <Link to="/all-work" data-cursor className="work-all reveal" style={{ transitionDelay: '560ms' }}>
              {t.workAll} <span className="arrow-ne">↗</span>
            </Link>
          </div>
        </div>
      </section>

      {/* closing: a slow ASCII moon, then the site address */}
      <section className="moon-section">
        <PixelMoon />
        <p className="moon-url"><span className="moon-sq" aria-hidden />www.cqsan.cn<span className="moon-sq" aria-hidden /></p>
      </section>
    </div>
  )
}
