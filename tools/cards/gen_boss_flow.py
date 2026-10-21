from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import math
R=Path(__file__).resolve().parents[2];O=R/'public/assets/boss-flow';O.mkdir(exist_ok=True)
def font(n,b=False):return ImageFont.truetype(str(R/'public/fonts'/('JetBrainsMono-Bold.ttf' if b else 'JetBrainsMono-Regular.ttf')),n)
titles=['JD PARSER','EVIDENCE MATCH','ROLE GREETING','DELIVERY CHECK','FACT RECORD','AUTHORISATION','DUAL RECEIPT']
labels=[['JOB DESCRIPTION','REQUIRED','RESPONSIBILITY','PREFERRED'],['ROLE','EVIDENCE','MATCH'],['CONTEXT','ACTION','RESULT','REVIEW'],['APPROVAL','CDP SENDER','RECEIPT'],['EXPERIENCE','SKILLS','WRITING RULES'],['ROLE / CONTACT','MESSAGE','FILE HASH','AUTHORISATION'],['MESSAGE','RESUME IMAGE','VERIFIED']]
def frame(k,f):
 im=Image.new('RGB',(900,600),'#0a0a0a');d=ImageDraw.Draw(im);t=f/12*math.tau;dy=math.sin(t)*14
 for x in range(0,900,36):
  for y in range(0,600,36):d.point((x,y),fill='#34373e')
 for x,y in [(24,24),(876,24),(24,576),(876,576)]:d.line((x-6,y,x+6,y),fill='#34373e');d.line((x,y-6,x,y+6),fill='#34373e')
 d.text((36,34),'MCP / WORKFLOW',font=font(17,True),fill='#6e727c')
 if k in [0,1,3,6]:
  xs=[100,355,610]
  for i,x in enumerate(xs):
   d.rounded_rectangle((x,170,x+190,330),radius=12,outline='#6e727c',width=2)
   lab=labels[k][min(i,len(labels[k])-1)]
   if k==0 and i>0:lab=labels[k][i]
   d.text((x+12,192),lab,font=font(14,True),fill='#eceef2')
   if i<2:d.line((x+190,250,x+255,250),fill='#34373e',width=2)
   if i==2:d.line((x+60,263,x+80,283,x+125,232),fill='#eceef2',width=5)
   else:
    for j in range(3):d.line((x+22,235+j*25,x+150-j*15,235+j*25),fill='#6e727c',width=4)
  d.rectangle((316,238+dy,340,262+dy),fill='#2e2ee6')
 elif k==2:
  d.rounded_rectangle((130,125,770,370),radius=12,outline='#6e727c',width=2)
  d.text((160,152),'> compose(role, evidence)',font=font(25,True),fill='#eceef2')
  for i,l in enumerate(labels[k]):d.text((160,210+i*31),l.lower(),font=font(20),fill='#2e2ee6' if i==3 else '#6e727c')
  d.rectangle((280,299+dy,294,319+dy),fill='#2e2ee6')
 elif k==4:
  for j in range(3):
   x=205+j*44;y=115+j*40
   d.rounded_rectangle((x,y,x+370,y+170),radius=12,fill='#0a0a0a',outline='#6e727c',width=2)
   d.text((x+24,y+23),labels[k][j],font=font(24,True),fill='#eceef2')
  d.rectangle((317,310+dy,485,318+dy),fill='#2e2ee6')
 else:
  d.rounded_rectangle((190,110,710,380),radius=12,outline='#6e727c',width=2)
  for i,l in enumerate(labels[k]):
   y=145+i*56;d.rectangle((225,y,245,y+20),outline='#2e2ee6',width=2);d.text((270,y-3),l,font=font(22),fill='#eceef2')
  d.rectangle((221,137+dy,249,141+dy),fill='#2e2ee6')
 d.text((36,469),titles[k],font=font(44,True),fill='#eceef2')
 return im
for k in range(7):
 fs=[frame(k,i) for i in range(12)];fs[0].save(O/f'flow-{k}.webp',save_all=True,append_images=fs[1:],duration=110,loop=0,quality=82,method=6);fs[0].save(O/f'flow-{k}.jpg',quality=85)
print('Seven standard posters generated')
