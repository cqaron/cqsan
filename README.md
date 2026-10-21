# 陈祺 · 作品集 / Quincy Portfolio

个人作品集网站，当前站点：<https://www.cqsan.cn>。

React 19、TypeScript、Vite 7；Three.js / OGL 场景；中英文切换；HashRouter。
本次版本替换仓库中原 VQICE 静态网站，旧文件从当前分支移除，历史提交保留。

## 本地启动

需要 Node.js 22.12+、npm。正常编辑与构建不需要 Python 或云账号。

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 4174
```

访问 <http://127.0.0.1:4174/>。

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4174
```

开发与预览服务不能同时占用同一端口。`build` 包含 TypeScript 检查。

## 目录

| 路径 | 内容 |
| --- | --- |
| `src/pages/` | 首页、关于、作品轮播和项目详情 |
| `src/components/` | 导航、加载过渡、互动原型、粒子场景与共享组件 |
| `src/data/` | 作品索引与页面数据 |
| `src/lib/` | 加载及场景辅助逻辑 |
| `src/i18n.tsx` | 双语状态和文案 |
| `public/assets/` | 站点图片、动画卡片、嵌入组件和项目文档 |
| `public/fonts/` | 本地字体资源 |
| `public/downloads/` | 网站实际提供的工具下载 |
| `tools/cards/` | 动画卡片生成脚本 |
| `tools/cos-mcp/` | COS 发布与 CDN MCP 服务代码 |
| `references/` | 原始组件、海报加工源文件、像素字体及许可 |
| `docs/` | 当前维护、设计和部署说明 |
| `HANDOFF-SITE.md` | 累积实现记录；历史状态需结合当前源码判断 |
| `HANDOFF.md` | 历史设计规范；旧技术栈和路径不作为启动依据 |

主要路由：`/#/`、`/#/about`、`/#/all-work`、`/#/work/agent-skills`、`/#/work/boss-assistant`、`/#/work/link-download`。

## 修改入口

- 作品名称、分类、排序和缩略图：`src/data/projects.ts`。
- 链接下载详情与真实网站互动原型：`src/pages/LinkDownload.tsx`、`src/components/LinkPrototype.tsx`。
- 页面布局和样式：对应页面的 TSX / CSS；共享样式见 `src/index.css`。
- 不直接编辑 `dist/`。生成脚本可能覆盖定稿，运行前阅读脚本和规范。

## 发布与机器可读文件

见 [部署说明](docs/DEPLOYMENT.md)。GitHub 提交不等同于腾讯云发布。
`robots.txt`、`sitemap.xml`、`llms.txt` 等由 `tools/generate-crawler-files.py` 生成。
当前使用 hash 路由，sitemap 不伪造独立可索引的 hash 子页面。

## 素材与本机文件

运行所需资源均在 `public/`；不提交 node_modules、构建产物、迁移 ZIP、本机配置、浏览器资料、密钥或云发布审批记录。
第三方字体与素材遵循各自许可；本仓库不对所有素材统一授予开源许可。
