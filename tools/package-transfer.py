from pathlib import Path
import os,json,zipfile,hashlib,datetime,importlib.metadata
ROOT=Path.cwd(); OUT=ROOT/'transfer';OUT.mkdir(exist_ok=True)
entries={}
skip={'node_modules','cdp-profile','.git','.cos-mcp','.cursor','.workbuddy','release','transfer','__pycache__','.pytest_cache'}
for base,dirs,files in os.walk(ROOT):
 dirs[:]=[d for d in dirs if d not in skip]
 for n in files:
  p=Path(base)/n;rel=p.relative_to(ROOT)
  if n.startswith('.env') or p.suffix.lower() in {'.log','.pyc','.key','.pem','.pfx','.p12'} or n.endswith('.tsbuildinfo'):continue
  entries[rel.as_posix()]=p.read_bytes()
external=Path('C:/Users/CQ/Downloads/agent_skills_with_n8n_workflow.html')
assert external.exists(),'Missing AI source'
entries['references/agent_skills_with_n8n_workflow.html']=external.read_bytes()
entries['references/legacy-AGENTS.md']=Path('Q:/handdrawn_portfolio_v5/AGENTS.md').read_bytes()
s=entries['tools/import_ai_suite.py'].decode('utf-8').replace("Path('C:/Users/CQ/Downloads/agent_skills_with_n8n_workflow.html')","ROOT / 'references/agent_skills_with_n8n_workflow.html'")
entries['tools/import_ai_suite.py']=s.encode()
entries['AGENTS.md']='''# 项目维护约束
先读 MIGRATION.md、HANDOFF-SITE.md，以及 HANDOFF.md 中的动画卡片规范。历史文档中的旧路径、旧版本号、旧发布状态以 MIGRATION.md 为准。
- 当前目录为唯一源码。React 19 / TypeScript / Vite 7 / HashRouter；不要回旧静态站修改。
- 简体中文沟通；文案同步中英；黑白灰 + #2e2ee6；液态玻璃不加色散；保留用户素材。
- 保持优雅灵动、性能优先，隐藏动画暂停。实测数据与推测分开，不承诺绝对帧率。
- 动画卡片遵守 HANDOFF.md 的字体、色板、尺寸、静态文字和克制动效规范。
- 构建检查 npm run build；桌面/移动端与双语检查。不得直接编辑 dist。
- 发布使用本目录 tools/package-release.py 和 tools/cos-mcp/server.py。不得使用旧 build-release.py。
- 只有用户明确授权才能上传和刷新 CDN；可以一次授权覆盖本次上传及 CDN，不重复索要批准。生成计划并核对后记录批准，使用 --with-cdn 自动刷新。保留远端旧资源。
- 禁止读取、打印、提交密钥；凭证仅通过环境变量。
'''.encode()
entries['migration/setup-mcp.py']='''from pathlib import Path
import json,sys
root=Path(__file__).resolve().parents[1]
server=str(root/'tools/cos-mcp/server.py').replace('\\\\','/')
keys=['COS_SECRET_ID','COS_SECRET_KEY','COS_BUCKET','COS_REGION','COS_CDN_BASE']
config={'mcpServers':{'cos-publisher':{'command':sys.executable,'args':[server],'env':{k:'${env:'+k+'}' for k in keys}}}}
(root/'.cursor').mkdir(exist_ok=True)
(root/'.cursor/mcp.json').write_text(json.dumps(config,ensure_ascii=False,indent=2),encoding='utf-8')
snippet='[mcp_servers.cos-publisher]\\ncommand = '+json.dumps(sys.executable)+'\\nargs = ['+json.dumps(server)+']\\nenv_vars = '+json.dumps(keys)+'\\n'
(root/'migration/codex-mcp.generated.toml').write_text(snippet,encoding='utf-8')
print('Created .cursor/mcp.json and migration/codex-mcp.generated.toml; merge the latter into your Codex config, then restart.')
'''.encode()
packages=['mcp','cos-python-sdk-v5','tencentcloud-sdk-python-cdn','Pillow']
req=[]
for p in packages:
 try:req.append(p+'=='+importlib.metadata.version(p))
 except importlib.metadata.PackageNotFoundError:req.append('mcp>=1.2,<2' if p=='mcp' else p)
entries['migration/requirements.txt']=('\n'.join(req)+'\n').encode()
skill=Path('C:/Users/CQ/.codex/skills/cos-publish/SKILL.md').read_text(encoding='utf-8')
# Keep historical skill for provenance; use current, portable instructions as active skill.
entries['references/cos-publish-original-SKILL.md']=skill.encode()
entries['migration/skills/cos-publish/SKILL.md']='''---
name: cos-publish
description: Publish this portfolio React project to Tencent COS and refresh CDN after explicit user authorization.
---
Read the project MIGRATION.md and HANDOFF-SITE.md. Resolve all paths relative to the project root. Server is tools/cos-mcp/server.py. Build/package with python tools/package-release.py (not the legacy build-release.py). Use cos-publisher MCP cos_status, cos_plan_publish and cos_apply_plan. Check the generated plan before applying. User authorization is mandatory for remote writes; one explicit request approving publication including CDN covers both operations. After authorization, record python tools/cos-mcp/server.py approve PLAN_ID --yes --with-cdn, then call cos_apply_plan, which also submits CDN purge and prefetch. Do not submit duplicate CDN tasks. No remote deletion. Assets before HTML. Verify the live HTML references the new build. Credentials remain in environment variables; never print or copy them. Bucket quincychen-site-1500440846; region ap-hongkong; CDN https://www.cqsan.cn. Unrelated global MCPs and credentials are not part of this package.
'''.encode()
entries['MIGRATION.md']='''# 公司电脑继续编辑：先读这里

本包是 2026-10-20 的完整项目快照，包含源码、public 素材与字体、原型/实验资源、生成脚本、验收截图和脚本、dist、规范交接、COS MCP 服务和迁移配置。线上已发布本次版本（55 文件，发布计划 20261020-015152-54097f，CDN 已提交）。All Work 为 9 项，Skills 第一张；Architecture/Skills/n8n workflows 同字号。历史交接中的 10 项、旧目录、旧动画描述已过时。

## 启动
1. 解压到任意可写目录（如 D:\\Projects\\portfolio-react-site），在 Codex/编辑器中打开这一整个目录。
2. 安装 Node.js 22 LTS（至少 22.12）和 Python 3.11/3.12，重开终端。需网络下载依赖；包不含 node_modules、运行时安装器，因此不是完全离线环境。
3. 项目终端执行 `npm ci`，然后 `npm run dev -- --host 127.0.0.1 --port 4174`。访问终端给出的地址。修改会热更新。
4. 验证/上线前 `npm run build`。查看生产产物用 `npm run preview -- --host 127.0.0.1 --port 4174`（先停止同端口开发服务）。路由形如 /#/about、/#/all-work、/#/work/agent-skills。

## MCP（编辑网站本身不需要云凭证）
- `python -m pip install -r migration/requirements.txt`；Pillow 用于生成图片，其余是发布 MCP 依赖。
- 执行 `python migration/setup-mcp.py`，生成适配新电脑实际路径和 Python 的 Cursor 配置及 Codex 配置片段。
- Codex：把 migration/codex-mcp.generated.toml 的区块合并到用户目录 .codex/config.toml；已有同名区块先替换，不要重复。Cursor：脚本已写 .cursor/mcp.json。完整重启应用，再检查 cos_status。
- 可把 migration/skills/cos-publish 文件夹复制到用户目录 .codex/skills/ 中；不必携带本机全部技能和无关 MCP。
- 在新电脑安全设置环境变量 COS_SECRET_ID / COS_SECRET_KEY；从腾讯云为公司电脑单独创建具有必要最小权限的子账号密钥，别通过聊天发密钥。普通编辑、预览不需要这两个变量。
- 非敏感变量：COS_BUCKET=quincychen-site-1500440846，COS_REGION=ap-hongkong，COS_CDN_BASE=https://www.cqsan.cn。设置后重启应用。密钥、环境变量实际值、登录态和历史批准记录未打包。
- 发布：python tools/package-release.py -> cos_plan_publish -> 核对清单并取得用户本次批准 -> python tools/cos-mcp/server.py approve PLAN_ID --yes --with-cdn -> cos_apply_plan。后者自动提交 CDN 刷新/预热。不要沿用旧批准或重复刷新。

## 资源与约束
- 当前站点依赖的资源已在 public 内；AI 原始组件补入 references/，导入脚本已改相对路径。
- AGENTS.md 为可携带的当前规则入口；HANDOFF-SITE.md 为当前架构说明；HANDOFF.md 保留详细卡片规范，但旧技术栈/旧路径须忽略。references/legacy-AGENTS.md 是旧规则原文。
- 不要直接重跑整个 AI 导入/图片生成脚本来覆盖现有定稿，先审查输出差异。
- tools/explore/thanks/process_logos.py 是历史素材整理脚本，仍引用旧 Cursor 素材缓存；成品 logo 已随 public 和工具素材保存，正常编辑/构建/发布无需运行它。若重做，需人工指定素材源目录。
- gen_editorial_cards.py 的中文字体依赖 Windows 微软雅黑；公司 Windows 通常自带，其他系统请替换字体路径。
- review 的部分浏览器验证脚本使用本机 Playwright 绝对路径，属历史验收记录。重新运行需安装 Playwright 并替换 require 路径，不影响产品构建。
- 本包不含 node_modules、个人配置目录、缓存、COS 历史审批、密钥、浏览器登录态。运行时和第三方工具要在新电脑安装。
- 单机编辑以解压后的目录为准；两台电脑不会自动同步。回传修改请重新打包或使用私有 Git 仓库，避免同时改两份覆盖。

## 完整性
根目录 TRANSFER-MANIFEST.json 记录所有文件 SHA-256，可用 migration/verify.py 校验。ZIP 外另有 SHA256 校验文件。
'''.encode()
entries['migration/verify.py']='''from pathlib import Path
import hashlib,json,sys
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'TRANSFER-MANIFEST.json').read_text(encoding='utf-8'))
bad=[n for n,h in manifest.items() if not (root/n).is_file() or hashlib.sha256((root/n).read_bytes()).hexdigest()!=h]
print('PASS: '+str(len(manifest))+' files verified' if not bad else 'FAILED: '+str(bad))
sys.exit(bool(bad))
'''.encode()
entries['TRANSFER-MANIFEST.json']=json.dumps({k:hashlib.sha256(v).hexdigest() for k,v in entries.items()},ensure_ascii=False,indent=2).encode()
archive=OUT/'portfolio-react-site-company-2026-10-20.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name,data in entries.items():z.writestr('portfolio-react-site/'+name,data)
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 for name,data in entries.items():assert z.read('portfolio-react-site/'+name)==data
h=hashlib.sha256(archive.read_bytes()).hexdigest()
archive.with_suffix('.zip.sha256.txt').write_text(h+'  '+archive.name+'\n',encoding='utf-8')
print(json.dumps({'archive':str(archive),'files':len(entries),'MB':round(archive.stat().st_size/1048576,2),'sha256':h,'python_dependencies':req},ensure_ascii=False))

