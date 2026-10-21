import { loadingMotionPaused } from '../lib/loadingMotion'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import Nav from '../components/Nav'
import CircularCarousel from '../components/CircularCarousel'
import type { CircularCarouselApi } from '../components/CircularCarousel'
import MobileDeck from '../components/MobileDeck'
import PatternWaves from '../components/PatternWaves'
import { PROJECTS, GROUP_LABEL } from '../data/projects'
import type { Project } from '../data/projects'
import { useI18n } from '../i18n'

const ALL = PROJECTS
const TOTAL = ALL.length

/**
 * One motion per change. The active item is a single state value; every visual
 * (desktop close-up, phone deck, CTA) reads it, so a switch is one move.
 * The ring is endless: stepping past the last project returns to the first.
 */
export default function AllWork() {
  const { lang, t } = useI18n()
  const [backgroundReady, setBackgroundReady] = useState(false)
  useEffect(() => {
    let timer = 0
    const settle = () => {
      clearTimeout(timer)
      if (!loadingMotionPaused()) timer = window.setTimeout(() => setBackgroundReady(true), 1100)
    }
    settle()
    addEventListener('portfolio-loading-motion', settle)
    return () => { clearTimeout(timer); removeEventListener('portfolio-loading-motion', settle) }
  }, [])
  const name = (p: Project) => (lang === 'zh' ? p.titleZh : p.title)
  const ITEMS = useMemo(() => ALL.map(p => ({
    // the wheel shows many small cards at once: use the lighter animated thumb
    src: p.thumbSm ?? p.thumb,
    alt: p.title,
    title: lang === 'zh' ? p.titleZh : p.title,
    subtitle: lang === 'zh' ? p.categoryZh : p.category,
  })), [lang])
  const DECK = useMemo(() => ITEMS.map(it => ({ src: it.src, alt: it.title })), [ITEMS])
  const apiRef = useRef<CircularCarouselApi | null>(null)
  // "?focus=<project id>" (from the home page) opens the ring on that project's card
  const [params] = useSearchParams()
  const [active, setActive] = useState(() => {
    const focus = params.get('focus')
    const at = focus ? ALL.findIndex(p => p.id === focus) : -1
    return at >= 0 ? at : 0
  })
  const [ever, setEver] = useState(false) // the wheel has settled at least once
  // each visit gets its own flow direction, so the backdrop never repeats the same pattern
  const [waveDir] = useState(() => Math.round(Math.random() * 360))
  // phone-width layout: stacked deck instead of the wheel
  // portrait tablets (iPad) get the same stacked layout as phones
  const NARROW_Q = '(max-width: 700px), (max-width: 1100px) and (orientation: portrait)'
  const [narrow, setNarrow] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(NARROW_Q).matches)

  useEffect(() => {
    const mq = matchMedia(NARROW_Q)
    const onChange = () => setNarrow(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // arriving from a home card: glide the ring to that card once the intro has settled
  const focusOnEnter = useRef(active)
  useEffect(() => {
    const at = focusOnEnter.current
    if (at === 0) return
    const t = setTimeout(() => apiRef.current?.focusIndex(at), 1700)
    return () => clearTimeout(t)
  }, [])

  // the close-up and the blur appear once, after the assemble intro
  useEffect(() => {
    const t = setTimeout(() => setEver(true), 1600)
    return () => clearTimeout(t)
  }, [])

  const goTo = (i: number) => setActive(((i % TOTAL) + TOTAL) % TOTAL)
  const p = ALL[active]

  /* the close-up is ONE persistent element: switching swaps its picture and replays the
     slide-in, so nothing is ever mounted on top of a previous copy */
  const featureRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = featureRef.current
    if (!el) return
    let cancelled = false
    let animation: Animation | undefined
    el.style.opacity = '0'
    const img = el.querySelector('img')
    const ready = img?.decode().catch(() => {}) ?? Promise.resolve()
    ready.then(() => {
      if (cancelled) return
      el.style.opacity = '1'
      animation = el.animate([
        { opacity: 0, transform: 'translate3d(-50%, -50%, 0) translateX(16vw) scale(.5)' },
        { opacity: 1, transform: 'translate3d(-50%, -50%, 0) translateX(0) scale(1)' },
      ], { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 680, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' })
    })
    return () => { cancelled = true; animation?.cancel() }
  }, [active, ever])

  // internal targets go through the route veil (same transition as the nav links);
  // external pieces open in a new tab
  const openFeature = () => {
    if (!p.link) return
    if (p.link.startsWith('http')) window.open(p.link, '_blank', 'noopener')
    else window.dispatchEvent(new CustomEvent('veil-navigate', { detail: p.link }))
  }

  const viewLabel = t.viewWork
  const view = !p.link ? null : p.link.startsWith('http') ? (
    <a
      href={p.link}
      data-cursor
      className="ring-view ink"
      onClick={e => {
        // external CTA: same blue line transition, then the site opens in a new tab (App handles it)
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('veil-navigate', { detail: p.link }))
      }}
    >
      <span className="arrow-ne">↗</span> {viewLabel}
    </a>
  ) : (
    <Link to={p.link} data-cursor className="ring-view ink">
      <span className="arrow-ne">↗</span> {viewLabel}
    </Link>
  )

  return (
    <div className="page-allwork">
      <Nav back />
      {/* background for the whole section (under the blur, cards and text) */}
      <div className="allwork-bg" aria-hidden>
        {backgroundReady && <PatternWaves
          pattern="glyph"
          wave="silk"
          characters=".:-=+*#%@"
          color="#000000"
          accent="#2e2ee6"
          backgroundColor="transparent"
          spacing={14}
          markSize={0.9}
          speed={0.42}
          direction={waveDir}
          depth={1.1}
          opacity={0.42}
          fade="edges"
          fadeSize={0.6}
          interactive
          cursorSize={64}
          cursorStrength={0.35}
        />}
      </div>

      {narrow ? (
        // phones: the close-up is the active card of the deck, neighbours sit behind it
        <div className="deck-stage" data-cursor>
          <MobileDeck items={DECK} index={active} onPick={goTo} activeHref={p.link} />
        </div>
      ) : (
        <div className={`cc-wrap ${ever ? 'cc-blur' : ''}`} data-cursor>
          <CircularCarousel
            items={ITEMS}
            apiRef={apiRef}
            preset="wheel"
            intro="assemble"
            cardWidth={280}
            aspectRatio={1.5}
            gap={26}
            autoplay="off"
            snap
            oneStep
            draggable
            stretch={0.55}
            parallax={0.25}
            depthFade={0.5}
            fadeColor="#fbfbfb"
            cornerRadius={12}
            onChange={i => goTo(i)}
          />
        </div>
      )}

      {/* desktop close-up: keyed by item, so each switch is one slide-in */}
      {!narrow && ever && (
        <div
          ref={featureRef}
          className="cc-feature"
          data-cursor
          role={p.link ? 'link' : undefined}
          tabIndex={p.link ? 0 : -1}
          aria-label={name(p)}
          onClick={openFeature}
          onKeyDown={e => { if (e.key === 'Enter') openFeature() }}
          style={{ cursor: p.link ? 'pointer' : 'default' }}
        >
          <img key={active} src={p.thumb} alt={name(p)} decoding="async" draggable={false} />
        </div>
      )}

      {/* the only caption left: one CTA for the active item */}
      {/* info card on both layouts: category, title, view; re-keyed so each switch fades in */}
      <div className={`ring-info ${narrow ? 'ring-info-m' : ''}`} key={active}>
        <span className="ring-info-meta">{lang === 'zh' ? p.categoryZh : p.category}{p.year && ` · ${p.year}`}</span>
        <h2 className="ring-info-title"><a href={p.link ?? '#'} data-cursor className="ring-title-link" onClick={e => { e.preventDefault(); if (p.link) window.dispatchEvent(new CustomEvent('veil-navigate', { detail: p.link })) }}><span className="wn-roll"><span className="wn-line">{name(p)}</span><span className="wn-line wn-blue" aria-hidden="true">{name(p)}</span></span></a></h2>
        {view}
      </div>

      {/* index list — right, grouped by category; hover previews, click snaps */}
      <aside className="ring-list">
        {PROJECTS.map((proj, i) => (
          <div key={proj.id} className="rl-group">
            {(i === 0 || PROJECTS[i - 1].group !== proj.group) && (
              <span className="rl-divider">{lang === 'zh' ? GROUP_LABEL[proj.group].zh : GROUP_LABEL[proj.group].en}</span>
            )}
            <button
              data-cursor
              className={`ring-list-item ${i === active ? 'item-active' : ''}`}
              onMouseEnter={() => apiRef.current?.focusIndex(i)}
              onClick={() => apiRef.current?.focusIndex(i)}
            >
              <span className="rl-num">{proj.index}</span>
              <span className="rl-title">{name(proj)}</span>
            </button>
          </div>
        ))}
      </aside>

      <div className="ring-pager">
        <button data-cursor aria-label="Previous" onClick={() => (narrow ? goTo(active - 1) : apiRef.current?.stepBy(-1))}>
          <svg viewBox="0 0 24 24" aria-hidden><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <span className="ring-count" aria-label={`${active + 1} / ${TOTAL}`}><b className="score-count" aria-hidden="true">{String(active + 1).padStart(2, '0').split('').map((digit, place) => <span className="digit-window" key={place}><span className="digit-strip" style={{ transform: `translateY(-${Number(digit) * 10}%)` }}>{Array.from({ length: 10 }, (_, n) => <span key={n}>{n}</span>)}</span></span>)}</b><i>/</i><span>{String(TOTAL).padStart(2, '0')}</span></span>
        <button data-cursor aria-label="Next" onClick={() => (narrow ? goTo(active + 1) : apiRef.current?.stepBy(1))}>
          <svg viewBox="0 0 24 24" aria-hidden><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  )
}
