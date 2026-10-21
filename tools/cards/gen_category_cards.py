from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import math
R=Path(__file__).resolve().parents[2];O=R/'public/assets'
def font(n,b=False):return ImageFont.truetype(str(R/'public/fonts'/('JetBrainsMono-Bold.ttf' if b else 'JetBrainsMono-Regular.ttf')),n)
def frame(kind,f):
 im=Image.new('RGB',(900,600),'#0a0a0a');d=ImageDraw.Draw(im);t=f/12*math.tau;dy=math.sin(t)*15
 for x in range(0,900,36):
  for y in range(0,600,36):d.point((x,y),fill='#34373e')
 for x,y in [(24,24),(876,24),(24,576),(876,576)]:d.line((x-6,y,x+6,y),fill='#34373e');d.line((x,y-6,x,y+6),fill='#34373e')
 d.text((36,35),kind.upper(),font=font(17,True),fill='#6e727c')
 if kind=='product':
  d.rounded_rectangle((185,110,715,385),radius=12,outline='#eceef2',width=2)
  d.line((185,158,715,158),fill='#34373e',width=2)
  for x in [210,227,244]:d.ellipse((x,131,x+5,136),fill='#6e727c')
  d.rounded_rectangle((214,190,350,354),radius=8,outline='#6e727c',width=2)
  for y in [206,229,252,275]:d.line((234,y,319,y),fill='#6e727c',width=4)
  d.rounded_rectangle((382,190,683,245),radius=8,outline='#34373e',width=2)
  d.rounded_rectangle((382,266+dy,517,354+dy),radius=8,fill='#2e2ee6')
  d.rounded_rectangle((539,266,683,354),radius=8,outline='#6e727c',width=2)
 else:
  d.text((125,110),'Aa',font=font(150,True),fill='#eceef2')
  d.text((500,180),'EN',font=font(45,True),fill='#eceef2')
  d.text((620,180),'ES',font=font(45,True),fill='#6e727c')
  for y,w in [(264,230),(292,180),(320,210)]:d.line((500,y,500+w,y),fill='#6e727c',width=6)
  d.rectangle((120,330+dy,345,350+dy),fill='#2e2ee6')
  d.line((390,135,390,375),fill='#34373e',width=2)
  d.text((500,114),'</>',font=font(31),fill='#2e2ee6')
 d.text((36,465),kind.upper(),font=font(53,True),fill='#eceef2')
 return im
for kind in ['product','content']:
 frames=[frame(kind,i) for i in range(12)]
 for suffix,size in [('',(900,600)),('-sm',(600,400))]:
  fs=[im.resize(size,Image.Resampling.LANCZOS) for im in frames]
  fs[0].save(O/f'card-{kind}-category{suffix}.webp',save_all=True,append_images=fs[1:],duration=110,loop=0,quality=82,method=6)
 frames[0].save(O/f'card-{kind}-category.jpg',quality=85)
