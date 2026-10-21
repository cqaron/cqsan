"""Import the supplied interaction and authored copy, externalise its posters.
The input is retained unchanged. Site-specific styling lives in a separate file.
"""
from pathlib import Path
import json, re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'references/agent_skills_with_n8n_workflow.html'
s = SOURCE.read_text(encoding='utf-8-sig')
skills = json.loads(re.search(r'const SKILLS=(\[.*?\]);', s, re.S).group(1))
skills = skills[:11]
s = re.sub(r'const SKILLS=\[.*?\];', lambda _: 'const SKILLS='+json.dumps(skills, ensure_ascii=False)+';', s, count=1, flags=re.S)
for key, ext in [('POSTER_WEBP', '.webp'), ('POSTER_STATIC', '.jpg')]:
    mapping = {v['kind']: '/assets/ai-suite/'+v['id']+ext for v in skills}
    s = re.sub(r'const '+key+r'=\{.*?\};', lambda _, key=key, mapping=mapping: 'const '+key+'='+json.dumps(mapping)+';', s, count=1, flags=re.S)
a=s.index('function sceneHTML('); b=s.index('\nfunction ', a+10)
s=s[:a]+'''function sceneHTML(kind){return `<div class="scene" aria-hidden="true"><div class="scene-camera"><picture><source media="(prefers-reduced-motion: reduce)" srcset="${POSTER_STATIC[kind]}"><img src="${POSTER_WEBP[kind]}" alt="" decoding="async" loading="lazy" width="900" height="600"></picture></div></div>`}'''+s[b:]
s=s.replace('aria-label="12 Agent Modules"', 'aria-label="11 Agent Skills"')
s=s.replace('<div class="bento" id="bento">', '<h2 class="suite-section-title">Skills</h2><div class="bento" id="bento">')
s=s.replace('</head>', '<link rel="stylesheet" href="/assets/widgets/ai-suite.css?v=1"></head>')
s=s.replace('</main><script>', '''</main>
<section class="workflow-section" aria-labelledby="workflow-heading">
  <h2 class="suite-section-title" id="workflow-heading">n8n workflows</h2>
  <article class="workflow-tile">
  <button class="workflow-cover" type="button" aria-expanded="false" aria-controls="workflow-details"><picture><source media="(prefers-reduced-motion:reduce)" srcset="/assets/ai-suite/n8n-wide.jpg"><img src="/assets/ai-suite/n8n-wide.webp" alt="n8n site audit workflow" loading="lazy" decoding="async" width="1800" height="480"></picture><span class="workflow-cover-action" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m6 10 6 6 6-6"/></svg></span></button>
  <div class="workflow-expand" id="workflow-details" hidden><iframe class="workflow-replay" title="n8n 多语言站点巡检工作流" data-src="/assets/widgets/n8n-replay-dark.html" loading="lazy"></iframe></div></article>
</section><script>''',1)
s=s.replace('</body>', '<script src="/assets/widgets/ai-suite.js?v=1"></script></body>')
# The iframe grows with opened cards. Its viewport is the full document, so
# the host sends the real browser view rather than waking every animation.
out = ROOT/'public/assets/widgets/ai-suite.html'
out.write_text(s, encoding='utf-8')
print(out, out.stat().st_size, 'bytes; embedded image payloads remaining:', s.count('data:image'))

base=(ROOT/"public/assets/widgets/n8n-replay.html").read_text(encoding="utf-8")
(ROOT/"public/assets/widgets/n8n-replay-dark.html").write_text(base.replace("</head>",'<link rel="stylesheet" href="n8n-suite-dark.css?v=1"></head>'),encoding="utf-8")

# Keep expanded packing in sync with the actual responsive CSS grid.
output = ROOT / 'public/assets/widgets/ai-suite.html'
page = output.read_text(encoding='utf-8')
a = page.index('function env()'); b = page.index('function requiredSpan', a)
page = page[:a] + "function env(){const style=getComputedStyle(bento);return {columns:style.gridTemplateColumns.split(' ').filter(Boolean).length,row:parseFloat(style.gridAutoRows),gap:parseFloat(style.rowGap)}}\nfunction sizeAt(index,columns){if(window.innerWidth<=1200)return columns===1?{w:1,h:1}:(index%5===0?{w:2,h:2}:{w:1,h:1});return baseSizes[index]}\n" + page[b:]
output.write_text(page, encoding='utf-8')

# Current surface and opening state.
page = output.read_text(encoding='utf-8').replace('<h1>Architecture</h1>', '<h1>Architecture <small class="arch-zh">架构</small></h1>')
page = re.sub(r'(/assets/ai-suite/[^\s\"\'<>]+)\.jpg', r'\1.png', page)
output.write_text(page, encoding='utf-8')
replay = ROOT / 'public/assets/widgets/n8n-replay-dark.html'
page = replay.read_text(encoding='utf-8').replace("started=true;fit();document.getElementById('status').textContent='Overview';\n await dwell(1000,id);if(id!==serial)return;", "started=true;camera(PHASES[0]);")
replay.write_text(page, encoding='utf-8')

page = replay.read_text(encoding='utf-8').replace("fit();addEventListener('resize'", "camera(PHASES[0]);addEventListener('resize'")
replay.write_text(page, encoding='utf-8')

page=replay.read_text(encoding='utf-8').replace('<span id="status">Overview</span><span id="step">30 nodes</span>', '<span id="status">Execute workflow</span><span id="step">1 / 26</span>')
replay.write_text(page,encoding='utf-8')
