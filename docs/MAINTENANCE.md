# 维护说明

## 当前版本

当前源码为 React 19 / TypeScript / Vite 7。历史 HANDOFF.md 中的 React 18、app/、旧发布路径不再适用。
2026-10-21 已通过 npm run build；最近已发布版本包含：链接下载真实网站互动原型、七张流程动画卡片、细小淡蓝动态波点背景、项目标题更新和机器可读爬虫文件。

## 结构与交互

App.tsx 管理 HashRouter 路由与加载过渡，页面使用延迟加载。首页与 All Work 从项目数据读取入口；AI Suite 部分嵌入组件位于 public/assets/widgets。
LinkPrototype 是前端交互演示；示例文件下载不是真实视频解析后端。原型中的现网站额度与历史项目 PRD 的额度属于不同版本，勿未经核对混改。

## 修改流程

1. 找到对应页面、组件或项目数据。
2. 编辑源码，不修改 dist。
3. npm run build。
4. 对布局或交互修改，分别检查桌面、移动端与中英文。视觉检查受阻时明确说明。
5. 用户明确要求发布时，再打包和执行 COS/CDN 流程。

## 工具与参考

Python 图片工具依赖 Pillow；发布 MCP 依赖见 requirements-tools.txt。tools/explore 为历史资源处理脚本，部分依赖原作者机器路径；产物已在 public 中，正常构建无需执行。
tools/package-transfer.py 是历史迁移打包工具，不作为 GitHub 上传入口。
卡片 alpha、中文标题生成脚本可能读取 references 中的备份并覆盖定稿；不要对全部素材盲目重跑。

## 历史记录

HANDOFF-SITE.md 保留实现过程；“未上线”等状态只描述对应当时的更新，不代表仓库整体当前状态。
