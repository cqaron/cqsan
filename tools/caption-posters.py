from pathlib import Path
from PIL import Image,ImageSequence,ImageDraw,ImageFont
import shutil
R=Path(__file__).resolve().parents[1];F=R/'references/fusion-pixel-font/fusion-pixel-12px-monospaced-zh_hans.ttf'
base={'about':'关于我','agent':'客服评测','boss':'投递助手','content':'多语内容','coze':'短视频工作流','development':'工具开发','editorial':'多语内容','interface':'界面体验','landing':'落地页设计','link':'链接下载','messaging':'即时通讯','n8n':'自动化工作流','offline':'离线访问','policy':'政策解读','product':'产品设计','retail':'增长分析','skills':'本地化翻译','wps':'宣誓书指南'}
ai={'article-craft':'文章创作','batch-compose':'批量撰写','content-manager':'内容管理','batch-refine':'批量精修','multilingual-flow':'多语翻译','asset-library':'素材管理','feature-landing':'功能落地页','event-measure':'事件衡量','layout-kit':'排版组件','page-standard':'页面规范','access-gateway':'访问网关','n8n-workflow':'工作流编排','agent-skills':'智能体与工作流','n8n-wide':'站点巡检'}
flow=['岗位解析','事实匹配','定制招呼','送达检查','事实档案','发送授权','双重核验']
backup=R/'references/alpha-posters';backup.mkdir(exist_ok=True)
files=list((R/'public/assets').glob('card-*.webp'))+list((R/'public/assets/ai-suite').glob('*.webp'))+list((R/'public/assets/boss-flow').glob('*.webp'))
count=0
for p in files:
 if 'about-home' in p.name:continue
 if p.parent.name=='ai-suite':label=ai.get(p.stem.removesuffix('-sm'))
 elif p.parent.name=='boss-flow':label=flow[int(p.stem.split('-')[1])]
 else:label=base.get(p.stem.split('-')[1])
 if not label:continue
 dest=backup/p.relative_to(R/'public/assets');dest.parent.mkdir(exist_ok=True,parents=True)
 if not dest.exists():shutil.copy2(p,dest)
 src=Image.open(dest);frames=[]
 for f in ImageSequence.Iterator(src):
  im=f.convert('RGBA');w,h=im.size;size=48 if w>=900 else 36;size=48 if w>1000 else size
  ft=ImageFont.truetype(str(F),size);mask=Image.new('L',im.size);d=ImageDraw.Draw(mask)
  x=round(w*.04);y=round(h*.69) if w/h<2 else round(h*.20)
  if 'card-link' in p.name:x=round(w*.064)
  d.text((x,y),label,font=ft,fill=255)
  col='#252529' if '-light' in p.stem else '#eceef2';layer=Image.new('RGBA',im.size,col);layer.putalpha(mask);im=Image.alpha_composite(im,layer);frames.append(im)
 frames[0].save(p,save_all=True,append_images=frames[1:],duration=110,loop=0,quality=82,method=4);frames[0].save(p.with_suffix('.png'));count+=1
print(f'Solid Chinese pixel captions: {count} assets')
