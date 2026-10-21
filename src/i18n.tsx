import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export type Lang = 'en' | 'zh'

const DICT = {
  en: {
    navHome: 'Home',
    navAbout: 'About',
    navProject: 'Project',
    viewWork: 'View',
    heroHello: 'Hello,',
    heroName: "I'm Quincy",
    heroScroll: 'SCROLL TO EXPLORE',
    workTitleA: 'Portfolio',
    workTitleB: '',
    workLabel: 'Selected work',
    workAll: 'All work',
    aboutTitle: 'About me',
    aboutCta: 'View',
    descProduct: 'Product design, interaction flows and launch practice.',
    descData: 'Small tools, MCP integrations and browser workflows.',
    descAi: 'Agent architecture, 11 skills and n8n workflows.',
    descContent: 'Independently written articles in English, Spanish, Chinese and more — selected published work.',
    aboutS1: "Hi,\nI'm Chen Qi,\ncall me Quincy.",
    aboutS2: 'Thanks for watching',
    aboutS3: 'How I work: observe, break down, try, reflect.',
    aboutSkills: 'Skills',
    aboutExp: 'Experience',
    aboutEdu: 'Education',
    footerConnect: 'CONNECT',
    footerBackground: 'BACKGROUND',
    footerRecognition: 'AWARDS',
    footerNote1: 'In the UTC+8 time zone.',
    footerNote2: "If I don't reply immediately,",
    footerNote3: 'I apologize for the delay.',
    footerRole: 'Product Operations · Growth · AI-Native',
    footerCert1: 'CET-6 · 663 — ranked 1st university-wide',
    footerCert2: 'CET-4 · 624',
    footerTime: 'China',
    footerThanks: 'POWERED BY',
    linkEmail: 'Email',
    linkResume: 'Résumé',
    footerEdu: 'Hubei University',
    footerEduSub: 'Big Data Mgmt & Application · 2023–2027',
    award1n: 'NECCS',
    award1a: 'National Grand Prize · English',
    award2n: 'Chinese Collegiate Computing Competition',
    award2a: 'Provincial First Prize',
    award3n: 'CUMCM · Math Modeling',
    award3a: 'Provincial Second Prize',
    award5n: 'Hubei University',
    award5a: 'Scholarship · Merit Student',
    giantWord: 'Quincy',
  },
  zh: {
    navHome: '首页',
    navAbout: '关于',
    navProject: '作品',
    viewWork: '查看',
    heroHello: '你好，',
    heroName: '我是 Quincy',
    heroScroll: '滚动探索',
    workTitleA: '作品集',
    workTitleB: '',
    workLabel: '精选作品',
    workAll: '全部作品',
    aboutTitle: '关于我',
    aboutCta: '查看',
    descProduct: '产品设计、交互流程与上线实践。',
    descData: '小工具开发、MCP 接入与浏览器工作流。',
    descAi: 'Agent 架构、11 个 Skills 与 n8n 工作流。',
    descContent: '独立制作英、西、中等多语种文章，展示部分收录内容。',
    aboutS1: '你好，\n我是陈祺，\n可以叫我Quincy。',
    aboutS2: 'Thanks for watching',
    aboutS3: '我的方法：观察 → 拆解 → 尝试 → 复盘。',
    aboutSkills: '个人技能',
    aboutExp: '实习经历',
    aboutEdu: '教育经历',
    footerConnect: '联系',
    footerBackground: '背景',
    footerRecognition: '奖项',
    footerNote1: '我在 UTC+8 时区。',
    footerNote2: '若没有及时回复，',
    footerNote3: '先向你致歉。',
    footerRole: '产品运营 · 海外增长 · AI 实践',
    footerCert1: 'CET-6 · 663 分 · 全校本硕第一',
    footerCert2: 'CET-4 · 624 分',
    footerTime: '中国',
    footerThanks: '致谢',
    linkEmail: '邮箱',
    linkResume: '简历',
    footerEdu: '湖北大学',
    footerEduSub: '大数据管理与应用 · 2023–2027',
    award1n: '全国大学生英语竞赛',
    award1a: '国家特等奖',
    award2n: '中国大学生计算机设计大赛',
    award2a: '省级一等奖',
    award3n: '全国大学生数学建模竞赛',
    award3a: '省级二等奖',
    award5n: '湖北大学',
    award5a: '校级二等奖学金 · 三好学生',
    giantWord: 'Quincy',
  },
} as const

export type Copy = Record<keyof typeof DICT.en, string>

interface I18nValue {
  lang: Lang
  t: Copy
  toggle: () => void
}

const I18nContext = createContext<I18nValue>({
  lang: 'zh',
  t: DICT.zh,
  toggle: () => {},
})

export function I18nProvider({ children }: { children: ReactNode }) {
  // Chinese is the default; a visitor's explicit EN choice is remembered.
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('kailong-lang')
    return saved === 'en' ? 'en' : 'zh'
  })

  useEffect(() => {
    localStorage.setItem('kailong-lang', lang)
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
    // the site (browser tab) title follows the language
    document.title = lang === 'zh' ? '陈祺 · 作品集' : 'Chen Qi · Portfolio'
  }, [lang])

  const toggle = () => setLang(l => (l === 'en' ? 'zh' : 'en'))

  return (
    <I18nContext.Provider value={{ lang, t: DICT[lang] as Copy, toggle }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
