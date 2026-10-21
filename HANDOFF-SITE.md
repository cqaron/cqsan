# 陈祺作品集站点：交接说明

本文件给后续接手的 agent 或协作者使用。读完本文件后，应能独立修改、构建并发布站点。

## 1. 位置与来源

- 本目录：`Q:\portfolio-react-site`，是 React 版站点的源码与构建产物副本。
- 原始工作目录：`C:\Users\CQ\Documents\kimi\tasks\2026-10-17\02-18-24-e68d563a\app`。两处目前内容一致，但之后各自修改不会互相同步。**以本目录为准**，请在这里继续工作；如果确需回到原目录，请先确认。
- 旧的静态站（HTML 版，Vite 之前）在 `Q:\handdrawn_portfolio_v5`，已经不是线上版本的源码。不要在那里改 React 页面。
- `Q:\handdrawn_portfolio_v5\AGENTS.md` 是项目长期规则，本文件第 2 节已经转述。

## 2. 必须遵守的规则

来自 `AGENTS.md` 和用户的明确要求：

1. **性能优先**：每次改动都要说明对加载的影响。保持纸张纹理、灵动的动效、浮动与拖拽交互；保留原始素材；优化发布资源；不在首屏之前加载无关内容；隐藏的动画要暂停。
2. **不夸大性能结论**：区分“测得的体积/请求变化”和“未测得的线上耗时”。不承诺任何网络环境下的绝对最快速度。
3. **中英双语**：页面文字修改时，必须同步更新 `src/i18n.tsx` 中对应的英文翻译。图片里的字母不改。两种语言都要验证，语言切换按钮的尺寸要保持稳定。
4. **回复语言**：与用户沟通使用简体中文。
5. **视觉**：只允许黑、白、灰与克莱因蓝（`--accent: #2e2ee6`），不要引入第二种彩色。液态玻璃效果要半透明、模糊，可透出底层颜色。**不要加边缘色散（chromatic aberration）**，用户已明确否定。
6. **不删除用户已有素材**，除非用户明确要求。

## 3. 技术栈与命令

- React 19 + TypeScript + Vite 7 + react-router 7 + Three.js（hero 地球粒子等）。
- 样式为单文件 `src/index.css`，按区块注释分段。
- 路由（HashRouter 形式访问，如 `/#/all-work`）：
  - `/`：首页（Home）
  - `/all-work`：作品集，3D 环形轮播
  - `/about`：关于页
  - `/work/:id` 或 ProjectPage：作品详情
- 常用命令（在本目录执行）：
  ```
  npm install        # 首次或 node_modules 缺失时
  npm run dev        # 开发服务器
  npx vite build     # 生成 dist（发布必须用这个产物）
  npx vite preview --port 4173   # 本地预览 dist
  ```
- **改完代码必须重新 build**，否则线上与源码不一致。
- 验证：build 无报错；中英文切换都检查；桌面与手机宽度都检查。

## 4. 目录结构

```
src/
  pages/        Home.tsx, AllWork.tsx, About.tsx, ProjectPage.tsx
  components/   Nav.tsx, Footer.tsx, ParticleGlobe.tsx, globeData.worker.ts,
                MacScene.tsx, Preloader（在 Home 内）, Cursor.tsx 等
                ui/   shadcn 生成的通用组件（大多未在页面中使用）
  data/         projects.ts（作品清单）, about.ts（简历内容）
  i18n.tsx      中英文字典
  index.css     全部样式
public/assets/  海报、卡片动画 webp、logo、字体等
dist/           构建产物（线上用这份）
```

2026-10-18 已核对引用并清理未接入的实验组件：`HeroOrbits.tsx`、`MountainField.tsx`、`BrainNeuron.tsx`、`ParticleBuilding.tsx`；同时移除未使用的 `PdfViewer.tsx`、其专属 CSS 和模板 `src/App.css`。原始素材保留。

`CodeRain.tsx`、`PixelMoon.tsx`、`PixelField.tsx`、`CircularCarousel.*`、`PatternWaves.*` 均已接入当前页面，属于在用代码。`components/ui/` 是保留的通用组件库，本轮未清理。后续删除文件前仍须核对引用。

## 5. 当前状态（截至 2026-10-18）

已上线内容（线上地址 `https://www.cqsan.cn`，对应本目录 `dist/` 的构建）：

- 首页：地球粒子 hero、计数加载（地球数据由 Web Worker 生成，计数不再阻塞）、关于我卡片（卡片动画 `card-about-home-anim.webp`，无文字版）。
- 作品集：环形轮播，右侧信息卡片（`.ring-info`）带淡入动画，底部分页器 `.ring-pager` 使用玻璃材质（已降低不透明度，已去掉色散）。
- 关于页：底部巨型 “Quincy” 字样逐字上浮，最后蓝色小方块弹出（`.fg-ch` / `.fg-sq-up`，依赖 `.footer-in` 类由 IntersectionObserver 设置）。
- 导航：左上角返回键（`.nav-back`）为 46px 玻璃圆形，与导航胶囊同高；语言切换和导航链接为玻璃胶囊。

已知未完成或未验证：

- 页脚方块相对 “y” 的位置，桌面与手机都未用截图核对。
- 窄屏（手机、iPad 竖屏）下关于我卡片和信息卡片的布局未完整验证。
- 玻璃透明度修改后未做截图确认（用户要求的是“能看到底层颜色变化”）。
- “ABOUT ME”“QUINCY” 等卡片内英文字样是硬编码，未进入 i18n。若要双语，需加入字典。
- 线上远端仍保留 345 个旧文件（未删除，只列出）。

## 6. 发布流程（COS + CDN）

发布由 MCP 服务 `cos-publisher` 完成，代码在本目录 `tools/cos-mcp/server.py`，配置在 `.cursor/mcp.json`（已指向本目录）。服务的 `ROOT` 即本目录，状态和计划文件保存在 `.cos-mcp/plans/`。

**打开方式**：在 Cursor 中打开 `Q:\portfolio-react-site` 文件夹，`cos-publisher` 才会加载。

**已验证**：在本目录运行 `plan_publish` 生成的计划为只读，待上传数为 0（线上已与当前 ZIP 一致）。

**旧项目残留**：`Q:\handdrawn_portfolio_v5\tools\cos-mcp` 与 `.cursor/mcp.json` 仍存在，但已不再是发布源；请只使用本目录的版本。Codex 的 `cos-publish` 技能（`C:\Users\CQ\.codex\skills\cos-publish\SKILL.md`）里仍写着旧路径和旧打包命令，需要时应改为本目录。

- 桶：`quincychen-site-1500440846`（ap-hongkong）
- CDN 域名：`https://www.cqsan.cn`
- 凭证只从环境变量读取（`COS_SECRET_ID`、`COS_SECRET_KEY`、`COS_BUCKET`、`COS_REGION`、`COS_CDN_BASE`），**不要把密钥写入文件或聊天**。

标准步骤：

1. 在本目录执行 `python tools/package-release.py`：先 `npx vite build` 生成 `dist/`，再打包为 `release/portfolio-site.zip`（ZIP 内 `index.html` 在根目录，路径为正斜杠）。只想重新打包时加 `--skip-build`。
   - 注意：旧项目的 `tools/build-release.py` 打的是旧静态站，**不能用于 React 版**。
3. 调用 `cos_plan_publish` 生成计划（只读，不上传）。计划会从 ZIP 解压到 `release/publish-current` 再比较。
4. 把计划摘要给用户，等用户在聊天中明确回复 `批准 <计划ID>`（需要 CDN 时为 `批准 <计划ID> 含CDN`）。**不得替用户批准**。
5. 批准后用 `python tools/cos-mcp/server.py approve <计划ID> --yes` 记录（或由用户在终端输入 YES），再调用 `cos_apply_plan`。
6. 上传成功后，用 `cdn_plan_refresh`（参数名为 `publish_id`）生成刷新与预热计划，同样需要批准，然后 `cdn_apply_refresh`。
7. 验收：访问 `https://www.cqsan.cn/`，确认引用的 `assets/index-*.js` 与 `index-*.css` 是新文件名。

限制：

- 没有删除工具。远端多余文件只列出。
- 批准有效期 2 小时，过期需重新生成计划。
- 计划生成后若本地文件又改动，服务会拒绝上传，需重新打包。

## 6.1 动画卡片生成

规范原文在本目录 `HANDOFF.md` §5.1–5.6（画布 900×600、12 帧、110ms、WEBP `quality=80, method=6`、`loop=0`、克莱因蓝只用于主动画层、位移 ≤ 20px、JetBrains Mono、五色调色板、四角十字准星等）。

生成脚本位于 `tools/cards/`，路径已改为本目录结构：

- `gen_card_motion.py`：作品卡动画生成，输出 `public/assets/card-<id>-anim.webp` 与 `-anim-sm.webp`。
- `gen_card_anim.py`：单卡试点模板（链接下载卡）。
- `gen_card_about_anim.py`：关于卡有文字版（输出 `public/assets/card-about-anim.webp`，用于作品集轮播）。
- `gen_card_about_home.py`：首页关于卡无文字版（轨道 + 蓝点），输出 `card-about-home-anim.webp` 与 `-sm.webp`。默认只写入 `tools/cards/out/` 供比对，确认后加 `--write` 才会覆盖线上用的 `public/assets` 文件。
  - **未做到逐像素一致**：线上原图是早期手工版本，没有源码。新脚本的轨道尺寸、点密度、蓝点大小是按原图目测调整的，视觉接近但不完全相同。
  - 时长：Pillow 读不出 WEBP 逐帧 duration，因此 100ms 未经验证，只确认了 12 帧与 `loop=0`。
  - 线上文件目前未被替换。
- `gen_posters.py`：静态海报基础版式。

运行示例（从本目录执行）：`python tools/cards/gen_card_motion.py`。脚本会覆盖已有的同名 webp，运行前请确认。字体来自 `public/fonts/`。

接入：在 `src/data/projects.ts` 中把对应条目的 `thumb` 指向 `-anim.webp`。

## 7. 注意事项

- 当前试版统一详情演示为顶部通栏、截图/说明在下方；Agent 移除播放/重播及装饰性角色标签，仅保留步骤和两个圆形玻璃箭头。原型现由 `prototype-replay.css/js` 管理左侧 Tab 与右侧真实长图滚动；手动选页后停留，手动滚动优先。RetailRocket Tab 已移入 HTML 卡片内部。共用玻璃控件样式为 `replay-chrome.css`。作品顺序改为关于→AI→产品→数据→内容，编号与分页一致为 01–12，分页数字采用滚动数字列；分类、标题、CTA 统一错峰浮入。首页与 Mac 场景新增无可见文字的 `ScrollCue`。
- 内容首篇已用用户提供的 WPS affidavit 文章替换旧 messaging 文章（id=`art-wps`），主页分类入口同步定位。新封面生成器为 `tools/cards/gen_editorial_cards.py`，输出 `card-editorial-anim*.webp` 与 `card-wps-anim*.webp`；最新版放大 Aa/Ñ/文字形与 PDF/签名字形。900×600 / 600×400、12 帧循环、110ms 参数；中文仅烘焙进图形，浏览器不新增中文字库请求。原始旧封面素材保留。本轮仅本地预览，未发布。

- Agent 演示已重做为七步固定视角回放，入口仍是 `ai-cs-replay.html`，专属样式与逻辑为 `agent-replay.css` / `agent-replay.js`。移除原有缩放镜头和固定坐标连线，改用连续步骤轴、手动选步、播放/暂停/重播，最后一步停留；内置中英文并通过高度消息适配 iframe。案例对话、$86.00/4417、规则和评测数字沿用原内容。内容卡片使用 `--card-radius: 12px`；导航胶囊和步骤圆点保留各自形状。`WidgetFrame` 分离预加载与实际可见性观察器，进入视口才播放。本轮仍为本地预览。

- 2026-10-18 子内容页试版：五份演示通过 `public/assets/widgets/embed-theme.css` 统一为白底圆点、极细边框，去除 Mac 顶栏和纸张折角；原型页选择改为横向标签，原始截图保留。详情 iframe 已补全宽度、自适应尺寸与按案例重挂载。RetailRocket 原有三处字体配置缺值已修复，图表数据与业务文案未变。本轮仅本地构建预览，尚未发布。

- 不要直接修改 `dist/` 里的文件，应改 `src/` 后重新 build。
- 不要引入新依赖，除非确有必要并说明性能影响。
- 改动液态玻璃类样式时：保持半透明、模糊、内高光，不加色散。
- 改文字时：同时改 `i18n.tsx` 中的中英文，检查语言切换按钮尺寸没有跳动。
- 旧的 `HANDOFF.md`（编码损坏，内容过时）保留未动，以本文件为准。


## 2026-10-20 AI suite and About motion iteration

- AI navigation is consolidated into `/work/agent-skills` (Architecture + 11 Skills + n8n). Old AI URLs remain aliases. Project numbering is contiguous (10 items including About).
- `src/pages/AISuite.tsx` hosts the isolated authored component and forwards viewport/language messages. Height changes follow expanded content. Source import: `tools/import_ai_suite.py`; original input remains in Downloads and was not edited.
- Imported HTML: `public/assets/widgets/ai-suite.html`; site overrides/bridge in `ai-suite.css` / `ai-suite.js`. Architecture has no outer border; internal rows align with Bento. Detailed Skills copy is retained from the supplied Chinese source.
- n8n is a separate wide animated cover that expands the audit explanation, six stages and evidence metrics (10 languages / 80 pages / 90 current issues, of which 40 new + 50 persisting / 36 resolved). Model suggestions are not presented as automatic repairs.
- `tools/cards/gen_ai_suite.py` generates 900x600 / 600x400 WebP posters (12 frames x 110ms), static JPG fallback, and an intentionally wide 1800x480 n8n cover. Static text, grid and reticles; one small periodic blue motion layer. Original posters are retained. Cover assets live in `public/assets/ai-suite/`.
- About code rain now caches stream ribbons instead of rasterising every glyph every frame. Canvas capped at 1280x900, no DPR inflation. Mac uploads only new rain frames, uses a bounded render DPR and more responsive time-based camera smoothing; depth occlusion and the three-device composition are retained. Warm-up compiles all render layers; hidden scenes still pause.
- Route curves use cached SVG layer translation, not per-frame dash repaint. Existing dissolve and typewriter label remain.
- Local checks: typecheck/build, desktop/mobile AI layout (no horizontal overflow), 11 tiles, expand/close, n8n cover expansion and step navigation. No COS publication in this iteration.

- Follow-up: n8n expanded content now reuses the original `n8n-replay.html` interaction in `n8n-replay-dark.html` with `n8n-suite-dark.css` (black + white dots); no custom six-stage replacement panel. Replay mounts only after cover click and pauses outside the host viewport. Original white replay is unchanged.

- Follow-up correction: route loading uses ONE stationary SVG, three faint curve guides and three constant-speed dashed signals. No SVG translation; browser check confirms unchanged path geometry, no layer transform and changing signal offsets while the About chunk is delayed. AI home/carousel cover v2 now depicts a CLI command, moving blue cursor and tool routing; other Bento and n8n art remains unchanged.
`n- All Work now contains only the 9 projects, numbered 01–09; Agent Skills is first. About remains accessible through navigation. Architecture heading uses the same responsive size and weight as Skills and n8n workflows.

- 2026-10-20 development preview: Data category replaced by Development; BOSS Job Assistant MCP replaces RetailRocket in project listings (old RetailRocket route/assets retained). Dedicated lazy route /work/boss-assistant uses BossAssistant.tsx/Development.css: native scroll maps a continuous camera along four vertically linked SVG/DOM scenes, no step arrows, reduced-motion fallback. Bilingual evidence copy from references/boss-assistant-redesign.html, delivery percentages attributed to supplied batches with missing denominator noted. Covers generated by tools/cards/gen_boss_card.py (37.7 KB / 25.1 KB). Not published; earlier migration ZIP predates this change.

- Development is an extensible category, not the BOSS project name. Home category cover uses card-development-anim; BOSS remains the first individual Development project with its own card-boss-anim cover. Add future tools as separate PROJECTS entries in group development.

- Boss flow refinement: seven native-scroll scenes (four workflow stages + fact record / authorisation / delivery recovery); original supplied Chinese text, one intro subtitle, no decorative edge labels, no closing pitch/disclaimer. Inter + system sans for Chinese, JetBrains Mono only MCP and metrics. Artwork dominates each 12px card; continuous low-opacity route signal; intro blurs out on scroll. Results centred. Home category subtitles removed; Product and Content use generic category posters from gen_category_cards.py. Not published.
Follow-up: BOSS flow posters regenerated with tools/cards/gen_boss_flow.py: 900x600, 12x110ms WebP, static JetBrains Mono titles and semantic labels, small periodic blue layer, JPG fallback and offscreen swap. Results use sequential stroke-dash hand-drawn marker paths. Ending explains verified MCP/CDP and Python/SQLite ledger with normalisation code. All Work article titles now include language prefixes. Intro shorter, enlarged hollow MCP text with animated contour highlights. Local only.
Skills responsive correction: <=600px uses a single 3:2 poster column; 601–1200px uses aligned two-column cards with the last item spanning the full row. Poster camera cropping/zoom removed. Expansion packing now reads computed columns, row height and gap instead of stale hardcoded values. import_ai_suite.py preserves the updated packing algorithm. Checked 320–1440px including expand/close and no horizontal overflow. Local only.

- Surface iteration: Architecture adds 架构; n8n starts at first execution phase and includes a bottom collapse icon. Tablet Bento uses one featured 2x2 card per group of five with paired smaller cards; phones retain readable 3:2 single-column cards. BOSS detail is now white with transparent dark artwork. Poster alpha conversion and outlined Chinese pixel captions live in tools/transparent-posters.py + tools/caption-posters.py; originals preserved under references/opaque-posters and references/alpha-posters. Font source: https://github.com/TakWolf/fusion-pixel-font (2026.10.16), licence bundled in references/fusion-pixel-font; Chinese lettering is baked into images, not a runtime full CJK font download. After rerunning a poster generator, rerun alpha conversion then captions. Black poster containers restore prior appearance. Local only.

- Chinese pixel subtitles revised to solid Fusion Pixel, above English titles, larger (48px at 900px canvas; 36px at 600px). Layout placement remains composition-dependent. Outlined Chinese lettering is superseded.
n8n collapse fix: report body content height rather than documentElement.scrollHeight (which floors at iframe viewport height and prevents shrink). Verified host iframe 2097 -> 2861 -> 2097px. MCP title now one outlined text layer, regular/extended scaleX cycle anchored left; moving contour removed. Mouse indicator has a floating chevron. Local build passed.
BOSS opening now uses a static regular-width outlined MCP wordmark with a filled Klein blue square period. Implementation diagram/copy moved into intro in place of subtitle; final CTA downloads public/downloads/boss-job-kit-public.zip (60780 bytes), copied from supplied public kit after manifest verification. Route signal 9s, journey shortened to 670svh/640svh, three lightweight animated SVG point/square matrices pause offscreen. Desktop/mobile checks: zero overflow, working ZIP, no runtime errors. Local only.

- Readability/Link/WPS/crawl iteration: BOSS intro has no blur/fade on <=900px and uses explicit Inter + system sans for h1. Desktop exit waits until the text bottom has left the reading area. /work/link-download is now a dedicated lazy page (LinkDownload.tsx/CSS), with context/task, concrete flow, quota/error/event decisions and delivery, original prototype plus live/PRD links. WPS title shortened to 英文 / WPS PDF指南; Link and WPS alpha posters fully redrawn by gen_link_wps_v4.py (28.9KB/33.8KB). SEO/GEO files added: robots.txt, sitemap.xml (root only; no hash pseudo-pages), llms.txt, llms-full.txt, site-index.json; head canonical, description, social preview, ProfilePage/Person/WebSite JSON-LD. No visible content added for SEO. Regenerate metadata with tools/generate-crawler-files.py when project data changes. Source guidance: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics . Hash-route individual indexing remains a routing limitation; no index/ranking guarantee. Local build and 390/768/1440 viewport + artifact checks passed. Not published.
