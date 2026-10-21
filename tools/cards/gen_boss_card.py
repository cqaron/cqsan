from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import math
R=Path(__file__).resolve().parents[2];O=R/'public/assets'
def font(s,b=False):return ImageFont.truetype(str(R/'public/fonts'/('JetBrainsMono-Bold.ttf' if b else 'JetBrainsMono-Regular.ttf')),s)
def frame(f,category=False):
 im=Image.new('RGB',(900,600),'#0a0a0a');d=ImageDraw.Draw(im)
 for x in range(0,900,36):
  for y in range(0,600,36):d.ellipse((x,y,x+1,y+1),fill='#25252b')
 for x,y in [(24,24),(876,24),(24,576),(876,576)]:d.line((x-6,y,x+6,y),fill='#34373e');d.line((x,y-6,x,y+6),fill='#34373e')
 d.text((36,35),'DEVELOPMENT / MCP',font=font(17,True),fill='#6e727c')
 d.line((150,265,750,265),fill='#34373e',width=2)
 for i,x in enumerate([150,350,550,750]):
  d.rounded_rectangle((x-62,190,x+62,340),radius=8,fill='#101013',outline='#6e727c',width=2)
  if i==0:
   for j in range(4):d.line((x-37,224+j*22,x+33-(j%2)*15,224+j*22),fill='#eceef2',width=4)
  elif i==1:
   for a in range(5):
    for b in range(5):d.rectangle((x-30+a*14,225+b*14,x-27+a*14,228+b*14),fill='#2e2ee6' if a==b else '#6e727c')
  elif i==2:d.text((x-35,233),'>_',font=font(44,True),fill='#eceef2')
  else:d.line((x-30,266,x-8,288,x+32,243),fill='#eceef2',width=6)
  d.text((x-60,363),(['INPUT','TOOLS','BUILD','OUTPUT'] if category else ['READ','MATCH','COMPOSE','VERIFY'])[i],font=font(15),fill='#6e727c')
 t=f/12*math.tau
 x=450+math.sin(t)*16
 d.rectangle((x-16,253,x+16,277),fill='#2e2ee6')
 d.text((36,461),'DEVELOPMENT' if category else 'BOSS ASSISTANT',font=font(49,True),fill='#eceef2')
 label='// browser / agent / ledger';d.text((864-d.textlength(label,font=font(16)),552),label,font=font(16),fill='#6e727c')
 return im
frames=[frame(i) for i in range(12)]
for suffix,size in [('',(900,600)),('-sm',(600,400))]:
 fs=[im.resize(size,Image.Resampling.LANCZOS) for im in frames]
 fs[0].save(O/f'card-boss-anim{suffix}.webp',save_all=True,append_images=fs[1:],duration=110,loop=0,quality=82,method=6)
frames[0].save(O/'card-boss.jpg',quality=85)
print('BOSS covers generated')

category_frames=[frame(i,True) for i in range(12)]
for suffix,size in [('',(900,600)),('-sm',(600,400))]:
 fs=[im.resize(size,Image.Resampling.LANCZOS) for im in category_frames]
 fs[0].save(O/f'card-development-anim{suffix}.webp',save_all=True,append_images=fs[1:],duration=110,loop=0,quality=82,method=6)
category_frames[0].save(O/'card-development.jpg',quality=85)
