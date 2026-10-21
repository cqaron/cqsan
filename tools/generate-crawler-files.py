from pathlib import Path
import json,re,html
R=Path.cwd();base='https://www.cqsan.cn';src=(R/'src/data/projects.ts').read_text(encoding='utf-8');projects=[]
for line in src.split('/** Home')[0].splitlines():
 if "{ id:" not in line:continue
 props=dict(re.findall(r"(\w+): '([^']*)'",line));projects.append(props)
summaries={
'agent-skills':'Agent architecture, 11 skills and n8n workflows for content and site operations.',
'link-download':'Research, PRD and launch follow-up for a same-page link parsing, preview and download flow.',
'boss-assistant':'A BOSS job assistant workflow covering role reading, evidence matching, authorised sending and delivery verification.'}
index={'name':'Quincy / 陈祺 — Portfolio','url':base+'/','language':['zh-CN','en'],'owner':{'name':'陈祺','alternateName':'Quincy'},'projects':[{'title':p['title'],'titleZh':p['titleZh'],'category':p['category'],'url':base+'/#'+p['link'] if p['link'].startswith('/') else p['link'],'description':summaries.get(p['id'],p['title'])} for p in projects]}
(R/'public/site-index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=['# Quincy / 陈祺 — Portfolio','','> Product work, development tools, AI workflows and independently written multilingual articles.','','## Site','- [Home]('+base+'/)','- [About]('+base+'/#/about)','- [All work]('+base+'/#/all-work)','','## Projects']
for p in index['projects']:lines.append(f"- [{p['titleZh']} / {p['title']}]({p['url']}): {p['description']}")
lines+=['','## Machine-readable resources','- [Project index]('+base+'/site-index.json)','- [Portfolio details]('+base+'/llms-full.txt)','','The site uses hash navigation. Fragment links open the corresponding client-side view; they are not separate server documents.']
(R/'public/llms.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
full=lines[:];full+=['','## Link Download','The homepage already had link input and media parsing. The work added preview confirmation, a 10-second download preparation state, completion feedback and retry. The web quota is 10 downloads per 24 hours and 50 MB per file. Research, PRD, prototype, quota and exception rules, event definitions and launch follow-up are presented in the portfolio.','','## BOSS Job Assistant MCP','The workflow reads a role, matches confirmed personal evidence, drafts a greeting, obtains authorisation, sends through a CDP script and verifies greeting and résumé-image delivery separately. A Python and SQLite ledger records roles and applications.','','## Agent Skills','The AI suite presents architecture, 11 skills and an n8n site-audit workflow. Skills include article creation, batch composition, content management, refinement, multilingual flow, asset library, landing pages, event measurement, layouts, page standards and access gateway.']
(R/'public/llms-full.txt').write_text('\n'.join(full)+'\n',encoding='utf-8')
(R/'public/robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: '+base+'/sitemap.xml\n',encoding='utf-8')
(R/'public/sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+base+'/</loc></url></urlset>\n',encoding='utf-8')
schema={'@context':'https://schema.org','@graph':[{'@type':'Person','@id':base+'/#person','name':'陈祺','alternateName':'Quincy','url':base+'/'},{'@type':'WebSite','@id':base+'/#website','url':base+'/','name':'Quincy — 陈祺作品集','inLanguage':['zh-CN','en'],'creator':{'@id':base+'/#person'}},{'@type':'ProfilePage','@id':base+'/#profile','url':base+'/','name':'Quincy — 陈祺作品集','mainEntity':{'@id':base+'/#person'},'hasPart':[{'@type':'CreativeWork','name':p['titleZh'],'alternateName':p['title'],'url':p['url'],'creator':{'@id':base+'/#person'}} for p in index['projects']]}]}
p=R/'index.html';s=p.read_text(encoding='utf-8').replace('<html lang="en">','<html lang="zh-CN">');s=re.sub(r'    <meta name="description".*?</script>', '    <title>Quincy — Product · Growth · AI</title>', s, count=1, flags=re.S)
metadata='''    <meta name="description" content="陈祺 Quincy 的作品集：产品设计与上线、开发工具与 MCP、Agent Skills 与 n8n 工作流，以及英西中多语种内容。" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="https://www.cqsan.cn/" />
    <link rel="alternate" type="application/json" href="/site-index.json" title="Portfolio project index" />
    <link rel="alternate" type="text/plain" href="/llms.txt" title="Portfolio for language models" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Quincy — 陈祺作品集" />
    <meta property="og:title" content="Quincy — 陈祺作品集" />
    <meta property="og:description" content="产品、开发、AI 工作流与多语内容作品。" />
    <meta property="og:url" content="https://www.cqsan.cn/" />
    <meta property="og:locale" content="zh_CN" />
    <meta property="og:image" content="https://www.cqsan.cn/assets/og-site.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Quincy — Portfolio" />
    <meta name="twitter:description" content="Product, development, AI workflows and multilingual writing." />
    <meta name="twitter:image" content="https://www.cqsan.cn/assets/og-site.png" />
'''
s=s.replace('    <title>Quincy — Product · Growth · AI</title>',metadata+'    <title>Quincy — 陈祺作品集 · Product / Development / AI</title>\n    <script type="application/ld+json">'+json.dumps(schema,ensure_ascii=False).replace('</','<\\/')+'</script>');p.write_text(s,encoding='utf-8')
from PIL import Image,ImageDraw,ImageFont
im=Image.new('RGB',(1200,630),'white');d=ImageDraw.Draw(im);font=ImageFont.truetype(str(R/'public/fonts/JetBrainsMono-Regular.ttf'),105);d.text((80,160),'Quincy.',font=font,fill='#19191d');d.rectangle((900,215,956,271),fill='#2e2ee6');small=ImageFont.truetype(str(R/'public/fonts/JetBrainsMono-Regular.ttf'),25);d.text((84,360),'PRODUCT / DEVELOPMENT / AI / CONTENT',font=small,fill='#686873');im.save(R/'public/assets/og-site.png',optimize=True)
print('Crawler metadata generated without changing visible page content')
