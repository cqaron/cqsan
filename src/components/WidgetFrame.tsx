import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'

interface Props {
  src: string
  title: string
  /** fallback height before the widget reports its own */
  height?: number
  /** optional view tabs, posted to the widget as retailrocket-view messages */
  tabs?: { label: string; mode: string }[]
}

/**
 * Embeds one of the legacy animated case widgets (self-contained HTML).
 * The widgets wake up on a `replay-visible` postMessage and speak the
 * site's language via `portfolio-language`; some report their height back
 * with `portfolio-embed-height`.
 */
export default function WidgetFrame({ src, title, height = 620, tabs }: Props) {
  const { lang } = useI18n()
  const ref = useRef<HTMLIFrameElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [h, setH] = useState(height)
  const [mode] = useState(tabs?.[0]?.mode ?? '')
  const kind = src.includes('retailrocket') ? 'dashboard'
    : src.includes('ai-cs-replay') ? 'agent'
    : src.includes('tg-prototype') ? 'prototype'
    : src.includes('skills-replay') ? 'chat' : 'workflow'
  const langRef = useRef(lang)
  const modeRef = useRef(mode)
  langRef.current = lang
  modeRef.current = mode

  useEffect(() => {
    const frame = ref.current
    if (!frame || kind === 'dashboard' || kind === 'agent') return
    const resize = () => {
      const width = frame.getBoundingClientRect().width
      setH(kind === 'chat' ? 540 : Math.round(Math.max(440, Math.min(620, width * 0.72))))
    }
    const observer = new ResizeObserver(resize)
    observer.observe(frame)
    resize()
    return () => observer.disconnect()
  }, [kind])

  /* lazy src + visibility wake-up */
  useEffect(() => {
    const frame = ref.current
    if (!frame) return
    const post = (active: boolean) => {
      frame.contentWindow?.postMessage({ type: 'replay-visible', active }, location.origin)
    }
    const preload = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting && frame.getAttribute('src') !== src) frame.src = src
      }
    }, { threshold: 0.05, rootMargin: '600px 0px' })
    const io = new IntersectionObserver(entries => {
      for (const e of entries) post(e.isIntersecting)
    }, { threshold: 0.05 })
    preload.observe(frame)
    io.observe(frame)
    const onLoad = () => {
      frame.contentWindow?.postMessage({ type: 'portfolio-language', lang: langRef.current }, location.origin)
      if (modeRef.current) frame.contentWindow?.postMessage({ type: 'retailrocket-view', mode: modeRef.current }, location.origin)
      const r = frame.getBoundingClientRect()
      post(r.bottom > 0 && r.top < innerHeight)
    }
    frame.addEventListener('load', onLoad)
    return () => {
      io.disconnect()
      preload.disconnect()
      frame.removeEventListener('load', onLoad)
    }
  }, [src])

  /* language switch + auto height from the widget */
  useEffect(() => {
    ref.current?.contentWindow?.postMessage({ type: 'portfolio-language', lang }, location.origin)
  }, [lang, loaded])
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== ref.current?.contentWindow) return
      if (e.data?.type === 'portfolio-embed-height' && Number.isFinite(e.data.height)) {
        setH(Math.max(240, Math.min(1600, e.data.height)))
      }
    }
    addEventListener('message', onMsg)
    return () => removeEventListener('message', onMsg)
  }, [])

  return (
    <figure className={`project-figure project-widget widget-${kind}`}>
      <iframe
        ref={ref}
        title={title}
        className="widget-frame"
        style={{ height: h }}
        loading="lazy"
        onLoad={() => setLoaded(true)}
      />
      <figcaption>{title}</figcaption>
    </figure>
  )
}
