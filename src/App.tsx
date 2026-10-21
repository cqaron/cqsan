import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router'
import Cursor from './components/Cursor'
import Home from './pages/Home'
import Preloader from './components/Preloader'
import { holdLoadingMotion } from './lib/loadingMotion'

const LinkDownload = lazy(() => import('./pages/LinkDownload'))
const BossAssistant = lazy(() => import('./pages/BossAssistant'))
const AISuite = lazy(() => import('./pages/AISuite'))
const ProjectPage = lazy(() => import('./pages/ProjectPage'))
const AllWork = lazy(() => import('./pages/AllWork'))
const About = lazy(() => import('./pages/About'))
/* Loading veil lines: each page change draws three lines from the left edge that
   converge toward a vanishing point. Start heights, bends and the convergence point
   are randomised every time, but the left part of every line stays out of the band
   where the "Loading..." label sits (y ≈ 400–580 in the 1000-unit viewBox), so the
   text is never covered. Two lines always sit on opposite sides for balance. */
const VEIL_TOP: [number, number] = [120, 360]
const VEIL_BOTTOM: [number, number] = [610, 880]
const rnd = (a: number, b: number) => a + Math.random() * (b - a)

/* Line motion is a fixed CSS loop; readiness only controls when the veil exits. */
const VEIL_IMG_TIMEOUT = 2600
const waitFonts = () => Promise.race([document.fonts.ready, new Promise<void>(resolve => window.setTimeout(resolve, 2600))])
const VEIL_HARD_CLOSE = 9000

function makeVeilPaths(): string[] {
  let ys: number[] = []
  let sides: ('top' | 'bottom')[] = []
  for (let attempt = 0; attempt < 30; attempt++) {
    sides = [0, 1, 2].map(() => (Math.random() < 0.5 ? 'top' : 'bottom'))
    if (!sides.includes('top') || !sides.includes('bottom')) continue
    ys = sides.map(s => rnd(...(s === 'top' ? VEIL_TOP : VEIL_BOTTOM)))
    const spread = ys.every((y, i) => ys.every((z, j) => i === j || Math.abs(y - z) > 80))
    if (spread) break
  }
  // one smooth cubic per line (no joints, so no visible corners): it leaves the left
  // edge in its zone, bends gently and eases into the right side near the centre line
  return ys.map((y0, i) => {
    const [a, b] = sides[i] === 'top' ? VEIL_TOP : VEIL_BOTTOM
    const clamp = (v: number) => Math.min(b, Math.max(a, v))
    const c1 = clamp(y0 + rnd(-60, 60))
    const c2 = rnd(260, 620)
    const y1 = 500 + rnd(-40, 40)
    const ex = 1040
    return `M-20 ${y0.toFixed(0)} C 300 ${c1.toFixed(0)} ${c2.toFixed(0)} ${(y1 + rnd(-60, 60)).toFixed(0)} ${ex} ${y1.toFixed(0)}`
  })
}

export default function App() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const initialRoute = useRef(pathname)
  const [entryLoading, setEntryLoading] = useState(() => ['/about', '/all-work'].includes(pathname))
  const [entryReady, setEntryReady] = useState(0)
  const [entryRevealed, setEntryRevealed] = useState(false)
  useEffect(() => {
    if (!['/about', '/all-work'].includes(initialRoute.current)) return
    let cancelled = false
    const chunk = initialRoute.current === '/about' ? import('./pages/About') : import('./pages/AllWork')
    Promise.all([chunk, waitFonts()]).then(() => { if (!cancelled) setEntryReady(1) }).catch(() => { if (!cancelled) setEntryReady(1) })
    return () => { cancelled = true }
  }, [])
  const [veil, setVeil] = useState(false)
  useEffect(() => { if (veil) return holdLoadingMotion() }, [veil])
  const [veilKind, setVeilKind] = useState<'default' | 'about'>('default')
  const [veilPaths, setVeilPaths] = useState<string[]>(makeVeilPaths)
  const transitioning = useRef(false)
  const pathRefs = useRef<(SVGPathElement | null)[]>([])
  const veilRaf = useRef(0)
  const veilGuard = useRef(0)
  // pending reset of the line state; cancelled when a new transition starts
  const resetKind = useRef(0)

  const stopVeil = () => {
    cancelAnimationFrame(veilRaf.current); veilRaf.current = 0
    window.clearTimeout(veilGuard.current)
  }

  const closeVeil = () => {
    stopVeil()
    setVeil(false)
    transitioning.current = false
    window.clearTimeout(resetKind.current)
    // once the veil has faded out, drop the drawn-line state so the next page change draws again
    resetKind.current = window.setTimeout(() => setVeilKind('default'), 1050)
  }

  // The draw loop must outlive the navigation effect: that effect is keyed on
  // `pathname`, so navigating re-runs its cleanup mid-transition. Stopping the
  // loop there would leave the veil covering the page forever.
  useEffect(() => stopVeil, [])

  // Keep readiness out of the line animation: slow resources simply get another
  // identical cycle, and exit retains the existing dissolve transitions.
  const runVeil = (isReady: () => boolean) => {
    stopVeil()
    veilGuard.current = window.setTimeout(closeVeil, VEIL_HARD_CLOSE)
    const start = performance.now()
    const check = (now: number) => {
      if (now - start >= 1600 && isReady()) { closeVeil(); return }
      veilRaf.current = requestAnimationFrame(check)
    }
    veilRaf.current = requestAnimationFrame(check)
  }

  /* Wait for the images that are on, or about to come onto, the screen. Lazy images
     further down are deliberately ignored — the veil only owes the first view.
     The setTimeout race keeps this resolving even where rAF is suspended (a
     backgrounded tab), otherwise a click made there would leave the veil stuck. */
  const waitForFirstPaint = () => new Promise<void>(resolve => {
    const t0 = performance.now()
    const timer = window.setTimeout(() => { settled = true; resolve() }, VEIL_IMG_TIMEOUT)
    let settled = false
    const poll = () => {
      if (settled) return
      const visible = [...document.querySelectorAll<HTMLImageElement>('img')].filter(i => {
        const r = i.getBoundingClientRect()
        return r.width > 0 && r.bottom > -200 && r.top < innerHeight * 1.2
      })
      if ((visible.every(i => i.complete) && !document.querySelector('[data-scene-pending]')) || performance.now() - t0 > VEIL_IMG_TIMEOUT) {
        settled = true
        window.clearTimeout(timer)
        resolve()
      } else requestAnimationFrame(poll)
    }
    requestAnimationFrame(poll)
  })

  /* Warm the destination chunk the moment a link shows hover/focus intent:
     the veil then waits on an already-loaded module instead of starting the
     request after the click. Repeat intents are free (module map cached). */
  useEffect(() => {
    const chunkFor = (href: string) =>
      href === '/about' ? import('./pages/About')
        : href.split('?')[0] === '/all-work' ? import('./pages/AllWork')
          : ['/work/agent-skills','/work/site-audit','/work/localization-skills','/work/agent-eval'].includes(href) ? import('./pages/AISuite')
          : href === '/work/link-download' ? import('./pages/LinkDownload')
          : href === '/work/boss-assistant' ? import('./pages/BossAssistant')
          : href.startsWith('/work/') ? import('./pages/ProjectPage')
            : null
    const onIntent = (e: Event) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href^="/"], a[href^="#/"]') as HTMLAnchorElement | null
      if (!a) return
      const raw = a.getAttribute('href')
      if (!raw) return
      const href = raw.startsWith('#') ? raw.slice(1) : raw
      if (href === pathname) return
      chunkFor(href)
    }
    document.addEventListener('pointerover', onIntent)
    document.addEventListener('focusin', onIntent)
    return () => {
      document.removeEventListener('pointerover', onIntent)
      document.removeEventListener('focusin', onIntent)
    }
  }, [pathname])

  // Veil wipes in, navigate, veil lifts — shared by link clicks and
  // programmatic moves (e.g. the back button) via the veil-navigate event.
  // Every page change but Home draws the three Klein-blue lines first.
  useEffect(() => {
    const go = async (href: string | number) => {
      if (transitioning.current) return
      transitioning.current = true
      window.clearTimeout(resetKind.current)
      // every page change uses the blue line, except Home: returning Home keeps its own 0–100 preloader
      const external = typeof href === 'string' && href.startsWith('http')
      const line = href !== '/'
      const ready = { chunk: true, fonts: false, page: !line }
      const mark = (k: 'chunk' | 'fonts' | 'page') => { ready[k] = true }

      setVeilKind(line ? 'about' : 'default')
      setVeilPaths(makeVeilPaths())
      pathRefs.current.forEach(path => { if (path) path.style.strokeDashoffset = '1' })
      setVeil(true)
      if (line) runVeil(() => ready.chunk && ready.fonts && ready.page)

      // the routes are lazy: wait for their chunk too, so the veil never lifts onto a blank page
      const isAllWork = typeof href === 'string' && href.split('?')[0] === '/all-work'
      const isProject = typeof href === 'string' && href.startsWith('/work/')
      const preload = href === '/about' ? import('./pages/About')
        : isAllWork ? import('./pages/AllWork')
        : typeof href === 'string' && ['/work/agent-skills','/work/site-audit','/work/localization-skills','/work/agent-eval'].includes(href) ? import('./pages/AISuite')
        : href === '/work/link-download' ? import('./pages/LinkDownload')
          : href === '/work/boss-assistant' ? import('./pages/BossAssistant')
        : isProject ? import('./pages/ProjectPage')
        : null
      ready.chunk = !preload
      // Do not swap the underlying route during the veil's entrance crossfade.
      // Two frames commit the visible state, then the opacity transition covers it.
      const covered = new Promise<void>(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(() => window.setTimeout(resolve, 700)))
      })
      await Promise.all([
        covered,
        preload ? preload.then(() => mark('chunk')).catch(() => mark('chunk')) : Promise.resolve(),
        waitFonts().then(() => mark('fonts')).catch(() => mark('fonts')),
      ])

      if (external) {
        // outside sites open in a new tab once the transition has played
        window.open(href as string, '_blank', 'noopener')
        mark('page')
        return
      }
      navigate(href as string)
      scrollTo(0, 0)
      if (!line) { closeVeil(); return }
      // Allow the destination route to commit before inspecting its images.
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
      await waitForFirstPaint()
      mark('page')
    }
    // Runs in the CAPTURE phase, before React Router's <Link> handler. Link calls
    // preventDefault() itself, so a bubble-phase listener never saw those clicks at all.
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey) return
      // BrowserRouter links look like "/about"; HashRouter links look like "#/about" — handle both
      const a = (e.target as HTMLElement).closest('a[href^="/"], a[href^="#/"]') as HTMLAnchorElement | null
      if (!a) return
      const raw = a.getAttribute('href')!
      const href = raw.startsWith('#') ? raw.slice(1) : raw
      e.preventDefault()
      if (href === pathname) return
      void go(href)
    }
    const onCustom = (e: Event) => { void go((e as CustomEvent<string | number>).detail) }
    document.addEventListener('click', onClick, true)
    addEventListener('veil-navigate', onCustom)
    return () => {
      document.removeEventListener('click', onClick, true)
      removeEventListener('veil-navigate', onCustom)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, pathname])

  return (
    <>
      <Cursor />
      {entryLoading && <Preloader progress={entryReady} onReveal={() => setEntryRevealed(true)} onGone={() => setEntryLoading(false)} />}
      <div className={`route-veil ${veil ? 'veil-on' : ''} ${veilKind === 'about' ? 'veil-about' : ''}`} aria-hidden>
        {/* Geometry stays still: a short blue signal travels along each curve. */}
        <svg className="route-veil-line" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden>
          {veilPaths.map((d, i) => <g key={`${i}-${d}`}>
            <path className="veil-track" pathLength="1" d={d} />
            <path className="veil-signal" ref={el => { pathRefs.current[i] = el }} pathLength="1" d={d} style={{ animationDelay: `${-i * .95}s` }} />
          </g>)}
        </svg>
        <span className="route-veil-label"><span className="loading-prompt">&gt;</span><span className="loading-word">Loading...</span><span className="loading-cursor">_</span></span>
      </div>
      {(!entryLoading || entryRevealed) && <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          {['agent-skills','site-audit','localization-skills','agent-eval'].map(id => <Route key={id} path={`/work/${id}`} element={<AISuite />} />)}
          <Route path="/work/link-download" element={<LinkDownload />} />
          <Route path="/work/boss-assistant" element={<BossAssistant />} />
          <Route path="/work/:id" element={<ProjectPage />} />
          <Route path="/all-work" element={<AllWork />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>}
    </>
  )
}
