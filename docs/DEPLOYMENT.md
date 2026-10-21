# 构建、COS 与 CDN

当前生产站点：https://www.cqsan.cn

```sh
npm ci
npm run build
python tools/package-release.py --skip-build
```

发布包位于 release/portfolio-site.zip；根目录包含 index.html。它是生成产物，不提交到 Git。
发布工具：tools/cos-mcp/server.py。配置使用环境变量 COS_SECRET_ID、COS_SECRET_KEY、COS_BUCKET、COS_REGION、COS_CDN_BASE。密钥不要放在配置文件、仓库或聊天中。

当前非敏感配置：

- COS_BUCKET=quincychen-site-1500440846
- COS_REGION=ap-hongkong
- COS_CDN_BASE=https://www.cqsan.cn

MCP stdio 启动示例（根据电脑路径调整）：python /absolute/path/to/tools/cos-mcp/server.py

流程：生成最新 ZIP → cos_plan_publish → 核对计划 → 用户明确授权本次上传与 CDN → 记录批准 → cos_apply_plan。
已得到用户本次授权后，可用 `python tools/cos-mcp/server.py approve PLAN_ID --yes --with-cdn` 记录；上传成功会自动生成并提交 CDN 刷新/预热，不重复调用。
没有用户授权，不自行批准。服务会校验批准有效期和文件一致性。HTML 最后上传；远端多余文件不会自动删除。

GitHub 只维护源码。原仓库 VQICE 页面和旧 vercel 配置从当前树移除，未设置自动 COS 发布工作流。
若需 GitHub Pages，必须另外配置 Vite base 和构建部署，不能把源码 index.html 直接当静态产物托管。
