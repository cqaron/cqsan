"""AI suite posters: 900x600, 12x110ms, fixed typography and one blue motion layer."""
from pathlib import Path
import math
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/assets/ai-suite'
OUT.mkdir(parents=True, exist_ok=True)
BG, FG, DIM, LINE, BLUE = '#0a0a0a', '#eceef2', '#6e727c', '#34373e', '#2e2ee6'
NAMES = ['article-craft', 'batch-compose', 'content-manager', 'batch-refine', 'multilingual-flow', 'asset-library', 'feature-landing', 'event-measure', 'layout-kit', 'page-standard', 'access-gateway', 'n8n-workflow', 'agent-skills']
def font(n, bold=False):
    return ImageFont.truetype(str(ROOT/'public/fonts'/f'JetBrainsMono-{"Bold" if bold else "Regular"}.ttf'), n)

def frame(name, idx, f):
    im = Image.new('RGB', (900,600), BG); d = ImageDraw.Draw(im)
    for x in range(0,900,36): d.line((x,0,x,600), fill='#121214')
    for y in range(0,600,36): d.line((0,y,900,y), fill='#121214')
    for x,y in [(24,24),(876,24),(24,576),(876,576)]:
        d.line((x-6,y,x+6,y), fill=LINE); d.line((x,y-6,x,y+6),fill=LINE)
    d.text((36,35), 'AI / WORKFLOWS' if idx==11 else 'AI / AGENT SKILLS', font=font(17,True), fill=DIM)
    t=f/12*math.tau; shift=math.sin(t)*12
    if idx==12:
        # CLI front plane: fixed command, a breathing cursor and a routed signal.
        d.rounded_rectangle((40,100,860,416),radius=12,outline=LINE,width=2)
        d.text((72,133),'>',font=font(68,True),fill=FG)
        d.text((133,147),'agent run',font=font(53,True),fill=FG)
        d.text((78,242),'--skills 11',font=font(25),fill=DIM)
        d.text((78,291),'--tools mcp',font=font(25),fill=DIM)
        d.text((78,340),'--flow n8n',font=font(25),fill=DIM)
        for j,label in enumerate(['SKILLS','MCP','n8n']):
            y=147+j*85
            d.rounded_rectangle((642,y,820,y+55),radius=7,outline=LINE,width=2)
            d.text((661,y+14),label,font=font(22,True),fill=FG)
        d.line((493,177,566,177,566,259,642,259),fill=DIM,width=2)
        d.line((566,177,642,177),fill=LINE,width=2)
        d.line((566,259,566,344,642,344),fill=LINE,width=2)
        # Two small periodic layers; the typography and routes never move.
        d.ellipse((552,244+shift,572,264+shift),fill=BLUE)
        d.rectangle((443+shift,150,462+shift,199),fill=BLUE)
        title='AGENT SKILLS'; note='// orchestration / 11 skills / n8n'
    elif idx==11:
        for j in range(5):
            x=85+j*150; y=170+(j%2)*52
            if j<4:d.line((x+90,y+48,x+125,y+48,x+125,170+((j+1)%2)*52+48,x+150,170+((j+1)%2)*52+48),fill=DIM,width=2)
            d.rounded_rectangle((x,y,x+90,y+96),radius=10,outline=LINE,width=2)
            d.text((x+24,y+28),['T','{}','?','AI','+'][j],font=font(27,True),fill=FG)
        d.ellipse((410+shift,252,430+shift,272),fill=BLUE)
        title='n8n WORKFLOWS';note='// collect / check / compare / review'
    else:
        kind=idx%5
        if kind==0:
            for j in range(3):
                x=235+j*88;y=120+j*32
                d.rounded_rectangle((x,y,x+255,y+230),radius=8,outline=LINE,width=2)
                for k in range(3):d.line((x+35,y+55+k*35,x+190-k*22,y+55+k*35),fill=DIM,width=3)
            d.line((445,315+shift,570,315+shift),fill=BLUE,width=5)
        elif kind==1:
            for j in range(3):
                for k in range(4):
                    x=175+k*140;y=132+j*73
                    d.rounded_rectangle((x,y,x+112,y+48),radius=6,outline=LINE,width=2)
            d.rectangle((195,157+shift,267,161+shift),fill=BLUE)
        elif kind==2:
            d.rounded_rectangle((190,120,710,365),radius=10,outline=LINE,width=2)
            for j,w in enumerate([230,340,170]):
                y=175+j*58;d.line((230,y,230+w,y),fill=DIM,width=10)
            d.ellipse((592+shift,273,612+shift,293),fill=BLUE)
        elif kind==3:
            for j in range(3):
                x=155+j*200; d.rounded_rectangle((x,173,x+140,303),radius=10,outline=LINE,width=2)
                if j<2:d.line((x+140,238,x+200,238),fill=DIM,width=2)
                d.text((x+40,210),['IN','AI','OK'][j],font=font(27,True),fill=FG)
            d.ellipse((478+shift,228,498+shift,248),fill=BLUE)
        else:
            d.text((150,133),['EN','ES','DE'][idx%3],font=font(114,True),fill=FG)
            d.text((480,207),['{}','Aa','//'][idx%3],font=font(75),fill=DIM)
            d.line((178,310,355+shift,310),fill=BLUE,width=5)
        title=name.upper().replace('-', ' ');note='// skill / workflow / review'
    # Text is baked once in the static plane; no moving labels or invented counters.
    size=37
    while d.textlength(title,font=font(size,True))>820:size-=1
    d.text((36,472),title,font=font(size,True),fill=FG)
    d.text((864,553),note,font=font(15),fill=DIM,anchor='ra')
    return im

for idx,name in enumerate(NAMES):
    frames=[frame(name,idx,f) for f in range(12)]
    frames[0].save(OUT/f'{name}.jpg',quality=85)
    for suffix,size in [('',(900,600)),('-sm',(600,400))]:
        seq=[im.resize(size,Image.Resampling.LANCZOS) for im in frames]
        seq[0].save(OUT/f'{name}{suffix}.webp',save_all=True,append_images=seq[1:],duration=110,loop=0,quality=80,method=6)
    print(name,(OUT/f'{name}.webp').stat().st_size)

def wide(f):
    im=Image.new('RGB',(1800,480),BG);d=ImageDraw.Draw(im)
    for x in range(0,1800,36):d.line((x,0,x,480),fill='#121214')
    for y in range(0,480,36):d.line((0,y,1800,y),fill='#121214')
    for x,y in [(30,30),(1770,30),(30,450),(1770,450)]:
        d.line((x-7,y,x+7,y),fill=LINE);d.line((x,y-7,x,y+7),fill=LINE)
    d.text((52,48),'AI / n8n / DEEPSEEK',font=font(20,True),fill=DIM)
    d.text((50,157),'SITE AUDIT',font=font(65,True),fill=FG)
    d.text((52,250),'n8n workflows',font=font(26),fill=DIM)
    labels=['COLLECT','CHECK','COMPARE','REVIEW']
    for j in range(4):
        x=700+j*244;y=127+(j%2)*38
        d.rounded_rectangle((x,y,x+168,y+134),radius=12,outline=LINE,width=2)
        d.text((x+22,y+24),['{}','?','+/-','OK'][j],font=font(35,True),fill=FG)
        d.text((x+22,y+92),labels[j],font=font(17),fill=DIM)
        if j<3:
            yy=127+((j+1)%2)*38+67
            d.line((x+168,y+67,x+204,y+67,x+204,yy,x+244,yy),fill=DIM,width=2)
    shift=math.sin(f/12*math.tau)*12
    d.ellipse((1095+shift,219,1113+shift,237),fill=BLUE)
    d.text((1748,422),'// scheduled checks / change tracking / human review',font=font(18),fill=DIM,anchor='ra')
    return im

seq=[wide(f) for f in range(12)]
seq[0].save(OUT/'n8n-wide.jpg',quality=85)
seq[0].save(OUT/'n8n-wide.webp',save_all=True,append_images=seq[1:],duration=110,loop=0,quality=80,method=6)
