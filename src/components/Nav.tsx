import { Link, useLocation } from 'react-router'
import { useI18n } from '../i18n'

/** Top chrome: back arrow on inner pages + nav links + language toggle. */
export default function Nav({ dark = false, back = false }: { dark?: boolean; back?: boolean }) {
  const { pathname } = useLocation()
  const { lang, t, toggle } = useI18n()
  return (
    <header className={`site-nav ${dark ? 'nav-dark' : 'nav-light'}`}>
      <div className="nav-left">
        {back && (
          <button
            className="nav-back"
            data-cursor
            onClick={() => dispatchEvent(new CustomEvent('veil-navigate', { detail: -1 }))}
            aria-label="Back"
          >
            ‹
          </button>
        )}
      </div>
      <nav className="nav-links">
        <Link
          to="/"
          data-cursor
          className={pathname === '/' ? 'nav-active' : ''}
          onClick={() => { if (pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' }) }}
        >{t.navHome}</Link>
        <Link to="/about" data-cursor className={pathname === '/about' ? 'nav-active' : ''}>{t.navAbout}</Link>
        <Link to="/all-work" data-cursor className={pathname === '/all-work' ? 'nav-active' : ''}>{t.navProject}</Link>
      </nav>
      {/* language toggle: its own glass pill, sitting beside the links pill */}
      <button
          className="nav-lang"
          data-cursor
          onClick={toggle}
          aria-label={lang === 'en' ? '切换到中文' : 'Switch to English'}
        >
          <span className={lang === 'en' ? 'lang-on' : ''}>EN</span>
          <span className="lang-sep">/</span>
          <span className={lang === 'zh' ? 'lang-on' : ''}>中</span>
      </button>
    </header>
  )
}
