import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'

const CLOSING_LINES = ['Thanks for watching', 'For the future yet to come', 'Ad Astra', 'Stay tuned', '无远弗届', '行远自迩']

function ClosingTypewriter() {
  const ref = useRef<HTMLParagraphElement>(null)
  const [text, setText] = useState(CLOSING_LINES[0])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let timer = 0
    let active = false
    let line = 0
    let count = CLOSING_LINES[0].length
    let phase: 'hold' | 'delete' | 'type' = 'hold'
    const schedule = (ms: number) => { timer = window.setTimeout(tick, ms) }
    const tick = () => {
      if (!active || reduced.matches || document.hidden) return
      if (phase === 'hold') phase = 'delete'
      if (phase === 'delete') {
        count = Math.max(0, count - 1)
        setText(CLOSING_LINES[line].slice(0, count))
        if (count === 0) {
          line = (line + 1) % CLOSING_LINES.length
          phase = 'type'
          schedule(100)
        } else schedule(450 / CLOSING_LINES[line].length)
      } else {
        count += 1
        setText(CLOSING_LINES[line].slice(0, count))
        if (count === CLOSING_LINES[line].length) { phase = 'hold'; schedule(2000) }
        else schedule(450 / CLOSING_LINES[line].length)
      }
    }
    const resume = () => {
      clearTimeout(timer)
      if (active && !document.hidden && !reduced.matches) schedule(phase === 'hold' ? 2000 : 50)
    }
    const io = new IntersectionObserver(([entry]) => { active = entry.isIntersecting; resume() }, { threshold: 0.5 })
    io.observe(el)
    document.addEventListener('visibilitychange', resume)
    reduced.addEventListener('change', resume)
    return () => { clearTimeout(timer); io.disconnect(); document.removeEventListener('visibilitychange', resume); reduced.removeEventListener('change', resume) }
  }, [])
  return <p className="footer-reach" ref={ref} aria-label={CLOSING_LINES.join(' · ')}>
    <span className="closing-type fly" aria-hidden="true"><span className="cli-gt">&gt;</span><span className={/^[\x00-\x7F]*$/.test(text) ? 'closing-latin' : undefined}>{text}</span><span className="cli-cur">_</span></span>
  </p>
}

export default function Footer({ dark = true }: { dark?: boolean }) {
  const { t, lang } = useI18n()
  const ref = useRef<HTMLElement>(null)
  const giantRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  /* the giant wordmark always fits the viewport width, on any device */
  useEffect(() => {
    const el = giantRef.current
    if (!el) return
    const word = el.querySelector('.fg-word') as HTMLElement | null
    if (!word) return
    const fit = () => {
      // measure at a fixed reference size, then solve for the exact fit
      word.style.fontSize = '100px'
      const ratio = word.scrollWidth / 100 // px of width per px of font-size
      const avail = el.clientWidth * 0.985
      const s = Math.max(56, Math.min(340, avail / (ratio + 0.26)))
      word.style.fontSize = `${s}px`
    }
    fit()
    document.fonts?.ready.then(fit).catch(() => {})
    addEventListener('resize', fit)
    return () => removeEventListener('resize', fit)
  }, [])

  /* Reveal each section when it arrives, rather than firing the whole footer early. */
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('footer-revealed')
        if (entry.target.classList.contains('footer-grid')) setInView(true)
        io.unobserve(entry.target)
      }
    }, { threshold: 0.12 })
    el.querySelectorAll('.footer-grid, .footer-reach, .footer-thanks, .footer-giant').forEach(node => io.observe(node))
    return () => io.disconnect()
  }, [])

  const RECOGNITION = [
    { name: t.award1n, award: t.award1a },
    { name: t.award2n, award: t.award2a },
    { name: t.award3n, award: t.award3a },
    { name: t.award5n, award: t.award5a },
  ]

  /* running stagger — every line floats in left-to-right, like the statements */
  let d = 0
  const delay = (colBase: number) => `${Math.min(colBase + d++ * 60, 1500)}ms`

  return (
    <footer ref={ref} className={`site-footer ${dark ? 'footer-dark' : 'footer-light'} ${inView ? 'footer-in' : ''}`}>
      <div className="footer-grid">
        <div className="footer-col">
          <h4 className="footer-heading ft-line" style={{ transitionDelay: delay(0) }}><span className="footer-dot" />{t.footerConnect}</h4>
          <p className="footer-who-name ft-line" style={{ transitionDelay: delay(0) }}>陈祺 · Chen Qi</p>
          <ul className="footer-links">
            <li className="ft-line" style={{ transitionDelay: delay(0) }}>
              <a href="mailto:2013860780@qq.com" data-cursor>{t.linkEmail} · 2013860780@qq.com</a>
            </li>
            <li className="ft-line" style={{ transitionDelay: delay(0) }}>
              <a href="#" data-cursor onClick={e => e.preventDefault()}>QQ · 2013860780</a>
            </li>
            <li className="ft-line" style={{ transitionDelay: delay(0) }}>
              <a href="#" data-cursor onClick={e => e.preventDefault()}>WeChat · 19521119376</a>
            </li>
          </ul>
        </div>
        <div className="footer-col">
          <h4 className="footer-heading ft-line" style={{ transitionDelay: delay(180) }}><span className="footer-dot" />{t.footerBackground}</h4>
          <p className="footer-gap footer-strong ft-line" style={{ transitionDelay: delay(180) }}>{t.footerEdu}</p>
          <p className="footer-dim ft-line" style={{ transitionDelay: delay(180) }}>{t.footerEduSub}</p>
          <p className="footer-dim ft-line" style={{ transitionDelay: delay(180) }}>{t.footerCert1}</p>
          <p className="footer-dim ft-line" style={{ transitionDelay: delay(180) }}>{t.footerCert2}</p>
        </div>
        <div className="footer-col">
          <h4 className="footer-heading ft-line" style={{ transitionDelay: delay(360) }}><span className="footer-dot" />{t.footerRecognition}</h4>
          {RECOGNITION.map(r => (
            <div key={r.name} className="footer-award ft-line" style={{ transitionDelay: delay(360) }}>
              <p className="footer-strong">{r.name}</p>
              <p className="footer-dim">{r.award}</p>
            </div>
          ))}
        </div>
      </div>

      {/* tagline — centred, under the three columns, above the thanks row */}
      <ClosingTypewriter />

      {/* thanks — one quiet row of white lockups, one shared height */}
      <div className="footer-thanks">
        <span className="ft-thanks-label">
          {[...t.footerThanks].map((ch, i) => (
            <span key={i} className="fly" style={{ transitionDelay: `${380 + i * 70}ms` }}>{ch}</span>
          ))}
        </span>
        <div className="ft-badges">
          <span className="ft-badge fly" data-cursor style={{ transitionDelay: '560ms' }}>
            <img className="ft-logo" src="/assets/thanks/kimi.webp" alt="Kimi" />
            <span className="ft-wordmark-sub">Code</span>
          </span>
          <span className="ft-badge fly" data-cursor style={{ transitionDelay: '640ms' }}>
            <img className="ft-logo" src="/assets/thanks/cursor.webp" alt="Cursor" />
          </span>
          <span className="ft-badge fly" data-cursor style={{ transitionDelay: '720ms' }}>
            <img className="ft-logo" src="/assets/thanks/chatgpt.webp" alt="ChatGPT" />
          </span>
          <span className="ft-badge fly" data-cursor style={{ transitionDelay: '800ms' }}>
            <img className="ft-logo" src="/assets/thanks/qwen.webp" alt="Qwen" />
          </span>
          <span className="ft-badge fly" data-cursor style={{ transitionDelay: '880ms' }}>
            <img className="ft-logo" src="/assets/thanks/grok.webp" alt="Grok" />
          </span>
          <span className="ft-badge fly" data-cursor style={{ transitionDelay: '960ms' }}>
            <img className="ft-logo" src="/assets/thanks/github.webp" alt="GitHub" />
          </span>
          <span className="ft-badge fly" data-cursor style={{ transitionDelay: '1040ms' }}>
            <img className="ft-logo" src="/assets/thanks/tencentcloud.webp" alt={lang === 'zh' ? '腾讯云' : 'Tencent Cloud'} />
          </span>
          <span className="ft-badge fly" data-cursor style={{ transitionDelay: '1120ms' }}>
            <img className="ft-logo" src="/assets/thanks/reactbits.webp" alt="React Bits" />
          </span>
          <span className="ft-badge fly" data-cursor style={{ transitionDelay: '1200ms' }}>
            <img className="ft-logo" src="/assets/thanks/aceternity.webp" alt="Aceternity UI" />
          </span>
        </div>
      </div>

      {/* oversized sign-off wordmark, clipped by the footer edge */}
      <div className="footer-giant" ref={giantRef} aria-hidden>
        <span className="fg-word">{[...t.giantWord].map((ch, i) => (
                <span key={i} className="fg-ch" style={{ transitionDelay: `${350 + i * 110}ms` }}>{ch}</span>
              ))}<span className="fg-sq-up" aria-hidden style={{ transitionDelay: `${350 + t.giantWord.length * 110 + 120}ms` }} /></span>
      </div>
    </footer>
  )
}
