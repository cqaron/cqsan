import { useEffect, useRef, useState } from 'react'
import Nav from '../components/Nav'
import { useI18n } from '../i18n'

export default function AISuite() {
  const { lang } = useI18n()
  const ref = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(2400)
  const sync = () => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.contentWindow?.postMessage({ type: 'portfolio-language', lang }, location.origin)
    el.contentWindow?.postMessage({ type: 'portfolio-viewport', top: -r.top, bottom: innerHeight-r.top }, location.origin)
  }
  useEffect(() => { sync() }, [lang])
  useEffect(() => {
    let raf = 0
    const viewport = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const el = ref.current
        if (!el) return
        const r = el.getBoundingClientRect()
        el.contentWindow?.postMessage({type:'portfolio-viewport',top:-r.top,bottom:innerHeight-r.top},location.origin)
      })
    }
    const message = (e: MessageEvent) => {
      if (e.origin!==location.origin || e.source!==ref.current?.contentWindow) return
      if (e.data?.type==='portfolio-embed-height' && Number.isFinite(e.data.height)) {
        setHeight(Math.max(800,Math.min(25000,e.data.height)))
        viewport()
      }
    }
    addEventListener('message',message);addEventListener('scroll',viewport,{passive:true});addEventListener('resize',viewport)
    return () => {cancelAnimationFrame(raf);removeEventListener('message',message);removeEventListener('scroll',viewport);removeEventListener('resize',viewport)}
  }, [])
  return <div className="page-ai-suite"><Nav back /><iframe ref={ref} className="ai-suite-frame" src="/assets/widgets/ai-suite.html" title={lang==='zh'?'AI 架构、11 个 Skills 与 n8n 工作流':'AI architecture, 11 skills and n8n workflows'} style={{height}} onLoad={sync} /></div>
}
