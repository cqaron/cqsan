/* About page content — sourced from the latest résumé (陈祺_运营_B1).
   Keep bullet text faithful to the résumé; only formatting is adapted.
   Both languages are maintained side by side. */

export interface AboutSkill {
  title: string
  titleZh: string
  text: string
  textZh: string
}

export interface AboutExpItem {
  label: string
  labelZh: string
  text: string
  textZh: string
}

export interface AboutExp {
  id: string
  company: string
  companyZh: string
  dept: string
  deptZh: string
  role: string
  roleZh: string
  period: string
  periodZh: string
  items: AboutExpItem[]
}

export interface AboutEdu {
  school: string
  schoolZh: string
  major: string
  majorZh: string
  period: string
  periodZh: string
  items: { text: string; textZh: string }[]
}

export const ABOUT_EDU: AboutEdu = {
  school: 'Hubei University',
  schoolZh: '湖北大学',
  major: 'Big Data Management & Application',
  majorZh: '大数据管理与应用',
  period: '2023.09 — 2027.06',
  periodZh: '2023.09 — 2027.06',
  items: [
    {
      text: 'Top 10% of the major · Second-class university scholarship · Merit Student · CPC probationary member.',
      textZh: '概况：专业排名前 10%、校级二等奖学金、三好学生、中共预备党员。',
    },
    {
      text: 'Certifications: CET-4 (624), CET-6 (663 — ranked 1st among all undergrad & postgrad students), NCRE Level 3 (Database Technology).',
      textZh: '证书：CET-4（624 分）、CET-6（663 分，全校本硕排名第 1）、计算机三级（数据库技术）。',
    },
  ],
}

export const ABOUT_SKILLS: AboutSkill[] = [
  {
    title: 'Overseas operations',
    titleZh: '海外运营',
    text: 'Strong spoken and written English — workable as a working language; localization experience and familiarity with overseas content platforms.',
    textZh: '英文口语好，读写能力佳，可作为工作语言；有本地化经验，熟悉海外平台内容生态。',
  },
  {
    title: 'AI application',
    titleZh: 'AI 应用',
    text: 'Familiar with agent tools such as Codex and WorkBuddy; able to write Skills or build simple workflows around real business needs.',
    textZh: '熟悉 Codex、WorkBuddy 等 Agent 工具，可结合业务，编写 Skills 或搭建简单的工作流。',
  },
  {
    title: 'Data analysis',
    titleZh: '数据分析',
    text: 'Proficient with Excel and Feishu multi-dimensional tables; familiar with SQL and Tableau for data wrangling and metric analysis.',
    textZh: '熟练使用 Excel、飞书多维表格，熟悉 SQL、Tableau 等工具，可进行数据整理、指标分析工作。',
  },
]

export const ABOUT_EXPERIENCE: AboutExp[] = [
  {
    id: 'kingsoft',
    company: 'Kingsoft Office',
    companyZh: '金山办公',
    dept: 'International Operations',
    deptZh: '国际运营部',
    role: 'International User Growth',
    roleZh: '国际用户增长',
    period: '2026.08 — Present',
    periodZh: '2026.08 至今',
    items: [
      {
        label: 'Growth operations',
        labelZh: '增长运营',
        text: 'Worked toward organic-search growth for the WPS overseas site: identified growth opportunities in existing content from keyword rankings, page traffic and competitor performance, shortlisted 15 high-potential pages and drove 10 blog/feature pages through content-structure, keyword and internal-link optimization. Organic clicks on target pages rose ~13% within 28 days of optimization.',
        textZh: '围绕 WPS 海外官网自然搜索增长目标，结合关键词排名、页面流量及竞品表现，识别存量内容的增长机会，筛选 15 个高潜力页面并制定优化方案；推动其中 10 个 Blog 与功能页完成内容结构、关键词布局及站内链接优化，持续跟踪上线效果，目标页面自然点击在优化后 28 天内提升约 13%。',
      },
      {
        label: 'Product optimization',
        labelZh: '产品优化',
        text: 'For slow-loading, low-converting high-traffic topic pages, located a component-rendering bottleneck from performance and business data; coordinated with engineering to adjust component loading, bringing 43 high-traffic topic pages through performance optimization and lifting new conversion by ~4%, then applied the scheme to similar pages.',
        textZh: '针对部分高流量专题页面加载缓慢、用户转化效率偏低的问题，结合页面性能与业务数据，定位组件渲染影响加载速度的问题；协同研发调整组件加载方式，推动 43 个高流量专题页面完成性能优化，专题页新增转化率提升约 4%，并将优化方案应用于同类页面。',
      },
      {
        label: 'AI workflow building',
        labelZh: 'AI 工作流建设',
        text: 'Helped design an AI Skills + MCP content-production workflow integrating search-demand analysis, illustration generation, asset matching and CMS publishing into a standardized pipeline — 6+ SEO articles independently produced per day; for repetitive steps in multilingual publishing, helped optimize batch translation and release, processing 340 multilingual content versions in ~30 minutes per batch.',
        textZh: '参与设计基于 AI Skills + MCP 的内容生产工作流，将搜索需求分析、图文生成、素材匹配与后台建文整合为标准化流程，实现日均独立产出 6+ 篇 SEO 文章；针对多语言内容发布中的重复操作，参与优化批量翻译与发布流程，实现单批次约 30 分钟完成 340 个多语言内容版本的处理与上线，提高内容交付效率。',
      },
    ],
  },
  {
    id: 'wapu',
    company: 'Wapu Technology',
    companyZh: '武汉瓦普科技',
    dept: 'Operations',
    deptZh: '运营部',
    role: 'Overseas Growth Operations',
    roleZh: '海外增长运营',
    period: '2026.05 — 2026.08',
    periodZh: '2026.05 — 2026.08',
    items: [
      {
        label: 'Product operations',
        labelZh: '产品运营',
        text: 'For high bounce rate and low CTR: evaluated 3 competing overseas web-plugin products, dissected features and acquisition paths, distilled user scenarios into a PRD and pushed 1 core feature live; produced low-fi prototypes with ChatGPT Image and re-arranged copy and UI across 8 pages — bounce rate on the same channel fell from ~41% to ~30%; reworded, resized and restyled the first-screen download CTA, lifting its CTR by a relative ~6%.',
        textZh: '参与出海 SaaS 产品成长期运营，进行需求调研和竞品分析。针对用户跳出率偏高、网站点击率（CTR）较低的问题，测评海外 3 个同类 Web 插件工具产品，拆解其功能和获客路径，提炼用户使用场景并输出 PRD，推动 1 项核心功能上线；借助 ChatGPT Image 输出低保真原型图，重新排布 8 个网页的卖点文案与 UI，降低用户理解成本；上线后同渠道的网页跳出率由约 41% 降至约 30%；通过修改首屏下载 CTA 按钮的文案、尺寸、样式，优化用户点击引导，将其点击率相对提升约 6%。',
      },
      {
        label: 'Content operations',
        labelZh: '内容运营',
        text: 'Tracked user discussion trends on Reddit, YouTube and other overseas communities, summarized the target audience\u2019s key needs and turned them into content topics; wrote How-to tutorials and illustrated posts on Substack and other overseas blog platforms with product links naturally embedded — content-channel clicks to the site rose 12%.',
        textZh: '跟踪 Reddit、YouTube 等海外社区的用户讨论趋势，归纳目标人群的主要需求，将其需求转化为内容选题；结合产品功能，在 Substack 等海外博客平台撰写 How-to 类教程与图文，并在文中自然附带产品链接，使得内容渠道带来的网站点击上涨 12%。',
      },
      {
        label: 'Channel operations',
        labelZh: '渠道运营',
        text: 'Owned promotion on overseas online platforms, driving launches on Product Hunt and other mainstream platforms, plus outreach and business development with blogs, media and KOLs; produced briefs and collaboration proposals per product positioning and platform traits, negotiated quotes and discount codes independently — closing 8 collaborations at as low as $30 each; referring domains grew from 130 to 212, up ~63%.',
        textZh: '负责产品在海外在线平台的推广，推进 Product Hunt 等主流平台的产品上线与发布；参与产品在博客、媒体与 KOL 等方面的外联与商务对接。根据产品定位和平台特点，输出对应 Brief 和合作方案，完成初次建联；独立沟通合作报价、优惠码，最低将单次合作成本谈至 $30，成功推进并完成 8 个合作；运营期间，外部引流来源网站数由 130 个增至 212 个，增长约 63%。',
      },
      {
        label: 'AI efficiency',
        labelZh: 'AI 提效',
        text: 'For repetitive manual checking of technical files across multilingual pages, built an n8n + LLM automation workflow chaining page inspection, issue classification, status tracking and DeepSeek-generated optimization suggestions — covering 60 pages in 10 languages, identifying 86 issues in 4 categories, enabling a simple weekly site-inspection mechanism.',
        textZh: '针对网站多语言页面中人工检查技术文件的重复操作，搭建 n8n + LLM 自动化工作流，串联起页面检查、问题分类、状态跟踪和 DeepSeek 生成的优化建议等节点。页面检查覆盖 10 个语种、60 个页面，识别出 4 类共 86 项问题，实现简单的每周网站检查机制。',
      },
    ],
  },
  {
    id: 'hubeidaily',
    company: 'Hubei Daily Media Group',
    companyZh: '湖北日报传媒集团',
    dept: 'Technology',
    deptZh: '技术部',
    role: 'AI Content Operations',
    roleZh: 'AI 内容运营',
    period: '2025.05 — 2025.08',
    periodZh: '2025.05 — 2025.08',
    items: [
      {
        label: 'Topic planning',
        labelZh: '选题策划',
        text: 'Watched peer AI-tutorial accounts and built a tracking list of 10+ accounts, dissecting topic directions, headline patterns and content structures; from competitive research and hands-on user needs, investigated 10+ topic directions, defining each issue\u2019s audience pain points and entry angles, completing topic selection and material preparation.',
        textZh: '关注同类 AI 教程账号，建立 10+ 账号的竞品跟踪清单，拆解选题方向、标题写法、内容结构，为内容输出提供参考；基于竞品调研、用户实操需求，调研 10+ 个选题方向，明确每期受众痛点与切入角度，完成选题与资料整理。',
      },
      {
        label: 'Content creation',
        labelZh: '内容创作',
        text: 'Built outlines and wrote full posts, personally testing each featured AI tool\u2019s workflow, debugging prompts and verifying step accuracy; prototyped a "prompt → text-to-image → editing" workflow demo with Coze and published the steps as a post; produced full asset sets — 10+ graphic and video assets across 4 published posts — and kept adjusting topics from read and comment feedback.',
        textZh: '负责推文大纲搭建与正文撰写，实测所介绍 AI 工具的操作流程、调试 Prompt 并核验步骤准确性；尝试使用 Coze 搭建“提示词-文生图-剪辑”简单工作流 demo，将使用步骤发布为推文；制作推文全套素材，产出 10+ 份图文与视频素材，共发布 4 篇推文；结合推文阅读、留言反馈，持续调整选题方向。',
      },
    ],
  },
]
