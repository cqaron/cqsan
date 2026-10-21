"""Two original editorial posters, matching the site's 3:2 motion-card series.
12 frames x 110ms, 900x600 / 600x400, retained original assets untouched.
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/assets'
FG, DIM, FAINT, BLUE = '#eceef2', '#6e727c', '#34373e', '#2e2ee6'

def font(size, bold=False):
    return ImageFont.truetype(str(ROOT / 'public/fonts' / ('JetBrainsMono-Bold.ttf' if bold else 'JetBrainsMono-Regular.ttf')), size)

def draw_frame(frame, wps=False):
    im = Image.new('RGB', (900, 600), '#0a0a0a')
    d = ImageDraw.Draw(im)
    for x in range(0, 900, 36):
        for y in range(0, 600, 36):
            d.point((x, y), fill='#18181a')
    for x,y in [(24,24),(876,24),(24,576),(876,576)]:
        d.line((x-6,y,x+6,y),fill=FAINT)
        d.line((x,y-6,x,y+6),fill=FAINT)
    phase=frame/12*math.tau
    d.text((36,40),'CONTENT' if not wps else 'CONTENT / WPS',font=font(17,True),fill=DIM)
    if not wps:
        # Three close-up language glyphs: legible even in a small carousel tile.
        chinese = ImageFont.truetype('C:/Windows/Fonts/msyh.ttc', 156)
        for k,(glyph,tag) in enumerate([('Aa','EN'),('Ñ','ES'),('文','ZH')]):
            x=38+k*278; y=105+round(math.sin(phase+k*.8)*5)
            d.rectangle((x,y,x+266,y+304),fill='#111113',outline='#4a4d54',width=1)
            d.text((x+20,y+15),tag,font=font(20),fill=DIM)
            glyph_font=chinese if k==2 else font(160,True)
            box=d.textbbox((0,0),glyph,font=glyph_font)
            gx=x+(266-(box[2]-box[0]))/2-box[0]
            gy=y+74-box[1]
            d.text((gx,gy),glyph,font=glyph_font,fill=FG)
            if k==1:
                xx=x+24+round(math.sin(phase)*8)
                d.rectangle((xx,y+270,xx+115,y+274),fill=BLUE)
                d.rectangle((xx+120,y+263,xx+123,y+280),fill=BLUE)
        d.text((36,480),'MULTILINGUAL STORIES',font=font(37,True),fill=FG)
        d.text((864,554),'// EN · ES · ZH',font=font(18),fill=DIM,anchor='ra')
    else:
        # PDF and signature are the two recognizable shapes, no tiny process labels.
        d.text((38,145),'PDF',font=font(165,True),fill=FG)
        d.text((48,333),'WPS / ENGLISH',font=font(21),fill=DIM)
        x,y=430,96
        d.rectangle((x,y,850,424),fill='#111113',outline='#4a4d54',width=2)
        d.text((x+30,y+26),'AFFIDAVIT',font=font(31,True),fill=FG)
        for j,length in enumerate([345,300,326]):
            d.line((x+30,y+99+j*27,x+30+length,y+99+j*27),fill=DIM,width=3)
        d.line((x+30,y+272,x+360,y+272),fill='#4a4d54',width=2)
        offset=math.sin(phase)*8
        points=[]
        for i in range(121):
            t=i/120;px=x+50+t*270;py=y+234-24*math.sin(t*math.pi*3)-13*math.sin(t*math.pi*7)+offset
            points.append((px,py))
        d.line(points,fill=BLUE,width=5)
        d.text((36,480),'AFFIDAVIT / WPS PDF',font=font(37,True),fill=FG)
        d.text((864,554),'// prepare · fill · sign',font=font(18),fill=DIM,anchor='ra')
    return im

for name,wps in [('editorial',False),('wps',True)]:
    frames=[draw_frame(i,wps) for i in range(12)]
    for suffix,size in [('',(900,600)),('-sm',(600,400))]:
        seq=[im.resize(size,Image.Resampling.LANCZOS) for im in frames]
        path=OUT/f'card-{name}-anim{suffix}.webp'
        seq[0].save(path,save_all=True,append_images=seq[1:],duration=110,loop=0,quality=80,method=6)
        print(path.name, path.stat().st_size)
