from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import math
R=Path(__file__).resolve().parents[2];O=R/'public/assets';PX=R/'references/fusion-pixel-font/fusion-pixel-12px-monospaced-zh_hans.ttf'
def font(n,b=False):return ImageFont.truetype(str(R/'public/fonts'/('JetBrainsMono-Bold.ttf' if b else 'JetBrainsMono-Regular.ttf')),n)
def frame(kind,f):
 im=Image.new('RGBA',(900,600),(0,0,0,0));d=ImageDraw.Draw(im);t=f/12*math.tau;shift=math.sin(t)*14
 for x in range(36,900,36):
  for y in range(36,600,36):d.point((x,y),fill='#34373e')
 for x,y in [(24,24),(876,24),(24,576),(876,576)]:d.line((x-6,y,x+6,y),fill='#34373e');d.line((x,y-6,x,y+6),fill='#34373e')
 d.text((36,35),'CONTENT / ENGLISH' if kind=='wps' else 'PRODUCT / LINK DOWNLOAD',font=font(17,True),fill='#6e727c')
 if kind=='wps':
  d.text((95,150),'PDF',font=font(110,True),fill='#eceef2');d.text((100,278),'WPS',font=font(36),fill='#6e727c')
  d.rounded_rectangle((480,105,735,365),radius=12,outline='#6e727c',width=2)
  d.line((510,148,637,148),fill='#eceef2',width=7)
  for y in [190,225,260]:d.rounded_rectangle((510,y,704,y+20),radius=3,outline='#34373e',width=2)
  d.line((510,318,703,318),fill='#6e727c',width=2)
  d.line((545+shift,322,563+shift,304,583+shift,325,611+shift,295),fill='#2e2ee6',width=6)
  title='WPS PDF GUIDE';zh='英文文档指南'
 else:
  d.rounded_rectangle((90,110,560,175),radius=12,outline='#6e727c',width=2);d.text((114,127),'> paste(link)',font=font(24),fill='#eceef2')
  d.line((325,176,325,230,550,230),fill='#34373e',width=2)
  d.rounded_rectangle((550,160,780,335),radius=12,outline='#6e727c',width=2)
  d.rounded_rectangle((573,183,757,278),radius=8,outline='#34373e',width=2)
  d.polygon([(650,207),(650,250),(686,228)],fill='#eceef2')
  d.line((665,335,665,360,230,360,230,278),fill='#34373e',width=2)
  d.line((230,211,230,300,200,270),fill='#eceef2',width=5);d.line((230,300,260,270),fill='#eceef2',width=5);d.line((185,310,185,330,275,330,275,310),fill='#6e727c',width=3)
  d.rectangle((401+shift,218,423+shift,240),fill='#2e2ee6')
  title='LINK DOWNLOAD';zh='链接下载'
 ft=ImageFont.truetype(str(PX),48);d.text((36,410),zh,font=ft,fill='#eceef2');d.text((36,472),title,font=font(44,True),fill='#eceef2')
 return im
for kind in ['wps','link']:
 frames=[frame(kind,i) for i in range(12)]
 for suffix,size in [('',(900,600)),('-sm',(600,400))]:
  fs=[im.resize(size,Image.Resampling.LANCZOS) for im in frames];p=O/f'card-{kind}-anim{suffix}.webp';fs[0].save(p,save_all=True,append_images=fs[1:],duration=110,loop=0,quality=82,method=6);fs[0].save(p.with_suffix('.png'))
 print(kind,(O/f'card-{kind}-anim.webp').stat().st_size)
