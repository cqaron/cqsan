# Quincy 作品集网站 — 移交文档

> 面向后续维护者 / 协作者。目标是：**不改坏风格，只往里加内容**。
> 读完这份文档，你应该能独立加作品、改文案、生成新海报，并保证风格统一。

---

## 1. 项目概况

- 技术栈：React 18 + TypeScript + Vite + Three.js（仅 hero 地球 / About Mac 场景用）
- 路由：`/`（主页）、`/all-work`（全部作品）、`/about`（关于）、`/work/:id`（作品详情）
- 国际化：中英文切换，字典在 `src/i18n.tsx`，语言入口在导航栏右上角（EN / 中）
- 构建：`cd app && npm run build`，产物在 `app/dist/`（预览服务 serve 的就是 dist，改完必须重新 build）
- 开发：`npm run dev`

```
app/
├─ src/
│  ├─ pages/        Home.tsx / AllWork.tsx / About.tsx / WorkDetail.tsx
│  ├─ components/   Nav / Footer / ParticleGlobe / MacScene / Preloader / …
│  ├─ data/         projects.ts（作品清单）/ about.ts（简历内容）
│  ├─ i18n.tsx      中英文字典（type 派生自 en，加 key 必须双语都加）
│  └─ index.css     全部样式（单文件，按区块注释分段）
├─ public/assets/   海报图、logo、动画 webp
└─ dist/            构建产物
```

---

## 2. 设计系统（务必遵守）

### 颜色

| Token | 值 | 用途 |
|---|---|---|
| `--ink` | `#0b0b0c` | 近黑，正文 / 深色区块 |
| `--paper` | `#fbfbfb` | 近白，浅色区块背景 |
| `--accent` | `#2e2ee6` | 克莱因蓝，唯一的强调色（分点小方块、跳变字符、链接 hover） |

规则：**全站只有黑 / 白 / 灰 + 克莱因蓝**。不要引入第二种彩色。蓝色只用于"点缀"（面积 < 5%），大面积蓝色是错的。

### 字体

- **JetBrains Mono**：标题、编号、标签、ASCII 元素、像素字 —— 所有"设计感"文字
- **Inter Regular (400)**：正文、以及所有需要"我们自己补"的 logo 文字（**绝不用粗体**）

### 排版气质

极简、大留白、编号化（01 / 02 / 03）、细字重、宽字距小标签（`letter-spacing: 0.3em` 的 11px 大写标签是标志性元素）。装饰元素一律"淡到刚好能注意到"：opacity 0.1–0.4，永远不影响可读性。

---

## 3. 关键交互 / 动画清单（改动前先读懂）

| 位置 | 效果 | 实现 |
|---|---|---|
| 加载动画 | 数字 0→100 从上方匀速落入底部，原地消散，过渡到 hero | `components/Preloader.tsx` |
| Hero 标题 | `hello` 逐字母 hover 乱码（加密映射风格，只有碰到的字母变） | `pages/Home.tsx` |
| ll 穿越 | 向下滚动时从 hello 的 "ll" 白色笔画中放大穿越到白色区。**严禁圆形遮罩 / 黑边补齐**，只能是字母笔画本身指数放大 | `pages/Home.tsx`（inkOf 测量 + transform-origin 对准笔画） |
| 粒子地球 | ASCII 字符粒子地球 + 稀疏星点 + 1 颗白色粒子卫星 + 远处光晕；缓慢自转，hover 区域粒子散开 | `components/ParticleGlobe.tsx` |
| 作品 carousel | 大滚圈：卡片黏连 → 细胞分裂式抽离 → 转动 → 选中飞入左侧毛玻璃展示区；**切换时旧卡先飞回原位，新卡再进入**，不叠加 | `pages/AllWork.tsx` |
| 四卡组件 | 左文右卡，hover 上下两侧变蓝，**不消失** | `pages/Home.tsx` `.cc-feature` |
| Mac 收束 | About 尾部：3D Macintosh + 复古键盘，scroll 从侧俯视扶正；屏幕上是 Chrome 404 小恐龙动画（黑底白像素 + 左上像素字 `CHENQI.`）；继续滚动屏幕黑色放大淹没视口，进入黑色结尾 | `components/MacScene.tsx` |
| 结尾飞入 | Connect / Background / Recognition 从左到右依次浮入 | `components/Footer.tsx` `.ft-line` |
| 底部巨字 | `Quincy` + 蓝色方块句点，JS 按宽度自适应，任何设备完整可见 | `components/Footer.tsx` `.footer-giant` |
| 代码流 | Mac 场景背景墙面的垂直代码雨，克莱因蓝跳变 | `components/MacScene.tsx` |

动画审美原则：**顺、慢、连贯**。优先 `cubic-bezier` 缓动 + 较长时长，避免突兀跳变；所有 scroll 驱动的动画必须连续映射滚动进度，不做"到点播放"。

---

## 4. 内容维护指南

### 加一个作品

1. 生成海报（见 §5）
2. 在 `src/data/projects.ts` 的 `PROJECTS` 里加一条：
   ```ts
   { id: 'my-work', index: '12', title: '…', titleZh: '…',
     group: 'product' | 'data' | 'ai' | 'content',
     category: '…', categoryZh: '…', year: '2026',
     thumb: '/assets/card-xxx.jpg', link: '/work/my-work' 或外链 }
   ```
3. 如有详情页，在 `src/pages/WorkDetail.tsx` 的内容表加对应条目
4. **不要写死数字编号到图片里**，编号由数据渲染

### 改简历 / 关于页内容

全部在 `src/data/about.ts`：`ABOUT_SKILLS`、`ABOUT_EXPERIENCE`（蓝色小方块分点自动渲染）、`ABOUT_EDU`。

### 改文案

`src/i18n.tsx`，中英文必须同步加 key。hero 的 `hello` 不本地化，保持英文。

### Footer 徽章（Powered By）

规范（用户明确要求，不要再踩坑）：
- **优先官方原汁原味的 logo**：官方图标 + 官方文字标（lockup），能不自己加字就不加
- 实在没有官方文字标，才用 Inter **Regular 400** 补字（`.ft-wordmark`），禁止粗体
- 全部 `filter: grayscale(1)` + 深色区 `invert(1) brightness(1.6)`，保持黑白灰统一
- 一排 flex 排列，不要 pill 外框、不要分类标签

---

## 5. 海报 / 图片生成规格

> 本章只统一**规格与形制**（尺寸、配色、字体、导出参数、接入方式），
> 不限制创意：构图、符号、动效形式都可以自由发挥，只要落在规格内。

### 5.1 生成脚本与依赖

| 脚本（工作区根目录） | 用途 | 输出 |
|---|---|---|
| `gen_posters.py` | 静态海报批量生成 | `app/public/assets/card-*.jpg` |
| `gen_card_anim.py` | 动画海报（以 link 卡为试点范例） | `app/public/assets/card-*-anim.webp` |

依赖：Python + Pillow；字体文件在 `fonts/JetBrainsMono-Regular.ttf` / `JetBrainsMono-Bold.ttf`（脚本按此相对路径引用，挪位置要同步改）。

### 5.2 静态海报规格（硬性）

- 画布：**1500×1000**（3:2），纯黑底 `RGB(10,10,10)`
- 字体：**只用 JetBrains Mono**（标题 Bold / 辅助 Regular）
- 调色板（只有这五个）：
  - 主前景 `RGB(236,238,242)` 近白
  - 次要 `RGB(110,114,124)` 灰
  - 装饰 `RGB(52,55,62)` 深灰
  - 点缀 `RGB(43,91,255)` 克莱因蓝
  - 底纹网格：白色 alpha≈5，间距 60px
- 四角十字准星标记（±40px 内缩，10px 臂长，深灰）——系列识别元素，保留
- 文字版式：左上小分类标签（28px Bold 灰）、左下主标题（58px Bold 白）、右下一行 `// ` 前缀的注解（24px 灰，右对齐）
- **编号（01/02…）不写死在图里**，由前端数据渲染
- 导出：JPG，quality 85 左右

### 5.3 动画海报规格（硬性）

以 `gen_card_anim.py` 为模板，新卡复制改绘即可：

- 画布：**900×600**（即 1500×1000 × 0.6，省体积；视觉一致）
- 帧序列：**12 帧**，每帧 **110ms**，`loop=0` 无限循环
- 导出：**WEBP**，`quality=82, method=6`，目标体积 **< 100KB**
- 命名：`card-<id>-anim.webp`，放进 `app/public/assets/`
- 接入：把 `projects.ts` 里对应条目的 `thumb` 从 `.jpg` 换成 `-anim.webp` 即可，无需改组件
- 静态 fallback：保留同名 `.jpg`，需要回退时改回一行

### 5.4 动画分层原则（形制统一，创意自由）

帧 = **静态底层** + **最多两个动画层**，这是保持可读性的关键：

1. **静态底层**：网格、准星、全部文字、主图形轮廓 —— 每帧原样重绘，绝不动
2. **主动画层（一个）**：卡片的 iconic 元素做小幅周期运动
   （试点卡 = 蓝色箭头 `sin(t·2π)` 上下浮动 ±16px）
3. **氛围层（可选一个）**：点阵 / hatch 的 alpha 呼吸（如 `20 + 10·sin(...)`）

- 运动一律用 **正弦 / 平滑周期函数**，首末帧无缝衔接（`t = f / FRAMES` 取满一个周期）
- 位移幅度 ≤ 20px、透明度波动 ≤ ±10，**宁可看不出在动，也不要抢阅读**
- 克莱因蓝优先给主动画层，让视线落在会动的元素上

### 5.5 创意上的自由空间

以下都不受限，鼓励发挥：iconic 符号的选择与画法（链条、箭头、图表、字符画均可）、构图留白比例、动画形式（浮动 / 呼吸 / 扫描线 / 字符跳变 / 打字机效果…）、注解文案。只要不破坏 5.2–5.4 的规格与"安静、现代、黑白蓝"的气质。

### 5.6 展示边界

卡片外侧（精选作品、carousel）一律用重绘海报；**只有作品详情页内部才用原始素材图**。

---

## 6. 性能与部署注意

- WebGL 渲染器**不要开** `preserveDrawingBuffer`（调试截图才需要，上线必须关）
- ≤1100px 宽度时 ASCII 装饰整层不渲染（移动端读性优先）
- 构建若有 chunk > 500kB 警告属正常（Three.js），如上线卡顿再做 manualChunks 拆分
- 部署：任意静态托管，serve `app/dist/`，SPA 路由需要 fallback 到 `index.html`
