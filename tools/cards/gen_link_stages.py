from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import math
R=Path(__file__).resolve().parents[2];O=R/'public/assets/link-stages';O.mkdir(exist_ok=True)
PX=R/'references/fusion-pixel-font/fusion-pixel-12px-monospaced-zh_hans.ttf'
titles=['PASTE / PARSE','MEDIA PREVIEW','PREPARATION','DOWNLOAD READY','WEB QUOTA','RETRY / RESUME','EVENT TRACKING'];chinese=['链接解析','媒体预览','下载准备','完成反馈','下载额度','失败与重试','埋点与指标']
def ft(n,b=False):return ImageFont.truetype(str(R/'public/fonts'/('JetBrainsMono-Bold.ttf' if b else 'JetBrainsMono-Regular.ttf')),n)
def frame(k,f):
 im=Image.new('RGBA',(900,600));d=ImageDraw.Draw(im);t=f/12*math.tau;v=math.sin(t)*14
 for x in range(36,900,36):
  for y in range(36,600,36):d.point((x,y),fill='#34373e')
 for x,y in [(24,24),(876,24),(24,576),(876,576)]:d.line((x-6,y,x+6,y),fill='#34373e');d.line((x,y-6,x,y+6),fill='#34373e')
 if k==0:
  d.rounded_rectangle((115,155,785,295),radius=12,outline='#6e727c',width=2);d.text((150,198),'> t.me/channel/123',font=ft(37),fill='#eceef2');d.rectangle((680+v,211,700+v,250),fill='#2e2ee6')
 elif k==1:
  d.rounded_rectangle((210,100,690,355),radius=12,outline='#6e727c',width=2);d.polygon([(408,153),(408,255),(498,204)],fill='#eceef2');d.line((245,315,650,315),fill='#34373e',width=4);d.rectangle((245,308+v,350,316+v),fill='#2e2ee6')
 elif k==2:
  d.text((260,138),'10',font=ft(140,True),fill='#eceef2');d.text((450,217),'s',font=ft(58),fill='#6e727c');d.line((220,330,680,330),fill='#34373e',width=3);d.rectangle((430+v,319,452+v,341),fill='#2e2ee6')
 elif k==3:
  d.rounded_rectangle((325,108,575,355),radius=12,outline='#6e727c',width=2);d.line((375,230,430,285,528,176),fill='#eceef2',width=9);d.rectangle((550,120+v,566,136+v),fill='#2e2ee6')
 elif k==4:
  d.text((115,157),'10',font=ft(115,True),fill='#eceef2');d.text((145,295),'/ 24h',font=ft(26),fill='#6e727c');d.line((402,130,402,350),fill='#34373e',width=2);d.text((480,157),'50',font=ft(115,True),fill='#eceef2');d.text((525,295),'MB',font=ft(26),fill='#6e727c');d.rectangle((116,335+v,300,342+v),fill='#2e2ee6')
 elif k==5:
  d.arc((315,100,585,370),25,320,fill='#6e727c',width=3);d.polygon([(554,121),(596,164),(543,174)],fill='#eceef2');d.text((390,181),'0',font=ft(90,True),fill='#eceef2');d.ellipse((320+v,298,338+v,316),fill='#2e2ee6')
 else:
  d.line((210,345,700,345),fill='#6e727c',width=2)
  for j,(h,label) in enumerate([(95,'PARSE'),(155,'VIEW'),(215,'CLICK')]):
   x=260+j*155;d.rectangle((x,345-h,x+65,344),outline='#6e727c',width=2);d.text((x-5,363),label,font=ft(16),fill='#6e727c')
  d.rectangle((571,125+v,634,139+v),fill='#2e2ee6')
 d.text((36,412),chinese[k],font=ImageFont.truetype(str(PX),48),fill='#eceef2');d.text((36,476),titles[k],font=ft(39,True),fill='#eceef2');return im
for k in range(7):
 fs=[frame(k,i) for i in range(12)];p=O/f'stage-{k}.webp';fs[0].save(p,save_all=True,append_images=fs[1:],duration=110,loop=0,quality=82,method=6);fs[0].save(p.with_suffix('.png'))
print('7 transparent stage posters generated')
