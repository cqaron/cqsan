export interface Project {
  id: string
  index: string
  title: string
  titleZh: string
  group: 'product' | 'development' | 'ai' | 'content'
  category: string
  categoryZh: string
  year: string
  thumb: string
  /** smaller animated thumb for the wheel; falls back to thumb */
  thumbSm?: string
  /** internal case page or external URL — the View link is hidden when absent */
  link?: string
}

export const GROUP_LABEL: Record<Project['group'], { en: string; zh: string }> = {
  product: { en: 'Product', zh: '产品' },
  development: { en: 'Development', zh: '开发' },
  ai: { en: 'AI', zh: 'AI' },
  content: { en: 'Content', zh: '内容' },
}

export const PROJECTS: Project[] = [
  { id: 'agent-skills', index: '01', title: 'Agent Skills & Workflows', titleZh: 'Agent Skills 与工作流', group: 'ai', category: 'AI · Skills · n8n', categoryZh: 'AI · Skills · n8n', year: '2026', thumb: '/assets/ai-suite/agent-skills.webp?v=2', thumbSm: '/assets/ai-suite/agent-skills-sm.webp?v=2', link: '/work/agent-skills' },
  { id: 'link-download', index: '02', title: 'Link Download', titleZh: '需求上线-链接下载', group: 'product', category: 'Product', categoryZh: '产品', year: '2026', thumb: '/assets/card-link-anim.webp?v=4', thumbSm: '/assets/card-link-anim-sm.webp?v=4', link: '/work/link-download' },
  { id: 'tg-landing', index: '03', title: 'TG Landing Redesign', titleZh: '原型设计-落地页', group: 'product', category: 'Product', categoryZh: '产品', year: '2026', thumb: '/assets/card-landing-anim.webp', thumbSm: '/assets/card-landing-anim-sm.webp', link: 'https://tgvideodownloader.com/' },
  { id: 'boss-assistant', index: '04', title: 'BOSS Job Assistant MCP', titleZh: 'BOSS 直聘投递助手 MCP', group: 'development', category: 'Development · MCP', categoryZh: '开发 · MCP', year: '2026', thumb: '/assets/card-boss-anim.webp', thumbSm: '/assets/card-boss-anim-sm.webp', link: '/work/boss-assistant' },
  { id: 'art-wps', index: '05', title: 'English / WPS PDF Guide', titleZh: '英文 / WPS PDF指南', group: 'content', category: 'Content · EN', categoryZh: '内容 · 英文', year: '2026', thumb: '/assets/card-wps-anim.webp?v=4', thumbSm: '/assets/card-wps-anim-sm.webp?v=4', link: 'https://www.wps.com/blog/what-is-an-affidavit-prepare-and-sign-the-pdf-in-wps/' },
  { id: 'art-interface', index: '06', title: 'English / Small Interface Choices', titleZh: '英文 / 界面细节与体验', group: 'content', category: 'Content · EN', categoryZh: '内容 · 英文', year: '2025', thumb: '/assets/card-interface-anim.webp', thumbSm: '/assets/card-interface-anim-sm.webp', link: 'https://www.fontmirror.com/en/why-small-interface-choices-matter-in-telegram-media-workflows/' },
  { id: 'art-offline', index: '07', title: 'Spanish / Offline Access Matters', titleZh: '西语 / 离线访问的价值', group: 'content', category: 'Content · ES', categoryZh: '内容 · 西语', year: '2025', thumb: '/assets/card-offline-anim.webp', thumbSm: '/assets/card-offline-anim-sm.webp', link: 'https://tynmagazine.com/por-que-el-acceso-offline-sigue-importando-en-las-apps-de-mensajeria/' },
  { id: 'art-coze', index: '08', title: 'Chinese / Short-video Pipeline', titleZh: '中文 / Coze 短视频流水线', group: 'content', category: 'Content · ZH', categoryZh: '内容 · 中文', year: '2025', thumb: '/assets/card-coze-anim.webp', thumbSm: '/assets/card-coze-anim-sm.webp', link: 'https://mp.weixin.qq.com/s/l-Q0fXIh2362--ykXC3Zgw' },
  { id: 'art-policy', index: '09', title: 'Chinese / AI Policy Teardown', titleZh: '中文 / AI 政策拆解指南', group: 'content', category: 'Content · ZH', categoryZh: '内容 · 中文', year: '2025', thumb: '/assets/card-policy-anim.webp', thumbSm: '/assets/card-policy-anim-sm.webp', link: 'https://mp.weixin.qq.com/s/Gjdv-KhOEx_sgvnQb0gMDg' },
]

/** Home — the four category cards. */
export const SELECTED_WORK = [
  { index: '01', title: 'AI', titleZh: 'AI', thumb: '/assets/ai-suite/agent-skills.webp?v=2', thumbSm: '/assets/ai-suite/agent-skills-sm.webp?v=2', link: '/all-work?focus=agent-skills' },
  { index: '02', title: 'Product', titleZh: '产品', thumb: '/assets/card-product-category.webp', thumbSm: '/assets/card-product-category-sm.webp', link: '/all-work?focus=link-download' },
  { index: '03', title: 'Development', titleZh: '开发', thumb: '/assets/card-development-anim.webp', thumbSm: '/assets/card-development-anim-sm.webp', link: '/all-work?focus=boss-assistant' },
  { index: '04', title: 'Content', titleZh: '内容', thumb: '/assets/card-content-category.webp', thumbSm: '/assets/card-content-category-sm.webp', link: '/all-work?focus=art-wps' },
]
