import { useI18n } from '../i18n'

/** A quiet, continuously moving scroll gesture, without decorative copy. */
export default function ScrollCue() {
  const { lang } = useI18n()
  return <svg className="scroll-cue" viewBox="0 0 28 48" role="img" aria-label={lang === 'zh' ? '向下滚动继续浏览' : 'Scroll down to continue'}>
    <rect x="6" y="2" width="16" height="27" rx="8" />
    <path className="scroll-cue-wheel" d="M14 8v5" />
    <path className="scroll-cue-arrow" d="m9 36 5 5 5-5" />
  </svg>
}
