import { Link, useParams } from 'react-router'
import Nav from '../components/Nav'
import WidgetFrame from '../components/WidgetFrame'
import { useI18n } from '../i18n'

interface CaseCopy {
  title: string
  sub: string
  meta: string
  year: string
  paras: string[]
  facts: [string, string][]
}

interface CaseDef {
  copy: { en: CaseCopy; zh: CaseCopy }
  media: { src: string; capEn: string; capZh: string }[]
  widget?: { src: string; titleEn: string; titleZh: string; height?: number; tabs?: { label: string; labelZh: string; mode: string }[] }
  links?: { labelEn: string; labelZh: string; href: string; download?: boolean }[]
  next: string
  nextEn: string
  nextZh: string
}

const CASES: Record<string, CaseDef> = {
  'link-download': {
    copy: {
      en: {
        title: 'Link Download', sub: 'Shipping a link-to-video download flow — from PRD to a live page.',
        meta: 'Product operations · PRD · Launch', year: '2026',
        paras: [
          'The homepage already offered link input and media parsing. I added the Link Download flow so that preview, download preparation and result feedback all complete on the same page — fewer jumps, no repeated input.',
          'The main flow: paste a link, parse and validate, confirm the media preview, prepare the download, finish and continue. After parsing, the page shows the title, thumbnail, format, quality and size; confirming starts a 10-second preparation stage, while the extension and desktop app carry heavier download needs.',
          'Web quota is organised as 10 downloads per 24 hours and 50 MB per file. Parsing and failures never consume quota, and retrying the same task is idempotent. Along the flow we track parse requests, parse success, preview views, download clicks and retries — watching parse success rate, preview-to-download conversion and preparation time.',
        ],
        facts: [['My role', 'Research, PRD & launch follow-up'], ['Year', '2026'], ['Context', 'TG DownloadHelper product site'], ['Tools', 'PRD · Figma · Event tracking']],
      },
      zh: {
        title: '需求上线-链接下载', sub: '推动「链接下载视频」功能上线——从需求、PRD 到真实页面。',
        meta: '产品运营 · PRD · 上线', year: '2026',
        paras: [
          '原首页已有链接输入与媒体解析入口。我新增 Link Download 流程，在同一页面完成预览、准备下载和结果反馈，减少页面跳转与重复输入。',
          '主流程为粘贴链接、解析校验、确认预览、准备下载、完成并继续。解析后展示标题、缩略图、格式、清晰度与大小；确认后进入 10 秒准备阶段，扩展与客户端承接更多下载需求。',
          '网页下载额度按每 24 小时 10 次、单文件 50 MB 组织；解析与失败不扣次，同一任务重试不重复扣次。沿流程埋点解析请求、解析成功、预览、下载点击与异常重试，关注解析成功率、预览到下载的转化与准备耗时。',
        ],
        facts: [['我的角色', '需求调研 · PRD · 上线跟进'], ['年份', '2026'], ['背景', 'TG DownloadHelper 产品站'], ['工具', 'PRD · Figma · 数据埋点']],
      },
    },
    media: [
      { src: '/assets/p01-link.jpg', capEn: 'Link Download · live page', capZh: 'Link Download · 已上线页面' },
      { src: '/assets/proj-link-boards.jpg', capEn: 'Onboarding & entry boards', capZh: '引导与入口设计稿' },
      { src: '/assets/proj-link-flow.jpg', capEn: 'Download flow · success state', capZh: '下载流程 · 完成状态' },
    ],
    widget: { src: '/assets/widgets/tg-prototype-showcase.html', titleEn: 'Design prototype · interactive replay', titleZh: '设计原型 · 交互回放', height: 640 },
    links: [
      { labelEn: 'Live page', labelZh: '查看上线页面', href: 'https://tgvideodownloader.com/' },
      { labelEn: 'Full PRD · DOCX', labelZh: '完整 PRD · DOCX', href: '/assets/tg-web-download-prd.docx', download: true },
    ],
    next: 'boss-assistant', nextEn: 'BOSS Job Assistant MCP', nextZh: 'BOSS 直聘投递助手 MCP',
  },

  retailrocket: {
    copy: {
      en: {
        title: 'RetailRocket Growth', sub: '2.7M behaviour events, one question: where do users drop off?',
        meta: 'Data analysis · Funnel · Recall strategy', year: '2026',
        paras: [
          'An e-commerce site has plenty of browsing; operations need to know where users are lost, who to serve first, and when to remind after add-to-cart. Using the public RetailRocket dataset — 2,756,101 events from 1,407,580 users — I chained views, carts and purchases into user paths with DuckDB SQL and Tableau.',
          'The funnel first: of 1,404,179 browsing users, 32,934 later added to cart and 9,952 purchased — view→cart converts at just 2.35%, while cart→purchase reaches 30.22%. The biggest loss happens before purchase intent forms, so discovery and decision information come first.',
          'Segmentation answers "who first": users with ≥3 views, ≥2 items and ≥2 active days (any two) convert to cart later at 3.58× the shallow group. For recall, comparing 1h / 6h / 24h waits after the first cart shows natural purchase decaying from 3.01% to 0.41% — so remind at 1h, inform at 6h, check at 24h.',
        ],
        facts: [['My role', 'Analysis design · SQL · Visualisation'], ['Year', '2026'], ['Context', 'RetailRocket public dataset'], ['Tools', 'DuckDB SQL · Tableau']],
      },
      zh: {
        title: 'RetailRocket 用户增长分析', sub: '用 275 万条行为数据回答：用户在哪一步流失？',
        meta: '数据分析 · 漏斗 · 召回策略', year: '2026',
        paras: [
          '电商网站有大量浏览，运营需要判断：用户在哪一步流失？哪些人值得优先承接？加购后何时提醒？我选用 RetailRocket 公开行为数据——2,756,101 条事件、1,407,580 名用户——用 DuckDB SQL 串起浏览、加购与购买路径，再用 Tableau 展示。',
          '先看漏斗：1,404,179 名浏览用户中，32,934 人随后加购，9,952 人再购买。浏览到加购仅 2.35%，而加购到购买为 30.22%——最大的流失发生在购买意向形成之前，因此先从商品发现和决策信息寻找改善机会。',
          '分层回答「先服务谁」：浏览 ≥3 次、看过 ≥2 件商品、活跃 ≥2 天满足两项即为深度浏览，其后续加购率约为浅层组的 3.58 倍。召回上，比较加购后等待 1h / 6h / 24h 的人群，自然购买率从 3.01% 降到 0.41%——据此 1h 首轮提醒、6h 补充信息、24h 检查是否继续。',
        ],
        facts: [['我的角色', '分析设计 · SQL · 可视化'], ['年份', '2026'], ['背景', 'RetailRocket 公开数据集'], ['工具', 'DuckDB SQL · Tableau']],
      },
    },
    media: [
      { src: '/assets/p02-retail.jpg', capEn: 'User growth dashboard', capZh: '用户增长看板' },
    ],
    widget: {
      src: '/assets/widgets/retailrocket-dashboard.html', titleEn: 'Interactive dashboard', titleZh: '交互看板', height: 560,
      tabs: [
        { label: 'Funnel', labelZh: '转化情况', mode: 'funnel' },
        { label: 'Segments', labelZh: '用户分布', mode: 'segments' },
        { label: 'Timing', labelZh: '提醒时机', mode: 'timing' },
      ],
    },
    next: 'site-audit', nextEn: 'Site audit workflow', nextZh: '多语言站点巡检工作流',
  },

  'site-audit': {
    copy: {
      en: {
        title: 'Site Audit Workflow', sub: 'Automated multilingual site audits with n8n and DeepSeek.',
        meta: 'AI workflow · n8n · Technical SEO', year: '2026',
        paras: [
          'Manually checking technical files across a multilingual site is repetitive. I built a scheduled n8n workflow that collects pages and site configuration in batches, checks page structure, language versions and search-related settings, and records how findings change between runs.',
          'An LLM step (DeepSeek API) then summarises new, persisting and resolved issues and generates priorities and suggestions. The latest run covered 10 languages and 80 pages, logging 90 issues — 40 new, 50 persisting, 36 resolved — giving the site a simple weekly inspection routine.',
        ],
        facts: [['My role', 'Workflow design & maintenance'], ['Year', '2026'], ['Context', 'TG DownloadHelper multilingual site'], ['Tools', 'n8n · DeepSeek API']],
      },
      zh: {
        title: '多语言站点巡检工作流', sub: '用 n8n + DeepSeek 搭建多语言站点自动巡检。',
        meta: 'AI 工作流 · n8n · 技术 SEO', year: '2026',
        paras: [
          '多语言网站中人工检查技术文件是重复操作。我搭建了一套定时运行的 n8n 自动化工作流：批量采集页面与站点配置，检查页面结构、语言版本和搜索相关配置，并记录每轮检测结果的变化。',
          '随后由 LLM（DeepSeek API）汇总新增、持续和已解决的问题，生成处理优先级与优化建议。最新一轮覆盖 10 个语种、80 个页面，记录 90 项问题——新增 40 项、持续 50 项、解决 36 项，形成简单的每周网站检查机制。',
        ],
        facts: [['我的角色', '工作流设计与维护'], ['年份', '2026'], ['背景', 'TG DownloadHelper 多语言站点'], ['工具', 'n8n · DeepSeek API']],
      },
    },
    media: [
      { src: '/assets/p03-n8n.jpg', capEn: 'The n8n workflow', capZh: 'n8n 工作流全貌' },
    ],
    widget: { src: '/assets/widgets/n8n-replay.html', titleEn: 'Audit run · replay', titleZh: '巡检过程 · 回放', height: 640 },
    next: 'localization-skills', nextEn: 'Localization skills', nextZh: '本地化翻译 Skills',
  },

  'localization-skills': {
    copy: {
      en: {
        title: 'Localization Skills', sub: 'One link in — six publish-ready languages out.',
        meta: 'AI application · Agent skills', year: '2026',
        paras: [
          'Producing multilingual versions of product pages market by market is one of the most experience-dependent and time-consuming parts of content operations. With these skills, a user provides a page link and the search terms it should rank for, and the agent generates complete, publish-ready page copy in the target language.',
          'The skills currently cover six languages — German, Spanish, Indonesian, Dutch, Brazilian Portuguese and Russian — and the output quality is good enough to go live directly.',
        ],
        facts: [['My role', 'Skill authoring & iteration'], ['Year', '2026'], ['Context', 'Overseas product pages'], ['Tools', 'Agent skills · Prompt design']],
      },
      zh: {
        title: '本地化翻译 Skills', sub: '一个链接进去，六个语种的可上线文案出来。',
        meta: 'AI 应用 · Agent Skills', year: '2026',
        paras: [
          '海外产品页按市场重复制作多语言版本，是内容运营中最依赖经验、也最耗时的环节之一。这套 Skills 让用户只需提供页面链接，并说明页面希望被哪些词搜到，Agent 就能生成对应语种的完整页面文案，质量可以直接发布上线。',
          '目前已覆盖德、西、印尼、荷、巴西葡、俄 6 个语种。',
        ],
        facts: [['我的角色', 'Skill 编写与迭代'], ['年份', '2026'], ['背景', '海外产品页面'], ['工具', 'Agent Skills · Prompt 设计']],
      },
    },
    media: [],
    widget: { src: '/assets/widgets/skills-replay.html', titleEn: 'Skill in action · replay', titleZh: 'Skill 运行 · 回放', height: 640 },
    next: 'agent-eval', nextEn: 'AI agent evaluation', nextZh: 'AI 客服 Agent 评测',
  },

  'agent-eval': {
    copy: {
      en: {
        title: 'AI Agent Evaluation', sub: 'Tuning a retail support agent from a 95.5% to a 100% task pass rate.',
        meta: 'Personal project · Offline evaluation', year: '2026',
        paras: [
          'Based on an English retail-support simulation, I checked whether an agent correctly handles order modifications and returns, then improved its rules from real bad cases. Across identical tasks, the pass rate rose from 95.5% to 100%; of the final 40 test tasks, 39 were confirmed complete after full-dialogue review.',
          'The changes: prompts that present a concrete plan and ask for confirmation before acting, and re-check every request before closing; tool calls separated from user-facing replies, one tool at a time; business validation before calls — refunds only to the original payment method or an existing gift card, same-item rules for exchanges.',
          'Scope afterwards: information queries are handled directly; order changes and returns go through user confirmation; anything beyond the rules is handed to a human.',
        ],
        facts: [['My role', 'Rules, case review & interpretation'], ['Year', '2026'], ['Context', 'Personal project · AI-assisted'], ['Tools', 'Offline eval · Prompt']],
      },
      zh: {
        title: 'AI 客服 Agent 评测优化', sub: '把零售客服 Agent 的任务通过率从 95.5% 调到 100%。',
        meta: '个人项目 · 离线评测', year: '2026',
        paras: [
          '我基于英文零售客服模拟环境，检查 Agent 能否正确办理订单修改与退换货，并根据实际运行中的 Bad Case 完善处理规则。相同任务的前后测试中，任务通过率由 95.5% 提升至 100%；最终 40 个测试任务经完整对话复核后完成 39 个。',
          '改动包括：Prompt 要求操作前展示具体方案并取得确认、结束前逐项核对；工具调用与用户回复分离，每次只执行一个工具；调用前做业务校验——退款只回原支付方式或已有礼品卡，换货遵守同款规则。',
          '之后的适用边界：信息查询直接处理；订单修改与退换货在用户确认后处理；超出规则或工具范围的请求转人工。',
        ],
        facts: [['我的角色', '规则、案例复核与解释'], ['年份', '2026'], ['背景', '个人项目 · AI 辅助实现'], ['工具', '离线评测 · Prompt']],
      },
    },
    media: [],
    widget: { src: '/assets/widgets/ai-cs-replay.html?v=6', titleEn: 'Order handling · replay', titleZh: '订单处理 · 回放', height: 640 },
    next: 'link-download', nextEn: 'Link Download', nextZh: '需求上线-链接下载',
  },
}

export default function ProjectPage() {
  const { id = 'link-download' } = useParams()
  const { lang } = useI18n()
  const def = CASES[id] ?? CASES['link-download']
  const c = lang === 'zh' ? def.copy.zh : def.copy.en

  return (
    <div className="page-project">
      <Nav back />

      <div className="project-head">
        <h1 className="project-title">{c.title}</h1>
        <p className="project-sub">{c.sub}</p>
        <p className="project-meta-line">{c.meta}<span className="meta-year">{c.year}</span></p>
      </div>

      <div className="project-demo">
          {def.widget && (
            <WidgetFrame
              key={def.widget.src}
              src={`${def.widget.src}?theme=glass-replay-20261018-v2`}
              title={lang === 'zh' ? def.widget.titleZh : def.widget.titleEn}
              height={def.widget.height}
              tabs={def.widget.tabs?.map(t => ({ label: lang === 'zh' ? t.labelZh : t.label, mode: t.mode }))}
            />
          )}
      </div>

      <div className={`project-body ${def.media.length ? '' : 'project-copy-only'}`}>
        <div className="project-media">
          {def.media.map((m, i) => (
            <figure className="project-figure" key={m.src}>
              <img src={m.src} alt={lang === 'zh' ? m.capZh : m.capEn} decoding="async" draggable={false} />
              <figcaption><span className="fig-num">{String(i + 1).padStart(2, '0')}</span>{lang === 'zh' ? m.capZh : m.capEn}</figcaption>
            </figure>
          ))}
        </div>

        <div className="project-text">
          {c.paras.map((p, i) => <p key={i}>{p}</p>)}

          <dl className="project-facts">
            {c.facts.map(([dt, dd]) => <div key={dt}><dt>{dt}</dt><dd>{dd}</dd></div>)}
          </dl>

          {def.links?.map(l => (
            <a
              key={l.href}
              className="project-pdf-link"
              data-cursor
              href={l.href}
              {...(l.download ? { download: true } : { target: '_blank', rel: 'noreferrer' })}
            >
              <span className="pdf-underline">{lang === 'zh' ? l.labelZh : l.labelEn}</span>
              <span className="arrow-ne">{l.download ? '↓' : '↗'}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="project-foot">
        <Link to="/all-work" data-cursor className="foot-link">{lang === 'zh' ? '全部作品' : 'All work'}</Link>
        <Link to={`/work/${def.next}`} data-cursor className="foot-next">
          <span className="foot-underline">{lang === 'zh' ? `下一个 —— ${def.nextZh}` : `Next — ${def.nextEn}`}</span>
        </Link>
      </div>
    </div>
  )
}
